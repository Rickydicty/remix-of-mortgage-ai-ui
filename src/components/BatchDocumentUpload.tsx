import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, X, FileText, CheckCircle2, AlertCircle, Files } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { autoPopulateFormFromDocument } from "@/lib/autoPopulateFormData";

const DOCUMENT_TYPES = [
  { value: "certified_id", label: "Certified ID" },
  { value: "proof_of_address", label: "Proof of Address" },
  { value: "application_form", label: "BI Application Form" },
  { value: "payslips", label: "3 Months Payslips" },
  { value: "current_account_statements", label: "6 Months Current Account Statements" },
  { value: "savings_account_statements", label: "6 Months Savings Account Statements" },
  { value: "employment_summary", label: "Employment Detail Summary" },
  { value: "salary_cert", label: "Salary Certificate (BPFI)" },
  { value: "marriage_certificate", label: "Marriage Certificate" },
  { value: "self_employed_docs", label: "Self-Employed Documents" },
  { value: "form_11", label: "Form 11 Tax Returns" },
  { value: "chapter_4", label: "Chapter 4 Notices" },
  { value: "business_bank_statements", label: "Business Bank Statements" },
  { value: "ros_payment_charges", label: "ROS Payment & Charges Form" },
  { value: "tax_clearance", label: "Tax Clearance Certificate" },
  { value: "gift_letter", label: "Gift Letter" },
  { value: "loan_account_statements", label: "6 Months Loan Account Statements" },
  { value: "mortgage_statements", label: "12 Months Mortgage Statements" },
  { value: "other", label: "Other Documents" },
];

interface QueuedDocument {
  id: string;
  file: File;
  documentType: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error';
  progress: number;
  score?: number;
  error?: string;
}

interface BatchDocumentUploadProps {
  onUploadComplete?: () => void;
}

export const BatchDocumentUpload = ({ onUploadComplete }: BatchDocumentUploadProps) => {
  const [queue, setQueue] = useState<QueuedDocument[]>([]);
  const [currentDocType, setCurrentDocType] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentDocType) {
      toast({
        title: "Select document type first",
        description: "Please select a document type before adding files",
        variant: "destructive",
      });
      return;
    }

    if (e.target.files) {
      const newDocs: QueuedDocument[] = Array.from(e.target.files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        documentType: currentDocType,
        status: 'pending' as const,
        progress: 0,
      }));
      setQueue(prev => [...prev, ...newDocs]);
      setCurrentDocType("");
      // Reset input
      e.target.value = '';
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
        description: "Please add documents to the queue first",
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

    // Process all documents in parallel batches of 3
    const batchSize = 3;
    for (let i = 0; i < pendingDocs.length; i += batchSize) {
      const batch = pendingDocs.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (doc) => {
        try {
          updateQueueItem(doc.id, { status: 'uploading', progress: 25 });

          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('documentType', doc.documentType);

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
          const autoApproved = score >= 70;

          // Update document status
          await supabase
            .from('documents')
            .update({
              approval_status: autoApproved ? 'approved' : 'pending',
              status: autoApproved ? 'approved' : 'waiting',
              confidence_score: score
            })
            .eq('id', data.document.id);

          updateQueueItem(doc.id, { progress: 80 });

          // Auto-populate form fields
          if (autoApproved && application?.id) {
            await autoPopulateFormFromDocument(
              data.document.id,
              doc.documentType,
              session.user.id,
              application.id
            );
          }

          updateQueueItem(doc.id, { 
            status: 'done', 
            progress: 100,
            score 
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

    // Trigger broker-agent analysis for all documents at once
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
      ).catch(err => console.log("Batch AI analysis triggered:", err));

      // Evaluate application state
      supabase.functions.invoke('evaluate-application-state', {
        body: { application_id: application.id }
      }).catch(err => console.log("State evaluation triggered:", err));
    }

    setIsProcessing(false);

    toast({
      title: "Batch upload complete",
      description: `${successCount} documents processed successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
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
      case 'uploading':
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (doc: QueuedDocument) => {
    switch (doc.status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'uploading':
        return <Badge variant="default">Uploading...</Badge>;
      case 'analyzing':
        return <Badge variant="default">Analyzing...</Badge>;
      case 'done':
        return <Badge variant="default" className="bg-green-500">Score: {doc.score}</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const pendingCount = queue.filter(d => d.status === 'pending').length;
  const processingCount = queue.filter(d => d.status === 'uploading' || d.status === 'analyzing').length;
  const doneCount = queue.filter(d => d.status === 'done').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Files className="h-5 w-5 text-primary" />
          Batch Document Upload
        </CardTitle>
        <CardDescription>
          Add multiple documents to the queue, then upload and analyze all at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add to Queue Section */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Label>Document Type</Label>
            <Select value={currentDocType} onValueChange={setCurrentDocType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type first..." />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="invisible">Add</Label>
            <div className="relative">
              <Input
                type="file"
                onChange={handleFilesSelect}
                accept="image/*,application/pdf"
                disabled={!currentDocType || isProcessing}
                multiple
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Queue Display */}
        {queue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Queue: {pendingCount} pending, {processingCount} processing, {doneCount} done
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
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    doc.status === 'done' ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' :
                    doc.status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' :
                    'bg-muted/50'
                  }`}
                >
                  {getStatusIcon(doc.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOCUMENT_TYPES.find(t => t.value === doc.documentType)?.label}
                    </p>
                    {(doc.status === 'uploading' || doc.status === 'analyzing') && (
                      <Progress value={doc.progress} className="h-1 mt-1" />
                    )}
                    {doc.error && (
                      <p className="text-xs text-destructive mt-1">{doc.error}</p>
                    )}
                  </div>
                  {getStatusBadge(doc)}
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
        <div className="flex gap-2">
          <Button
            onClick={processQueue}
            disabled={pendingCount === 0 || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing {processingCount} of {queue.length}...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Analyze All ({pendingCount} documents)
              </>
            )}
          </Button>
        </div>

        {queue.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Files className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents in queue</p>
            <p className="text-xs">Select a document type, then choose files to add them</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
