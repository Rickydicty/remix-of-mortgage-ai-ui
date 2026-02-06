import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, X, FileText, CheckCircle2, AlertCircle, Sparkles, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { autoPopulateFormFromDocument } from "@/lib/autoPopulateFormData";
import { cn } from "@/lib/utils";

// Document type mapping for display
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  certified_id: "Certified ID",
  proof_of_address: "Proof of Address",
  application_form: "BI Application Form",
  payslips: "Payslips",
  current_account_statements: "Current Account Statements",
  savings_account_statements: "Savings Account Statements",
  employment_summary: "Employment Detail Summary",
  salary_cert: "Salary Certificate",
  marriage_certificate: "Marriage Certificate",
  self_employed_docs: "Self-Employed Documents",
  form_11: "Form 11 Tax Returns",
  chapter_4: "Chapter 4 Notices",
  business_bank_statements: "Business Bank Statements",
  ros_payment_charges: "ROS Payment & Charges",
  tax_clearance: "Tax Clearance Certificate",
  gift_letter: "Gift Letter",
  loan_account_statements: "Loan Account Statements",
  mortgage_statements: "Mortgage Statements",
  other: "Other Document",
};

interface QueuedDocument {
  id: string;
  file: File;
  detectedType: string | null;
  status: 'pending' | 'detecting' | 'uploading' | 'analyzing' | 'done' | 'error';
  progress: number;
  score?: number;
  error?: string;
}

interface SmartDocumentUploadProps {
  onUploadComplete?: () => void;
  employmentType?: string;
}

// Global state that persists across component unmounts (and survives HMR/tab switches)
interface GlobalUploadState {
  queue: QueuedDocument[];
  isProcessing: boolean;
  listeners: Set<(queue: QueuedDocument[]) => void>;
  processingPromise: Promise<void> | null;
}

type SmartUploadGlobal = typeof globalThis & {
  __smartDocumentUploadState?: GlobalUploadState;
};

const globalState: GlobalUploadState =
  (globalThis as SmartUploadGlobal).__smartDocumentUploadState ??
  ((globalThis as SmartUploadGlobal).__smartDocumentUploadState = {
    queue: [],
    isProcessing: false,
    listeners: new Set(),
    processingPromise: null,
  });

// Helper to notify all listeners of queue changes
const notifyListeners = () => {
  globalState.listeners.forEach(listener => listener([...globalState.queue]));
};

// Update a queue item globally
const updateGlobalQueueItem = (id: string, updates: Partial<QueuedDocument>) => {
  const index = globalState.queue.findIndex(doc => doc.id === id);
  if (index !== -1) {
    globalState.queue[index] = { ...globalState.queue[index], ...updates };
    notifyListeners();
  }
};

// Process a single document
const processDocument = async (doc: QueuedDocument, sessionToken: string, applicationId?: string) => {
  try {
    updateGlobalQueueItem(doc.id, { status: 'detecting', progress: 10 });

    const formData = new FormData();
    formData.append('file', doc.file);
    formData.append('documentType', 'auto');
    formData.append('autoDetect', 'true');

    updateGlobalQueueItem(doc.id, { status: 'uploading', progress: 25 });

    const response = await fetch(
      `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/analyze-document`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: formData,
      }
    );

    updateGlobalQueueItem(doc.id, { status: 'analyzing', progress: 60 });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    const score = data.document.score || 0;
    const detectedType = data.document.document_type || data.detectedType || 'other';
    const autoApproved = score >= 70;

    // Update document status in database
    await supabase
      .from('documents')
      .update({
        document_type: detectedType,
        approval_status: autoApproved ? 'approved' : 'pending',
        status: autoApproved ? 'approved' : 'waiting',
        confidence_score: score
      })
      .eq('id', data.document.id);

    updateGlobalQueueItem(doc.id, { progress: 80, detectedType });

    // Auto-populate form fields if approved
    if (autoApproved && applicationId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await autoPopulateFormFromDocument(
          data.document.id,
          detectedType,
          session.user.id,
          applicationId
        );
      }
    }

    updateGlobalQueueItem(doc.id, { 
      status: 'done', 
      progress: 100,
      score,
      detectedType
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    
    // Parse specific error types for user-friendly messages
    let displayError = errorMessage;
    if (errorMessage.includes('PAYMENT_REQUIRED') || errorMessage.includes('402')) {
      displayError = 'AI credits exhausted. Add credits in Settings → Workspace → Usage.';
    } else if (errorMessage.includes('RATE_LIMITED') || errorMessage.includes('429')) {
      displayError = 'Rate limit reached. Please wait and retry.';
    }
    
    console.error('Upload error for', doc.file.name, error);
    updateGlobalQueueItem(doc.id, { 
      status: 'error', 
      progress: 0,
      error: displayError
    });
    return { success: false };
  }
};

