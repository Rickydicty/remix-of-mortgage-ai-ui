import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, FileSignature } from 'lucide-react';

interface AIPSignatureUploadProps {
  applicationId: string;
  clientUserId: string;
  onUploadComplete: () => void;
}

const SIGNATURE_DOCUMENT_TYPES = [
  { value: 'aip_letter', label: 'AIP Letter (Requires Signature)' },
  { value: 'mortgage_application', label: 'Mortgage Application (Requires Signature)' },
];

export function AIPSignatureUpload({ applicationId, clientUserId, onUploadComplete }: AIPSignatureUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast.error('Please select a file and document type');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const filePath = `${clientUserId}/${applicationId}/${documentType}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record (for the client to see)
      const { error: docError } = await supabase.from('documents').insert({
        user_id: clientUserId,
        filename: file.name,
        file_path: filePath,
        document_type: documentType,
        status: 'pending_signature',
      });

      if (docError) throw docError;

      // Update application status to trigger signature flow
      await supabase.from('applications')
        .update({ 
          status: 'aip_pending',
          current_step: 4
        })
        .eq('id', applicationId);

      // Log the action
      await supabase.from('aip_audit_logs').insert({
        application_id: applicationId,
        event_type: 'document_uploaded_for_signature',
        event_description: `${documentType.replace(/_/g, ' ')} uploaded for client signature`,
        actor_type: 'broker',
        actor_id: user.id,
      });

      toast.success('Document uploaded! Client can now sign.');
      setOpen(false);
      setFile(null);
      setDocumentType('');
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileSignature className="h-4 w-4 mr-2" />
          Upload for Signature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document for Client Signature</DialogTitle>
          <DialogDescription>
            Upload an AIP document that requires the client's signature.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {SIGNATURE_DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Document File</Label>
            <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          </div>

          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file || !documentType}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
