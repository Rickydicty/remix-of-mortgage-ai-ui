import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  filename: string;
  document_type: string;
  status: string;
  score: number | null;
  analysis_text: string | null;
  created_at: string;
  file_path: string;
}

interface DocumentReviewProps {
  clientId: string;
  clientName: string;
  applicationId?: string;
  onUpdate?: () => void;
}

const DocumentReview = ({ clientId, clientName, applicationId, onUpdate }: DocumentReviewProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [application, setApplication] = useState<any>(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    open: boolean;
    documentId: string;
    newStatus: string;
    documentName: string;
  }>({ open: false, documentId: "", newStatus: "", documentName: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    fetchDocuments();
    if (applicationId) fetchApplication();
  }, [clientId, applicationId]);

  const fetchApplication = async () => {
    if (!applicationId) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error) throw error;
      setApplication(data);
    } catch (error) {
      console.error('Error fetching application:', error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      toast.error("Failed to load documents");
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'disapproved':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'waiting':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      approved: 'bg-success/10 text-success border-success/20',
      disapproved: 'bg-destructive/10 text-destructive border-destructive/20',
      waiting: 'bg-warning/10 text-warning border-warning/20',
    };
    return variants[status] || 'bg-muted text-muted-foreground';
  };

  const handleStatusChange = async () => {
    const { error } = await supabase
      .from('documents')
      .update({ status: statusChangeDialog.newStatus })
      .eq('id', statusChangeDialog.documentId);

    if (error) {
      console.error('Error updating document status:', error);
      toast.error("Failed to update document status");
      return;
    }

    // Send message to client if there's a message
    if (statusMessage.trim()) {
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          receiver_id: clientId,
          message: `Document "${statusChangeDialog.documentName}" status updated to ${statusChangeDialog.newStatus}:\n\n${statusMessage.trim()}`
        });

      if (msgError) {
        console.error('Error sending message:', msgError);
      }
    }

    toast.success("Document status updated");
    setStatusChangeDialog({ open: false, documentId: "", newStatus: "", documentName: "" });
    setStatusMessage("");
    fetchDocuments();
    if (applicationId) fetchApplication();
    onUpdate?.();
  };

  const handleMoveToNextPhase = async () => {
    if (!applicationId || !application) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'aip_pending',
          current_step: 4
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success('Application approved and moved to AIP phase');
      await fetchApplication();
      onUpdate?.();
    } catch (error) {
      console.error('Error moving to next phase:', error);
      toast.error('Failed to move application forward');
    }
  };

  const handleRequestMoreDocs = async (message: string) => {
    if (!applicationId || !application) return;

    try {
      // Send message to client
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            sender_id: userData.user.id,
            receiver_id: clientId,
            application_id: applicationId,
            message: `Additional documents required:\n\n${message}`
          });

        if (msgError) throw msgError;
      }

      // Update application status back to document collection
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'needs_documents',
          current_step: 2
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success('Request sent to client for additional documents');
      await fetchApplication();
      onUpdate?.();
    } catch (error) {
      console.error('Error requesting documents:', error);
      toast.error('Failed to send document request');
    }
  };

  const canMoveToNextPhase = () => {
    const requiredTypes = ['certified_id', 'proof_of_address', 'payslips', 'bank_statements', 'employment_summary'];
    const latestDocs = requiredTypes.map(type => {
      const docsOfType = documents.filter(doc => doc.document_type === type);
      return docsOfType.sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      )[0];
    }).filter(Boolean);

    return latestDocs.length === 5 && latestDocs.every(doc => doc?.status === 'approved');
  };

  const toggleExpand = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const groupedDocs = {
    approved: documents.filter(d => d.status === 'approved'),
    waiting: documents.filter(d => d.status === 'waiting'),
    disapproved: documents.filter(d => d.status === 'disapproved'),
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Review - {clientName}
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <span className="text-success">✓ Approved: {groupedDocs.approved.length}</span>
            <span className="text-warning">⏳ Waiting: {groupedDocs.waiting.length}</span>
            <span className="text-destructive">✗ Disapproved: {groupedDocs.disapproved.length}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Review Phase Actions */}
          {(application?.status === 'pending_review' || application?.status === 'in_review') && (
            <Alert className="border-primary bg-primary/10">
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-1">Application Under Review</p>
                    <p className="text-sm text-muted-foreground">
                      Review all documents and either approve to move to AIP phase or request additional documents.
                    </p>
                  </div>
                  {canMoveToNextPhase() ? (
                    <div className="flex gap-2">
                      <Button onClick={handleMoveToNextPhase} className="gap-2 flex-1">
                        Approve & Move to AIP Phase
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" onClick={() => setShowRequestDialog(true)}>
                        Request More Documents
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowRequestDialog(true)} className="flex-1">
                        Request Additional Documents
                      </Button>
                      <p className="text-sm text-muted-foreground my-auto">
                        All required documents must be approved before moving forward
                      </p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {documents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
          ) : (
            <>
              {/* Waiting for Review */}
              {groupedDocs.waiting.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-warning flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Waiting for Review ({groupedDocs.waiting.length})
                  </h3>
                  {groupedDocs.waiting.map((doc) => (
                    <Card key={doc.id} className="border-warning/30">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(doc.status)}
                            <div>
                              <p className="font-medium">{doc.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.document_type.replace(/_/g, ' ')}
                                {doc.score && ` • AI Score: ${doc.score}/100`}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusBadge(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>

                        {doc.analysis_text && (
                          <div className="bg-muted/50 rounded p-3 mt-2 mb-3">
                            <p className="text-sm text-foreground">
                              {expandedDocs.has(doc.id) ? doc.analysis_text : truncateText(doc.analysis_text)}
                            </p>
                            {doc.analysis_text.length > 200 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(doc.id)}
                                className="mt-2 h-auto p-0 text-primary hover:text-primary/80"
                              >
                                {expandedDocs.has(doc.id) ? (
                                  <>Show less <ChevronUp className="h-4 w-4 ml-1" /></>
                                ) : (
                                  <>Show more <ChevronDown className="h-4 w-4 ml-1" /></>
                                )}
                              </Button>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setStatusChangeDialog({
                              open: true,
                              documentId: doc.id,
                              newStatus: 'approved',
                              documentName: doc.filename
                            })}
                            className="bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setStatusChangeDialog({
                              open: true,
                              documentId: doc.id,
                              newStatus: 'disapproved',
                              documentName: doc.filename
                            })}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Disapprove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Approved Documents */}
              {groupedDocs.approved.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Approved ({groupedDocs.approved.length})
                  </h3>
                  {groupedDocs.approved.map((doc) => (
                    <Card key={doc.id} className="border-success/30">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(doc.status)}
                            <div>
                              <p className="font-medium">{doc.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.document_type.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusBadge(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatusChangeDialog({
                            open: true,
                            documentId: doc.id,
                            newStatus: 'disapproved',
                            documentName: doc.filename
                          })}
                        >
                          Change to Disapproved
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Disapproved Documents */}
              {groupedDocs.disapproved.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-destructive flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Disapproved ({groupedDocs.disapproved.length})
                  </h3>
                  {groupedDocs.disapproved.map((doc) => (
                    <Card key={doc.id} className="border-destructive/30">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(doc.status)}
                            <div>
                              <p className="font-medium">{doc.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.document_type.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusBadge(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>

                        {doc.analysis_text && (
                          <div className="bg-muted/50 rounded p-3 mt-2 mb-3">
                            <p className="text-sm text-foreground">
                              {expandedDocs.has(doc.id) ? doc.analysis_text : truncateText(doc.analysis_text)}
                            </p>
                            {doc.analysis_text.length > 200 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(doc.id)}
                                className="mt-2 h-auto p-0 text-primary hover:text-primary/80"
                              >
                                {expandedDocs.has(doc.id) ? (
                                  <>Show less <ChevronUp className="h-4 w-4 ml-1" /></>
                                ) : (
                                  <>Show more <ChevronDown className="h-4 w-4 ml-1" /></>
                                )}
                              </Button>
                            )}
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatusChangeDialog({
                            open: true,
                            documentId: doc.id,
                            newStatus: 'approved',
                            documentName: doc.filename
                          })}
                        >
                          Change to Approved
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <AlertDialog open={statusChangeDialog.open} onOpenChange={(open) => {
        setStatusChangeDialog({ ...statusChangeDialog, open });
        if (!open) setStatusMessage("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Document Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change "{statusChangeDialog.documentName}" to <strong>{statusChangeDialog.newStatus}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Message to Client (Optional)</label>
            <Textarea
              placeholder="Add a message explaining the status change..."
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              rows={4}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request More Documents Dialog */}
      <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Additional Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Send a message to the client explaining what additional documents are needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Example: Please upload your most recent 3 months of payslips and updated bank statements..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={6}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRequestMessage("");
              setShowRequestDialog(false);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (requestMessage.trim()) {
                  handleRequestMoreDocs(requestMessage);
                  setRequestMessage("");
                  setShowRequestDialog(false);
                } else {
                  toast.error("Please enter a message");
                }
              }}
            >
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentReview;
