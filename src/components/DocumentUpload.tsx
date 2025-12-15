import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DOCUMENT_TYPES = [
  { value: "certified_id", label: "Certified ID", required: true },
  { value: "proof_of_address", label: "Certified Proof of Address", required: true },
  { value: "cover_letter", label: "Cover Letter", required: true },
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

      toast({
        title: "Document uploaded successfully",
        description: `Status: ${data.document.status} (Score: ${data.document.score}/100)`,
      });

      setFile(null);
      setDocumentType("");
      if (onUploadComplete) onUploadComplete();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
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