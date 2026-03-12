import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DeleteApplicationDialogProps {
  applicationId: string | null;
  applicationNumber: string;
  onDeleted: () => void;
}

export const DeleteApplicationDialog = ({ applicationId, applicationNumber, onDeleted }: DeleteApplicationDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user || !applicationId || confirmText !== "DELETE") return;
    setDeleting(true);

    try {
      // Delete related data in order: form data, documents (DB rows + storage), then application
      const [formRes, docsRes] = await Promise.all([
        supabase.from('application_form_data').delete().eq('application_id', applicationId),
        supabase.from('documents').select('id, file_path').eq('user_id', user.id),
      ]);

      // Delete document storage files
      if (docsRes.data && docsRes.data.length > 0) {
        const filePaths = docsRes.data.map(d => d.file_path).filter(Boolean);
        if (filePaths.length > 0) {
          await supabase.storage.from('documents').remove(filePaths);
        }
        await supabase.from('documents').delete().eq('user_id', user.id);
      }

      // Delete signatures
      await supabase.from('signatures').delete().eq('application_id', applicationId);

      // Delete the application itself
      const { error } = await supabase.from('applications').delete().eq('id', applicationId).eq('user_id', user.id);
      if (error) throw error;

      toast.success("Application deleted successfully");
      setOpen(false);
      onDeleted();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error("Failed to delete application. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Application
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Entire Application
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>This will permanently delete your application <strong>{applicationNumber}</strong> and all associated data including:</p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>All uploaded documents</li>
              <li>All form data</li>
              <li>All signatures</li>
              <li>Application history</li>
            </ul>
            <p className="font-semibold text-destructive mt-3">This action cannot be undone.</p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Type <strong>DELETE</strong> to confirm:</p>
          <Input 
            value={confirmText} 
            onChange={(e) => setConfirmText(e.target.value)} 
            placeholder="Type DELETE"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={confirmText !== "DELETE" || deleting}
          >
            {deleting ? "Deleting..." : "Delete Everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
