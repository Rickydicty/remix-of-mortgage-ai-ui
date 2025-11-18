import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  applicationId: string;
  onSignatureComplete: () => void;
}

export const SignatureDialog = ({
  open,
  onOpenChange,
  documentType,
  applicationId,
  onSignatureComplete,
}: SignatureDialogProps) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleSave = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }

    setIsSaving(true);
    try {
      const signatureData = signatureRef.current.toDataURL();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('signatures').insert({
        user_id: user.id,
        application_id: applicationId,
        signature_data: signatureData,
        document_type: documentType,
      });

      if (error) throw error;

      toast.success('Signature saved successfully');
      onSignatureComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Sign Document</DialogTitle>
          <DialogDescription>
            Please sign below for: {documentType}
          </DialogDescription>
        </DialogHeader>
        
        <div className="border border-border rounded-lg bg-background">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              className: 'w-full h-64 rounded-lg',
            }}
            backgroundColor="hsl(var(--background))"
            penColor="hsl(var(--foreground))"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClear} disabled={isSaving}>
            Clear
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