// Process all pending documents in background
const processQueueInBackground = async () => {
  // De-dupe: if a run is already in-flight, reuse it
  if (globalState.processingPromise) return globalState.processingPromise;

  const run = (async () => {
    if (globalState.isProcessing) return;

    globalState.isProcessing = true;
    notifyListeners();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      globalState.isProcessing = false;
      notifyListeners();
      return;
    }

    const { data: application } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    // Process in batches of 3
    const batchSize = 3;
    let successCount = 0;
    let errorCount = 0;

    while (true) {
      const pendingDocs = globalState.queue.filter(doc => doc.status === 'pending');
      if (pendingDocs.length === 0) break;

      const batch = pendingDocs.slice(0, batchSize);

      const results = await Promise.all(
        batch.map(doc => processDocument(doc, session.access_token, application?.id))
      );

      results.forEach(result => {
        if (result.success) successCount++;
        else errorCount++;
      });
    }

    // Trigger broker-agent analysis after all uploads
    if (application?.id && successCount > 0) {
      fetch(
        `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/broker-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "analyze_application",
            applicationId: application.id,
          }),
        }
      ).catch(err => console.log("AI analysis triggered:", err));

      supabase.functions.invoke('evaluate-application-state', {
        body: { application_id: application.id }
      }).catch(err => console.log("State evaluation triggered:", err));
    }

    globalState.isProcessing = false;
    notifyListeners();
  })();

  globalState.processingPromise = run.finally(() => {
    globalState.processingPromise = null;
  });

  return globalState.processingPromise;
};

export const SmartDocumentUpload = ({ onUploadComplete, employmentType }: SmartDocumentUploadProps) => {
  const [queue, setQueue] = useState<QueuedDocument[]>([...globalState.queue]);
  const [isProcessing, setIsProcessing] = useState(globalState.isProcessing);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Subscribe to global state changes
  useEffect(() => {
    const handleQueueChange = (newQueue: QueuedDocument[]) => {
      setQueue(newQueue);
      setIsProcessing(globalState.isProcessing);

      // Check if all done
      const allDone = newQueue.length > 0 && newQueue.every(d => d.status === 'done' || d.status === 'error');
      if (allDone && onUploadComplete) {
        onUploadComplete();
      }
    };

    globalState.listeners.add(handleQueueChange);

    // Sync initial state
    setQueue([...globalState.queue]);
    setIsProcessing(globalState.isProcessing);

    // If user navigated away mid-upload, ensure processing continues
    const hasWork = globalState.queue.some(d => d.status === 'pending') && !globalState.isProcessing;
    if (hasWork) {
      processQueueInBackground();
    }

    return () => {
      globalState.listeners.delete(handleQueueChange);
    };
  }, [onUploadComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFilesToQueue(files);
  }, []);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFilesToQueue(files);
      e.target.value = '';
    }
  };

  const addFilesToQueue = async (files: File[]) => {
    const newDocs: QueuedDocument[] = files
      .filter(file => file.type.startsWith('image/') || file.type === 'application/pdf')
      .map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        detectedType: null,
        status: 'pending' as const,
        progress: 0,
      }));
    
    if (newDocs.length > 0) {
      // Add to global queue
      globalState.queue.push(...newDocs);
      notifyListeners();
      
      toast({
        title: `${newDocs.length} file(s) added`,
        description: "AI is auto-detecting and uploading...",
      });

      // Auto-start processing in background
      processQueueInBackground();
    }
  };

  const removeFromQueue = (id: string) => {
    const index = globalState.queue.findIndex(doc => doc.id === id);
    if (index !== -1 && globalState.queue[index].status === 'pending') {
      globalState.queue.splice(index, 1);
      notifyListeners();
    }
  };

  const clearCompleted = () => {
    globalState.queue = globalState.queue.filter(doc => doc.status !== 'done' && doc.status !== 'error');
    notifyListeners();
  };

  const retryFailed = () => {
    globalState.queue.forEach(doc => {
      if (doc.status === 'error') {
        doc.status = 'pending';
        doc.progress = 0;
        doc.error = undefined;
      }
    });
    notifyListeners();
    processQueueInBackground();
  };

  const getStatusIcon = (status: QueuedDocument['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'detecting':
        return <Sparkles className="h-4 w-4 animate-pulse text-yellow-500" />;
      case 'uploading':
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusText = (doc: QueuedDocument) => {
    switch (doc.status) {
      case 'pending':
        return 'Waiting...';
      case 'detecting':
        return 'AI detecting type...';
      case 'uploading':
        return 'Uploading...';
      case 'analyzing':
        return 'AI analyzing...';
      case 'done':
        return doc.detectedType ? DOCUMENT_TYPE_LABELS[doc.detectedType] || doc.detectedType : 'Done';
      case 'error':
        return doc.error || 'Error';
    }
  };

  const pendingCount = queue.filter(d => d.status === 'pending').length;
  const processingCount = queue.filter(d => ['detecting', 'uploading', 'analyzing'].includes(d.status)).length;
  const doneCount = queue.filter(d => d.status === 'done').length;
  const errorCount = queue.filter(d => d.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Document Upload
        </CardTitle>
        <CardDescription>
          Drop any documents — AI will automatically identify, categorize, and upload them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFilesSelect}
            accept="image/*,application/pdf"
            multiple
            className="hidden"
          />
          <FolderOpen className={cn(
            "h-12 w-12 mx-auto mb-3",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-sm font-medium">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, JPG, PNG — AI auto-detects & uploads instantly
          </p>
        </div>

        {/* Queue Display */}
        {queue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium">
                {processingCount > 0 && (
                  <span className="text-primary">
                    <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                    {processingCount} processing
                  </span>
                )}
                {pendingCount > 0 && <span className="text-muted-foreground"> • {pendingCount} waiting</span>}
                {doneCount > 0 && <span className="text-green-600"> • {doneCount} done</span>}
                {errorCount > 0 && <span className="text-destructive"> • {errorCount} failed</span>}
              </p>
              <div className="flex gap-2">
                {errorCount > 0 && (
                  <Button variant="outline" size="sm" onClick={retryFailed}>
                    Retry failed
                  </Button>
                )}
                {doneCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCompleted}>
                    Clear completed
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {queue.map((doc) => (
                <div 
                  key={doc.id} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    doc.status === 'done' && "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
                    doc.status === 'error' && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
                    !['done', 'error'].includes(doc.status) && "bg-muted/50"
                  )}
                >
                  {getStatusIcon(doc.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getStatusText(doc)}
                    </p>
                    {['uploading', 'analyzing', 'detecting'].includes(doc.status) && (
                      <Progress value={doc.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  {doc.status === 'done' && doc.score !== undefined && (
                    <Badge variant="default" className="bg-green-500">
                      {doc.score}%
                    </Badge>
                  )}
                  {doc.status === 'pending' && !isProcessing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromQueue(doc.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {queue.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents in queue</p>
            <p className="text-xs">Drop files — they upload automatically</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
