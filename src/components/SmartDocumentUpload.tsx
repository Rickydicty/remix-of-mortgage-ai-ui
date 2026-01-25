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

// Store queue in a ref that persists across tab changes
const globalUploadQueue: QueuedDocument[] = [];

export const SmartDocumentUpload = ({ onUploadComplete, employmentType }: SmartDocumentUploadProps) => {
  const [queue, setQueue] = useState<QueuedDocument[]>(globalUploadQueue);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync queue to global store
  useEffect(() => {
    globalUploadQueue.length = 0;
    globalUploadQueue.push(...queue);
  }, [queue]);

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

  const addFilesToQueue = (files: File[]) => {
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
      setQueue(prev => [...prev, ...newDocs]);
      toast({
        title: `${newDocs.length} file(s) added`,
        description: "Click 'Upload All' to analyze with AI",
      });
    }
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(doc => doc.id !== id));
  };

  const updateQueueItem = useCallback((id: string, updates: Partial<QueuedDocument>) => {
    setQueue(prev => prev.map(doc => 
      doc.id === id ? { ...doc, ...updates } : doc
    ));
  }, []);

  const processQueue = async () => {
    if (queue.length === 0) {
      toast({
        title: "No documents",
        description: "Please add documents first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload documents",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    const { data: application } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    const pendingDocs = queue.filter(doc => doc.status === 'pending');
    let successCount = 0;
    let errorCount = 0;

    // Process in parallel batches of 3
    const batchSize = 3;
    for (let i = 0; i < pendingDocs.length; i += batchSize) {
      const batch = pendingDocs.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (doc) => {
        try {
          updateQueueItem(doc.id, { status: 'detecting', progress: 10 });

          const formData = new FormData();
          formData.append('file', doc.file);
          // Send "auto" to trigger AI detection
          formData.append('documentType', 'auto');
          formData.append('autoDetect', 'true');

          updateQueueItem(doc.id, { status: 'uploading', progress: 25 });

          const response = await fetch(
            `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/analyze-document`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: formData,
            }
          );

          updateQueueItem(doc.id, { status: 'analyzing', progress: 60 });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          const score = data.document.score || 0;
          const detectedType = data.document.document_type || data.detectedType || 'other';
          const autoApproved = score >= 70;

          // Update document status
          await supabase
            .from('documents')
            .update({
              document_type: detectedType,
              approval_status: autoApproved ? 'approved' : 'pending',
              status: autoApproved ? 'approved' : 'waiting',
              confidence_score: score
            })
            .eq('id', data.document.id);

          updateQueueItem(doc.id, { progress: 80, detectedType });

          // Auto-populate form fields
          if (autoApproved && application?.id) {
            await autoPopulateFormFromDocument(
              data.document.id,
              detectedType,
              session.user.id,
              application.id
            );
          }

          updateQueueItem(doc.id, { 
            status: 'done', 
            progress: 100,
            score,
            detectedType
          });
          successCount++;

        } catch (error) {
          console.error('Upload error for', doc.file.name, error);
          updateQueueItem(doc.id, { 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : 'Upload failed'
          });
          errorCount++;
        }
      }));
    }

    // Trigger broker-agent analysis
    if (application?.id) {
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

    setIsProcessing(false);

    toast({
      title: "Upload complete",
      description: `${successCount} documents processed${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });

    if (successCount > 0 && onUploadComplete) {
      onUploadComplete();
    }
  };

  const clearCompleted = () => {
    setQueue(prev => prev.filter(doc => doc.status !== 'done'));
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
        return 'Ready';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Document Upload
        </CardTitle>
        <CardDescription>
          Drop any documents — AI will automatically identify and categorize them
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
            PDF, JPG, PNG — AI will detect document types
          </p>
        </div>

        {/* Queue Display */}
        {queue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {pendingCount > 0 && `${pendingCount} ready`}
                {processingCount > 0 && ` • ${processingCount} processing`}
                {doneCount > 0 && ` • ${doneCount} done`}
              </p>
              {doneCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Clear completed
                </Button>
              )}
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
                  {doc.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromQueue(doc.id)}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <Button
          onClick={processQueue}
          disabled={pendingCount === 0 || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing {processingCount} of {queue.length}...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload All ({pendingCount} documents)
            </>
          )}
        </Button>

        {queue.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents in queue</p>
            <p className="text-xs">Drop files or click to add them</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
