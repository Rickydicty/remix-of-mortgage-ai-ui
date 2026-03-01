import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, MessageSquare, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { autoPopulateFormFromDocument } from "@/lib/autoPopulateFormData";
import { emailTemplates } from "@/lib/emailTemplates";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DOCUMENT_TYPES = [
  { value: "certified_id", label: "Certified ID", required: true },
  { value: "proof_of_address", label: "Certified Proof of Address", required: true },
  { value: "application_form", label: "BI Application Form", required: true },
  { value: "payslips", label: "3 Months Payslips", required: true },
  { value: "current_account_statements", label: "6 Months Current Account Statements", required: true },
  { value: "savings_account_statements", label: "6 Months Savings Account Statements", required: true },
  { value: "employment_summary", label: "Employment Detail Summary", required: true },
  { value: "salary_cert", label: "Salary Certificate (BPFI)", required: true },
  { value: "marriage_certificate", label: "Marriage Certificate", required: true },
  { value: "self_employed_docs", label: "Self-Employed Documents", required: true },
  { value: "ros_payment_charges", label: "ROS Payment & Charges Form", required: true },
  { value: "tax_clearance", label: "Tax Clearance Certificate", required: true },
  { value: "gift_letter", label: "Gift Letter", required: true },
  { value: "loan_account_statements", label: "6 Months Loan Account Statements", required: true },
  { value: "mortgage_statements", label: "12 Months Mortgage Statements", required: true },
  { value: "other", label: "Other Documents", required: true },
];

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [justification, setJustification] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast({
        title: "Missing information",
        description: "Please select a file and document type",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to upload documents",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (justification.trim()) {
        formData.append('clientJustification', justification.trim());
      }

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Get the application for the current user
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // AI Broker Agent auto-approves documents based on analysis score
      // Score >= 70: Auto-approved, ready for broker review
      // Score < 70: Flagged for broker attention (not admin)
      const score = data.document.score || 0;
      const autoApproved = score >= 70;
      
      // Update document approval status based on AI analysis
      // Also save the client justification if provided
      await supabase
        .from('documents')
        .update({ 
          approval_status: autoApproved ? 'approved' : 'pending',
          status: autoApproved ? 'approved' : 'waiting',
          client_justification: justification.trim() || null,
          confidence_score: score
        })
        .eq('id', data.document.id);

      // Auto-populate form fields from approved documents
      if (autoApproved && application?.id) {
        const populateResult = await autoPopulateFormFromDocument(
          data.document.id,
          documentType,
          session.user.id,
          application.id
        );
        
        if (populateResult.fieldsApplied > 0) {
          console.log(`Auto-populated ${populateResult.fieldsApplied} fields from ${documentType}`);
        }
      }

      // Trigger AI Broker Agent for deeper analysis (runs in background)
      if (application?.id) {
        fetch(
          `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/broker-agent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "analyze_document",
              documentId: data.document.id,
              applicationId: application.id,
            }),
          }
        ).catch(err => console.log("AI analysis triggered in background:", err));
      }

      // Evaluate application state after upload
      if (application?.id) {
        supabase.functions.invoke('evaluate-application-state', {
          body: { application_id: application.id }
        }).catch(err => console.log("State evaluation triggered:", err));
      }

      // Send AI agent greeting message about the document upload
      if (application?.id) {
        fetch(
          `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/document-upload-greeting`,
          {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              applicationId: application.id,
              documentType,
              documentId: data.document.id,
              score,
              autoApproved,
              filename: file.name
            }),
          }
        ).catch(err => console.log("Document greeting triggered:", err));
      }

      // Send document_uploaded notification email
      const docTypeLabel = DOCUMENT_TYPES.find(t => t.value === documentType)?.label || documentType;
      supabase.functions.invoke('send-notification', {
        body: {
          notification_type: 'document_uploaded',
          subject: `Document Uploaded: ${docTypeLabel}`,
          html_content: emailTemplates.documentUploaded({
            documentType: docTypeLabel,
            fileName: file.name,
            aiScore: score,
            status: autoApproved ? 'Auto-Approved' : 'Pending Review',
            clientNotes: justification || undefined,
            dashboardUrl: `${window.location.origin}/login`,
          }),
          event_data: {
            document_type: documentType,
            file_name: file.name,
            score,
            auto_approved: autoApproved,
          },
        },
      }).catch(err => console.log("Document notification sent:", err));

      // Show appropriate message based on AI decision
      toast({
        title: autoApproved ? "Document approved by AI" : "Document uploaded for review",
        description: autoApproved 
          ? `Score: ${score}/100. Ready for broker review.`
          : `Score: ${score}/100. Flagged for broker attention.`,
      });

      setFile(null);
      setDocumentType("");
      setJustification("");
      if (onUploadComplete) onUploadComplete();
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      let displayError = errorMessage;
      if (errorMessage.includes('413') || errorMessage.includes('too large') || errorMessage.includes('size')) {
        displayError = `File too large (${file ? (file.size / 1024 / 1024).toFixed(1) + 'MB' : ''}). Maximum size is 10MB.`;
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('JWT')) {
        displayError = 'Your session has expired. Please refresh the page and log in again.';
      } else if (errorMessage.includes('unsupported') || errorMessage.includes('format')) {
        displayError = 'Unsupported file format. Please upload PDF, JPG, or PNG files.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
        displayError = 'Analysis timed out. Try uploading a smaller or clearer file.';
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal')) {
        displayError = 'Server error during analysis. Please retry in a moment.';
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        displayError = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage === 'Upload failed') {
        displayError = 'Upload failed. Please try re-saving the file in a different format and uploading again.';
      }
      
      toast({
        title: "Upload failed",
        description: displayError,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="documentType">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label} {type.required && <span className="text-destructive">*</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Select File</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            disabled={uploading}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="justification" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Justification / Notes (Optional)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Add any explanation for this document. For example:</p>
                  <ul className="list-disc pl-4 mt-1 text-xs">
                    <li>"Only 2 months available as I recently switched banks"</li>
                    <li>"Previous employer - recently changed jobs"</li>
                    <li>"Digital statement from online bank"</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            id="justification"
            placeholder="Explain any special circumstances about this document..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            disabled={uploading}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This helps the broker understand context when reviewing your documents.
          </p>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || !documentType || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Analyze
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};