import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIPDocumentUploadProps {
  applicationId: string;
  onUploadComplete: () => void;
}

const DOCUMENT_TYPES = [
  { value: "aip_letter", label: "AIP Letter (Client Version)" },
  { value: "underwriting_appendix", label: "Underwriting Appendix (Internal)" },
  { value: "supplementary_forms", label: "Supplementary Forms" },
  { value: "valuation_report", label: "Valuation Report" },
  { value: "condition_document", label: "Condition Supporting Document" },
  { value: "lender_communication", label: "Lender Communication" },
];

export function AIPDocumentUpload({ applicationId, onUploadComplete }: AIPDocumentUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
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
        title: "Missing Information",
        description: "Please select a file and document type.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get application to find the user_id
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("user_id")
        .eq("id", applicationId)
        .single();

      if (appError) throw appError;

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${applicationId}/${documentType}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // Insert document record
      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: application.user_id,
          filename: file.name,
          file_path: fileName,
          document_type: documentType,
          status: "verified",
        });

      if (insertError) throw insertError;

      // Log audit entry
      await supabase.from("aip_audit_logs").insert({
        application_id: applicationId,
        event_type: "document_uploaded",
        event_description: `Broker uploaded ${DOCUMENT_TYPES.find(t => t.value === documentType)?.label}`,
        actor_id: user.id,
        actor_type: "broker",
      });

      toast({
        title: "Document Uploaded",
        description: "The document has been successfully uploaded.",
      });

      setFile(null);
      setDocumentType("");
      setOpen(false);
      onUploadComplete();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Upload Document
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload AIP Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
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
              <Label>File</Label>
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !file || !documentType}>
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
