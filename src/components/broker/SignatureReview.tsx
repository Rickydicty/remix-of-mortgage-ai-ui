import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, FileSignature, Loader2, Eye, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Signature {
  id: string;
  user_id: string;
  document_type: string;
  signature_data: string;
  signed_at: string;
  created_at: string;
}

interface SignatureReviewProps {
  applicationId: string;
  onApprovalComplete: () => void;
}

export function SignatureReview({ applicationId, onApprovalComplete }: SignatureReviewProps) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [viewingSignature, setViewingSignature] = useState<Signature | null>(null);

  useEffect(() => {
    fetchSignatures();
  }, [applicationId]);

  const fetchSignatures = async () => {
    try {
      const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignatures(data || []);
    } catch (error) {
      console.error('Error fetching signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAll = async () => {
    setApproving('all');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update application status to completed AIP phase
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'aip_approved',
          current_step: 5,
          aip_status: 'approved',
          aip_approved_date: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Update documents status
      await supabase
        .from('documents')
        .update({ status: 'signed_approved' })
        .eq('status', 'pending_signature');

      // Log the action
      await supabase.from('aip_audit_logs').insert({
        application_id: applicationId,
        event_type: 'signatures_approved',
        event_description: 'All signatures approved, AIP phase completed',
        actor_type: 'broker',
        actor_id: user.id,
      });

      toast.success('All signatures approved! AIP phase completed.');
      onApprovalComplete();
    } catch (error) {
      console.error('Error approving signatures:', error);
      toast.error('Failed to approve signatures');
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (signatures.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileSignature className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No signatures received yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Client needs to sign the uploaded documents
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Client Signatures
            </span>
            <Badge variant="outline" className="bg-success/10 text-success">
              {signatures.length} received
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {signatures.map((sig) => (
            <div
              key={sig.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-success/5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/20 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">{sig.document_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Signed: {format(new Date(sig.signed_at), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewingSignature(sig)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button
              className="w-full"
              size="lg"
              onClick={handleApproveAll}
              disabled={approving === 'all'}
            >
              {approving === 'all' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve All & Complete AIP Phase
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signature View Dialog */}
      <Dialog open={!!viewingSignature} onOpenChange={() => setViewingSignature(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {viewingSignature?.document_type} - Signature
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {viewingSignature && (
              <div className="border rounded-lg p-4 bg-background">
                <img
                  src={viewingSignature.signature_data}
                  alt="Client signature"
                  className="w-full max-h-48 object-contain"
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Signed on {format(new Date(viewingSignature.signed_at), 'dd MMM yyyy HH:mm:ss')}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
