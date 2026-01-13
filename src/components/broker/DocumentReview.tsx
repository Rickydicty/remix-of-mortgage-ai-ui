import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, ArrowRight, Download, MessageSquare, UserCheck, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AgentInsightsPanel from "@/components/broker/AgentInsightsPanel";
import ExtractedDataDisplay from "@/components/broker/ExtractedDataDisplay";
import DocumentFieldMapper from "@/components/broker/DocumentFieldMapper";
import { getMappableFields, ExtractedData } from "@/lib/documentFormMapping";
import { autoPopulateFormFromDocument } from "@/lib/autoPopulateFormData";
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
  client_justification: string | null;
  flag_reason: string | null;
  reviewer_justification: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  confidence_score: number | null;
}

interface DocumentAnalysis {
  document_id: string;
  extracted_data: Record<string, unknown>;
  risk_level: string;
  completeness_score: number;
  risk_flags: string[];
  quality_issues: string[];
  broker_commentary: string | null;
}

interface DocumentReviewProps {
  clientId: string;
  clientName: string;
  applicationId?: string;
  onUpdate?: () => void;
}

const DocumentReview = ({ clientId, clientName, applicationId, onUpdate }: DocumentReviewProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentAnalyses, setDocumentAnalyses] = useState<Map<string, DocumentAnalysis>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [application, setApplication] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    open: boolean;
    documentId: string;
    newStatus: string;
    documentName: string;
  }>({ open: false, documentId: "", newStatus: "", documentName: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  // Compute which form fields have values (i.e., have been applied from documents)
  const getAppliedFormFields = (): string[] => {
    if (!formData) return [];
    return Object.entries(formData)
      .filter(([key, value]) => 
        value !== null && 
        value !== undefined && 
        value !== '' && 
        value !== 0 &&
        !['id', 'user_id', 'application_id', 'created_at', 'updated_at'].includes(key)
      )
      .map(([key]) => key);
  };

  useEffect(() => {
    fetchDocuments();
    fetchDocumentAnalyses();
    fetchFormData();
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
    // AI Broker Agent now handles document review - show all documents to broker
    // No admin approval required - AI auto-approves or flags for broker attention
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

  const fetchDocumentAnalyses = async () => {
    if (!applicationId) return;
    
    const { data, error } = await supabase
      .from('agent_document_analysis')
      .select('*')
      .eq('application_id', applicationId);
    
    if (error) {
      console.error('Error fetching document analyses:', error);
      return;
    }
    
    const analysisMap = new Map<string, DocumentAnalysis>();
    (data || []).forEach((analysis: any) => {
      analysisMap.set(analysis.document_id, {
        document_id: analysis.document_id,
        extracted_data: analysis.extracted_data || {},
        risk_level: analysis.risk_level,
        completeness_score: analysis.completeness_score,
        risk_flags: analysis.risk_flags || [],
        quality_issues: analysis.quality_issues || [],
        broker_commentary: analysis.broker_commentary
      });
    });
    setDocumentAnalyses(analysisMap);
  };

  const fetchFormData = async () => {
    const { data, error } = await supabase
      .from('application_form_data')
      .select('*')
      .eq('user_id', clientId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching form data:', error);
      return;
    }
    
    setFormData(data);
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

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleStatusChange = async () => {
    // Get current user for reviewer tracking
    const { data: userData } = await supabase.auth.getUser();
    const reviewerId = userData.user?.id;

    // Find the document being changed
    const changedDoc = documents.find(d => d.id === statusChangeDialog.documentId);

    // Update document with status and reviewer justification
    const { error } = await supabase
      .from('documents')
      .update({ 
        status: statusChangeDialog.newStatus,
        reviewer_justification: statusMessage.trim() || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', statusChangeDialog.documentId);

    if (error) {
      console.error('Error updating document status:', error);
      toast.error("Failed to update document status");
      return;
    }

    // Auto-populate form fields when broker approves a document
    if (statusChangeDialog.newStatus === 'approved' && applicationId && changedDoc) {
      const populateResult = await autoPopulateFormFromDocument(
        statusChangeDialog.documentId,
        changedDoc.document_type,
        clientId,
        applicationId
      );
      
      if (populateResult.fieldsApplied > 0) {
        toast.success(`Auto-populated ${populateResult.fieldsApplied} field(s) to client's application form`);
      }
    }

    // Send message to client if there's a message
    if (statusMessage.trim() && reviewerId) {
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          sender_id: reviewerId,
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
    fetchFormData();
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
    <div className="space-y-6">
      {/* AI Broker Agent Insights */}
      {applicationId && (
        <AgentInsightsPanel 
          applicationId={applicationId} 
          clientId={clientId}
          onRefresh={() => {
            fetchDocuments();
            onUpdate?.();
          }}
        />
      )}
      
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
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getStatusIcon(doc.status)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.document_type.replace(/_/g, ' ')}
                                {doc.score && ` • AI Score: ${doc.score}/100`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc.file_path, doc.filename)}
                              title="Download document"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Badge className={getStatusBadge(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Extracted Data Display */}
                        {documentAnalyses.has(doc.id) && (
                          <div className="mb-3">
                            <ExtractedDataDisplay
                              documentType={doc.document_type}
                              extractedData={documentAnalyses.get(doc.id)!.extracted_data as any}
                              riskLevel={documentAnalyses.get(doc.id)!.risk_level}
                              completenessScore={documentAnalyses.get(doc.id)!.completeness_score}
                              appliedFields={getAppliedFormFields()}
                            />
                          </div>
                        )}

                        {/* Client Justification - Important for flexible approval */}
                        {doc.client_justification && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3 mt-2 mb-3">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Client Justification
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              {doc.client_justification}
                            </p>
                          </div>
                        )}

                        {/* Flag reason if document was flagged */}
                        {doc.flag_reason && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-3 mt-2 mb-3">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Flag Reason
                            </p>
                            <p className="text-sm text-amber-900 dark:text-amber-100">
                              {doc.flag_reason}
                            </p>
                          </div>
                        )}

                        {/* Full AI Analysis for Broker */}
                        {doc.analysis_text && (
                          <div className="bg-primary/5 border border-primary/20 rounded p-3 mt-2 mb-3">
                            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                              🤖 AI Analysis Report
                              {doc.score && <span className="ml-auto">Score: {doc.score}/100</span>}
                            </p>
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
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getStatusIcon(doc.status)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.document_type.replace(/_/g, ' ')}
                                {doc.score && ` • AI Score: ${doc.score}/100`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc.file_path, doc.filename)}
                              title="Download document"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Badge className={getStatusBadge(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Extracted Data Display */}
                        {documentAnalyses.has(doc.id) && (
                          <div className="mb-3">
                            <ExtractedDataDisplay
                              documentType={doc.document_type}
                              extractedData={documentAnalyses.get(doc.id)!.extracted_data as any}
                              riskLevel={documentAnalyses.get(doc.id)!.risk_level}
                              completenessScore={documentAnalyses.get(doc.id)!.completeness_score}
                              appliedFields={getAppliedFormFields()}
                            />
                          </div>
                        )}

                        {/* Auto-Fill Form from Approved Document */}
                        {applicationId && documentAnalyses.has(doc.id) && (() => {
                          const mappedFields = getMappableFields(
                            doc.document_type,
                            documentAnalyses.get(doc.id)!.extracted_data as ExtractedData,
                            formData || {}
                          );
                          return mappedFields.length > 0 ? (
                            <div className="mb-3">
                              <DocumentFieldMapper
                                mappedFields={mappedFields}
                                applicationId={applicationId}
                                userId={clientId}
                                documentType={doc.document_type}
                                onMappingComplete={() => {
                                  fetchFormData();
                                  onUpdate?.();
                                }}
                              />
                            </div>
                          ) : null;
                        })()}

                        {/* Client Justification */}
                        {doc.client_justification && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3 mt-2 mb-3">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Client Justification
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              {doc.client_justification}
                            </p>
                          </div>
                        )}

                        {/* Reviewer Justification */}
                        {doc.reviewer_justification && (
                          <div className="bg-success/10 border border-success/30 rounded p-3 mt-2 mb-3">
                            <p className="text-xs font-semibold text-success mb-2 flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Reviewer Justification
                              {doc.reviewed_at && (
                                <span className="ml-auto font-normal text-muted-foreground">
                                  {new Date(doc.reviewed_at).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-foreground">
                              {doc.reviewer_justification}
                            </p>
                          </div>
                        )}
                        
                        {/* Full AI Analysis for Broker */}
                        {doc.analysis_text && (
                          <div className="bg-primary/5 border border-primary/20 rounded p-3 mt-2 mb-3">
                            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                              🤖 AI Analysis Report
                              {doc.score && <span className="ml-auto">Score: {doc.score}/100</span>}
                            </p>
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
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getStatusIcon(doc.status)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.document_type.replace(/_/g, ' ')}
                                {doc.score && ` • AI Score: ${doc.score}/100`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc.file_path, doc.filename)}
                              title="Download document"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Badge className={getStatusBadge(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Extracted Data Display */}
                        {documentAnalyses.has(doc.id) && (
                          <div className="mb-3">
                            <ExtractedDataDisplay
                              documentType={doc.document_type}
                              extractedData={documentAnalyses.get(doc.id)!.extracted_data as any}
                              riskLevel={documentAnalyses.get(doc.id)!.risk_level}
                              completenessScore={documentAnalyses.get(doc.id)!.completeness_score}
                              appliedFields={getAppliedFormFields()}
                            />
                          </div>
                        )}

                        {/* Client Justification */}
                        {doc.client_justification && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3 mt-2 mb-3">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Client Justification
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              {doc.client_justification}
                            </p>
                          </div>
                        )}

                        {/* Reviewer Justification */}
                        {doc.reviewer_justification && (
                          <div className="bg-destructive/10 border border-destructive/30 rounded p-3 mt-2 mb-3">
                            <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Reviewer Justification
                              {doc.reviewed_at && (
                                <span className="ml-auto font-normal text-muted-foreground">
                                  {new Date(doc.reviewed_at).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-foreground">
                              {doc.reviewer_justification}
                            </p>
                          </div>
                        )}

                        {/* Full AI Analysis for Broker */}
                        {doc.analysis_text && (
                          <div className="bg-primary/5 border border-primary/20 rounded p-3 mt-2 mb-3">
                            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                              🤖 AI Analysis Report
                              {doc.score && <span className="ml-auto">Score: {doc.score}/100</span>}
                            </p>
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
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {statusChangeDialog.newStatus === 'approved' ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              {statusChangeDialog.newStatus === 'approved' ? 'Approve' : 'Disapprove'} Document
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeDialog.newStatus === 'approved' 
                ? `Approve "${statusChangeDialog.documentName}" for this application.`
                : `Disapprove "${statusChangeDialog.documentName}" - a justification is required.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Reviewer Justification 
                {statusChangeDialog.newStatus === 'disapproved' && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <Textarea
                placeholder={statusChangeDialog.newStatus === 'approved' 
                  ? "Optional: Add notes about why this document is acceptable..."
                  : "Required: Explain why this document is being rejected..."
                }
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                rows={4}
              />
              {statusChangeDialog.newStatus === 'approved' && (
                <p className="text-xs text-muted-foreground">
                  Consider the client's justification when approving documents that may not meet standard requirements.
                </p>
              )}
              {statusChangeDialog.newStatus === 'disapproved' && (
                <p className="text-xs text-muted-foreground">
                  This justification will be saved for audit purposes and sent to the client.
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (statusChangeDialog.newStatus === 'disapproved' && !statusMessage.trim()) {
                  toast.error("Justification is required when disapproving a document");
                  return;
                }
                handleStatusChange();
              }}
              className={statusChangeDialog.newStatus === 'approved' 
                ? "bg-success hover:bg-success/90" 
                : "bg-destructive hover:bg-destructive/90"
              }
            >
              {statusChangeDialog.newStatus === 'approved' ? 'Approve Document' : 'Disapprove Document'}
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
    </div>
  );
};

export default DocumentReview;
