import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Save, Plus, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface ClientNotesTabProps {
  applicationId: string | null;
}

const ClientNotesTab = ({ applicationId }: ClientNotesTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && applicationId) {
      fetchNotes();
    } else {
      setLoading(false);
    }
  }, [user, applicationId]);

  const fetchNotes = async () => {
    if (!user || !applicationId) return;
    try {
      const { data, error } = await supabase
        .from('agent_conversations')
        .select('id, message, created_at')
        .eq('client_id', user.id)
        .eq('application_id', applicationId)
        .eq('message_type', 'client_note')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data || []).map(d => ({ id: d.id, content: d.message, created_at: d.created_at })));
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !applicationId || !newNote.trim()) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('agent_conversations')
        .insert({
          client_id: user.id,
          application_id: applicationId,
          message: newNote.trim(),
          role: 'client',
          message_type: 'client_note',
        })
        .select('id, message, created_at')
        .single();

      if (error) throw error;

      setNotes(prev => [{ id: data.id, content: data.message, created_at: data.created_at }, ...prev]);
      setNewNote("");
      toast({ title: "Note saved", description: "Your note has been saved for your AI advisor to review." });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: "Error", description: "Failed to save note.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    // We can't delete from agent_conversations per RLS, so we'll just filter it out locally
    // and mark it as read/hidden
    try {
      await supabase
        .from('agent_conversations')
        .update({ read: true, message: '[deleted]' })
        .eq('id', noteId);

      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast({ title: "Note removed" });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (!applicationId) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No application found. Please complete your application details first.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Notes for AI Advisor
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Leave notes here about your situation, preferences, or questions. Our AI advisor will review these when processing your application.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="E.g. I'm expecting a salary increase next month, or I have questions about fixed vs variable rates..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveNote} disabled={saving || !newNote.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Add Note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardContent>
        </Card>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No notes yet</p>
              <p className="text-sm">Add a note above to share context with your AI advisor.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.filter(n => n.content !== '[deleted]').map((note) => (
            <Card key={note.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(note.created_at), 'dd MMM yyyy, HH:mm')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientNotesTab;