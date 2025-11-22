import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileCheck, AlertTriangle, CheckCircle2, Clock, Download, Upload, 
  User, MessageSquare, Calendar, TrendingUp, Shield, FileText,
  AlertCircle, XCircle, Plus, Edit, Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AIPCondition {
  id: string;
  condition_type: string;
  description: string;
  severity: string;
  status: string;
  assigned_to: string;
  document_ids: any;
  override_reason: string | null;
}

interface AuditLog {
  id: string;
  event_type: string;
  event_description: string;
  actor_type: string;
  created_at: string;
}

interface Valuation {
  id: string;
  status: string;
  valuer_name: string | null;
  appointment_date: string | null;
  valuation_amount: number | null;
}

interface AIPManagementTabProps {
  applicationId: string;
}

const AIPManagementTab = ({ applicationId }: AIPManagementTabProps) => {
  const { toast } = useToast();
  const [application, setApplication] = useState<any>(null);
  const [conditions, setConditions] = useState<AIPCondition[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCondition, setEditingCondition] = useState<string | null>(null);

  useEffect(() => {
    fetchAIPData();
  }, [applicationId]);

  const fetchAIPData = async () => {
    try {
      setLoading(true);

      // Fetch application with AIP data
      const { data: appData } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      setApplication(appData);

      // Fetch conditions
      const { data: conditionsData } = await supabase
        .from('aip_conditions')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });
      setConditions((conditionsData as any) || []);

      // Fetch audit logs
      const { data: logsData } = await supabase
        .from('aip_audit_logs')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(50);
      setAuditLogs(logsData || []);

      // Fetch valuation
      const { data: valuationData } = await supabase
        .from('valuations')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setValuation(valuationData);

      // Fetch documents
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', appData?.user_id)
        .order('created_at', { ascending: false });
      setDocuments(docsData || []);

    } catch (error) {
      console.error('Error fetching AIP data:', error);
      toast({ title: "Error", description: "Failed to load AIP data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCondition = async (conditionId: string, updates: Partial<AIPCondition>) => {
    try {
      const { error } = await supabase
        .from('aip_conditions')
        .update(updates)
        .eq('id', conditionId);

      if (error) throw error;

      // Log the action
      await supabase.from('aip_audit_logs').insert({
        application_id: applicationId,
        event_type: 'condition_updated',
        event_description: `Condition updated: ${updates.status || 'modified'}`,
        actor_type: 'broker'
      });

      toast({ title: "Success", description: "Condition updated successfully" });
      fetchAIPData();
      setEditingCondition(null);
    } catch (error) {
      console.error('Error updating condition:', error);
      toast({ title: "Error", description: "Failed to update condition", variant: "destructive" });
    }
  };

  const handleOrderValuation = async () => {
    try {
      const { error } = await supabase
        .from('valuations')
        .insert({
          application_id: applicationId,
          status: 'ordered',
          ordered_at: new Date().toISOString()
        });

      if (error) throw error;

      await supabase.from('aip_audit_logs').insert({
        application_id: applicationId,
        event_type: 'valuation_ordered',
        event_description: 'Property valuation ordered',
        actor_type: 'broker'
      });

      toast({ title: "Success", description: "Valuation ordered successfully" });
      fetchAIPData();
    } catch (error) {
      console.error('Error ordering valuation:', error);
      toast({ title: "Error", description: "Failed to order valuation", variant: "destructive" });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <FileCheck className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'satisfied': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'missing': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading AIP data...</div>;
  }

  if (!application) {
    return <div className="text-center py-12 text-muted-foreground">No application found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Detailed AIP Status Panel */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AIP Status - {application.application_number}</span>
            <Badge className={
              application.aip_status === 'approved' ? 'bg-success' :
              application.aip_status === 'declined' ? 'bg-destructive' :
              'bg-warning'
            }>
              {application.aip_status?.toUpperCase() || 'PENDING'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Submitted Date</p>
              <p className="font-semibold">
                {application.aip_submitted_date 
                  ? format(new Date(application.aip_submitted_date), 'dd MMM yyyy')
                  : 'Not submitted'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Approved Date</p>
              <p className="font-semibold">
                {application.aip_approved_date 
                  ? format(new Date(application.aip_approved_date), 'dd MMM yyyy')
                  : 'Pending'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Turnaround</p>
              <p className="font-semibold">
                {application.aip_turnaround_hours 
                  ? `${application.aip_turnaround_hours}h`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Underwriter</p>
              <p className="font-semibold">{application.aip_assigned_underwriter || 'Unassigned'}</p>
            </div>
            {application.aip_eligibility_score && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Eligibility Score</p>
                <p className="font-semibold text-lg">{application.aip_eligibility_score}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="conditions" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="notes">Notes & Messages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AIP Conditions</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {conditions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No conditions set</p>
              ) : (
                conditions.map((condition) => (
                  <Card key={condition.id} className="border-l-4" style={{
                    borderLeftColor: 
                      condition.severity === 'critical' ? 'var(--destructive)' :
                      condition.severity === 'warning' ? 'var(--warning)' :
                      'var(--muted)'
                  }}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(condition.severity)}
                          <span className="font-semibold">{condition.condition_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(condition.status)}
                          <Badge variant="outline">{condition.status}</Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{condition.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span>Assigned to: <strong>{condition.assigned_to}</strong></span>
                        {Array.isArray(condition.document_ids) && condition.document_ids.length > 0 && (
                          <span>{condition.document_ids.length} document(s) linked</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={condition.status}
                          onValueChange={(value) => handleUpdateCondition(condition.id, { status: value as any })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="satisfied">Satisfied</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="flagged">Flagged</SelectItem>
                            <SelectItem value="missing">Missing</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Link Docs
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Override
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes & Messages Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Underwriter Notes & Internal Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add underwriter notes..."
                value={application.aip_underwriter_notes || ''}
                className="min-h-32"
              />
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Notes
              </Button>

              {/* Risk Flags */}
              {application.aip_risk_flags?.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-warning" />
                    Risk Flags
                  </h4>
                  <div className="space-y-2">
                    {application.aip_risk_flags.map((flag: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                        <span>{flag.description || flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {application.aip_ai_prediction && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    AI Analysis
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                    {Object.entries(application.aip_ai_prediction).map(([key, value]) => (
                      <div key={key}>
                        <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Document Management</span>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.document_type} • {format(new Date(doc.created_at), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lender Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between">
                <span>AIP Letter (Client Version)</span>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <span>Underwriting Appendix (Internal)</span>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <span>Supplementary Forms</span>
                <Download className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Valuation Tab */}
        <TabsContent value="valuation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Valuation Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!valuation || valuation.status === 'pending' ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No valuation ordered yet</p>
                  <Button onClick={handleOrderValuation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Order Valuation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Badge className="mt-1">{valuation.status}</Badge>
                    </div>
                    <div>
                      <Label>Valuer</Label>
                      <p className="text-sm mt-1">{valuation.valuer_name || 'Not assigned'}</p>
                    </div>
                    {valuation.appointment_date && (
                      <div>
                        <Label>Appointment</Label>
                        <p className="text-sm mt-1">
                          {format(new Date(valuation.appointment_date), 'dd MMM yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                    {valuation.valuation_amount && (
                      <div>
                        <Label>Valuation Amount</Label>
                        <p className="text-sm mt-1 font-semibold">
                          £{valuation.valuation_amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Valuation Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance & Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No audit logs yet</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{log.event_type.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.actor_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.event_description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIPManagementTab;
