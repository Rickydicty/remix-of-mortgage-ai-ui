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
      // 1. Fetch ALL documents for this user to delete from storage
      const { data: allDocs } = await supabase
        .from('documents')
        .select('id, file_path')
        .eq('user_id', user.id);

      // 2. Remove files from storage bucket
      if (allDocs && allDocs.length > 0) {
        const filePaths = allDocs.map(d => d.file_path).filter(Boolean);
        if (filePaths.length > 0) {
          // Storage remove accepts max 1000 files at a time
          const batchSize = 100;
          for (let i = 0; i < filePaths.length; i += batchSize) {
            const batch = filePaths.slice(i, i + batchSize);
            await supabase.storage.from('documents').remove(batch);
          }
        }
        // 3. Delete all document DB rows for this user
        const { error: docDeleteError } = await supabase
          .from('documents')
          .delete()
          .eq('user_id', user.id);
        if (docDeleteError) {
          console.warn('Error deleting documents:', docDeleteError);
        }
      }

      // 4. Delete the application — cascading FKs handle form_data, signatures, messages, etc.
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', user.id);
      
      if (error) throw error;

      toast.success("Application and all data deleted successfully");
      setOpen(false);
      setConfirmText("");
      onDeleted();
    } catch (error: any) {
      console.error('Error deleting application:', error);
      toast.error(`Failed to delete application: ${error.message || 'Please try again.'}`);
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
