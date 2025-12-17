import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  MessageSquare, 
  ClipboardList, 
  PenTool,
  Home,
  Loader2,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ApprovalItem {
  id: string;
  action_type: string;
  entity_id: string;
  entity_table: string;
  client_id: string;
  application_id: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  client_name?: string;
  client_email?: string;
  entity_details?: Record<string, unknown>;
}

export const AdminApprovalQueue = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchApprovals();
  }, [activeTab]);

  const fetchApprovals = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('admin_approvals')
      .select('*')
      .eq('status', activeTab)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approvals:', error);
      toast.error("Failed to load approval queue");
      setLoading(false);
      return;
    }

    // Fetch client details for each approval
    const approvalsWithDetails = await Promise.all(
      (data || []).map(async (approval) => {
        // Get client profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', approval.client_id)
          .maybeSingle();

        // Get entity details based on type
        let entityDetails: Record<string, unknown> = {};
        if (approval.entity_table === 'documents') {
          const { data: doc } = await supabase
            .from('documents')
            .select('filename, document_type, status, score')
            .eq('id', approval.entity_id)
            .maybeSingle();
          entityDetails = doc || {};
        } else if (approval.entity_table === 'messages') {
          const { data: msg } = await supabase
            .from('messages')
            .select('message, created_at')
            .eq('id', approval.entity_id)
            .maybeSingle();
          entityDetails = msg || {};
        } else if (approval.entity_table === 'application_form_data') {
          const metadataObj = typeof approval.metadata === 'object' && approval.metadata !== null ? approval.metadata : {};
          entityDetails = { type: 'Form Update', ...(metadataObj as Record<string, unknown>) };
        } else if (approval.entity_table === 'signatures') {
          const { data: sig } = await supabase
            .from('signatures')
            .select('document_type, signed_at')
            .eq('id', approval.entity_id)
            .maybeSingle();
          entityDetails = sig || {};
        } else if (approval.entity_table === 'valuations') {
          const { data: val } = await supabase
            .from('valuations')
            .select('valuation_amount, status')
            .eq('id', approval.entity_id)
            .maybeSingle();
          entityDetails = val || {};
        }

        const approvalItem: ApprovalItem = {
          ...approval,
          metadata: approval.metadata as Record<string, unknown> | null,
          client_name: profile?.full_name || 'Unknown',
          client_email: profile?.email || '',
          entity_details: entityDetails
        };

        return approvalItem;
      })
    );

    setApprovals(approvalsWithDetails);
    setLoading(false);
  };

  const handleApproval = async (approvalId: string, entityId: string, entityTable: string, approve: boolean) => {
    setProcessingId(approvalId);

    try {
      // Update the entity's approval_status
      const newStatus = approve ? 'approved' : 'rejected';
      
      const { error: entityError } = await supabase
        .from(entityTable as 'documents' | 'messages' | 'signatures' | 'valuations' | 'application_form_data')
        .update({ approval_status: newStatus })
        .eq('id', entityId);

      if (entityError) {
        throw entityError;
      }

      // Update the approval record
      const { error: approvalError } = await supabase
        .from('admin_approvals')
        .update({
          status: newStatus,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (approvalError) {
        throw approvalError;
      }

      toast.success(approve ? "Approved and forwarded to broker" : "Rejected");
      fetchApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error("Failed to process approval");
    } finally {
      setProcessingId(null);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'document_upload':
        return <FileText className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'form_update':
      case 'cover_letter':
        return <ClipboardList className="h-4 w-4" />;
      case 'signature':
        return <PenTool className="h-4 w-4" />;
      case 'valuation':
        return <Home className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'document_upload':
        return 'Document Upload';
      case 'message':
        return 'Message';
      case 'form_update':
        return 'Form Update';
      case 'cover_letter':
        return 'Cover Letter';
      case 'signature':
        return 'Signature';
      case 'valuation':
        return 'Valuation';
      default:
        return actionType;
    }
  };

  const renderEntityDetails = (approval: ApprovalItem) => {
    const details = approval.entity_details || {};
    
    switch (approval.entity_table) {
      case 'documents':
        return (
          <div className="text-sm space-y-1">
            <p><strong>File:</strong> {details.filename as string || 'N/A'}</p>
            <p><strong>Type:</strong> {details.document_type as string || 'N/A'}</p>
            <p><strong>AI Score:</strong> {details.score as number || 'N/A'}/100</p>
            <p><strong>Status:</strong> {details.status as string || 'N/A'}</p>
          </div>
        );
      case 'messages':
        return (
          <div className="text-sm">
            <p className="bg-muted p-2 rounded">{details.message as string || 'No message content'}</p>
          </div>
        );
      case 'application_form_data':
        return (
          <div className="text-sm">
            <p><strong>Updated Fields:</strong> {Object.keys(approval.metadata).join(', ') || 'N/A'}</p>
          </div>
        );
      case 'signatures':
        return (
          <div className="text-sm">
            <p><strong>Document:</strong> {details.document_type as string || 'N/A'}</p>
            <p><strong>Signed:</strong> {details.signed_at ? new Date(details.signed_at as string).toLocaleString() : 'N/A'}</p>
          </div>
        );
      case 'valuations':
        return (
          <div className="text-sm">
            <p><strong>Amount:</strong> €{(details.valuation_amount as number)?.toLocaleString() || 'N/A'}</p>
            <p><strong>Status:</strong> {details.status as string || 'N/A'}</p>
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground">No details available</p>;
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Approval Queue
          {activeTab === 'pending' && pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pending</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : approvals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No {activeTab} items
              </p>
            ) : (
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getActionIcon(approval.action_type)}
                        <span className="font-medium">{getActionLabel(approval.action_type)}</span>
                        <Badge variant="outline">
                          {approval.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(approval.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-sm">
                      <p><strong>Client:</strong> {approval.client_name} ({approval.client_email})</p>
                    </div>

                    {renderEntityDetails(approval)}

                    {activeTab === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproval(approval.id, approval.entity_id, approval.entity_table, true)}
                          disabled={processingId === approval.id}
                        >
                          {processingId === approval.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(approval.id, approval.entity_id, approval.entity_table, false)}
                          disabled={processingId === approval.id}
                        >
                          {processingId === approval.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{getActionLabel(approval.action_type)} Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <strong>Client:</strong> {approval.client_name}
                              </div>
                              <div>
                                <strong>Email:</strong> {approval.client_email}
                              </div>
                              <div>
                                <strong>Submitted:</strong> {new Date(approval.created_at).toLocaleString()}
                              </div>
                              <div className="border-t pt-4">
                                {renderEntityDetails(approval)}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminApprovalQueue;
