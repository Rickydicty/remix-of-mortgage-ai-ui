import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Bot,
  FileText,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  User,
  Clock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import ExtractedDataDisplay from "@/components/broker/ExtractedDataDisplay";

interface AgentInsightsPanelProps {
  applicationId: string;
  clientId: string;
  onRefresh?: () => void;
}

interface EligibilityMetrics {
  ltvRatio: number;
  dtiRatio: number;
  incomeMultiple: number;
  maxBorrowingCapacity: number;
  stressTestedPayment: number;
  affordabilityStatus: string;
}

interface AggregatedFlag {
  flag: string;
  severity: string;
}

interface ApplicationAnalysis {
  overall_risk_level: string;
  aggregated_flags: (AggregatedFlag | string)[];
  estimated_approval_amount: number | null;
  estimated_monthly_payment: number | null;
  estimated_interest_range: { min: number; max: number } | null;
  recommended_programs: string[];
  submission_ready: boolean;
  open_items: string[];
  readiness_score: number;
  broker_summary: string;
  client_summary: string;
  requires_human_review: boolean;
  handoff_reason: string | null;
  last_analysis_at: string;
  eligibility_metrics?: EligibilityMetrics;
}

interface DocumentAnalysis {
  id: string;
  document_id: string;
  risk_level: string;
  risk_flags: string[];
  broker_commentary: string;
  client_explanation: string | null;
  completeness_score: number;
  quality_issues: string[];
  extracted_data?: Record<string, unknown>;
}

interface DocumentRow {
  id: string;
  filename: string;
  document_type: string;
  analysis_text: string | null;
  score: number | null;
  status: string;
  created_at: string | null;
}

interface Conversation {
  id: string;
  role: string;
  message: string;
  message_type: string;
  created_at: string;
}

interface ActionLog {
  id: string;
  action_type: string;
  action_description: string;
  created_at: string;
  success: boolean;
}

const AgentInsightsPanel = ({ applicationId, clientId, onRefresh }: AgentInsightsPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [appAnalysis, setAppAnalysis] = useState<ApplicationAnalysis | null>(null);
  const [docAnalyses, setDocAnalyses] = useState<DocumentAnalysis[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  const analysesByDocumentId = useMemo(() => {
    const map = new Map<string, DocumentAnalysis>();
    docAnalyses.forEach((a) => map.set(a.document_id, a));
    return map;
  }, [docAnalyses]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/broker-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_insights", applicationId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setAppAnalysis(data.applicationAnalysis);
        setDocAnalyses(data.documentAnalyses || []);
        setDocuments(data.documents || []);
        setConversations(data.conversations || []);
        setActionLogs(data.actionLogs || []);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const runFullAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(
        `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/broker-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analyze_application", applicationId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Application analysis complete");
        fetchInsights();
        onRefresh?.();
      } else {
        toast.error("Analysis failed");
      }
    } catch (error) {
      console.error("Error running analysis:", error);
      toast.error("Failed to run analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeOneDocument = async (documentId: string) => {
    try {
      const response = await fetch(
        `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/broker-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analyze_document", applicationId, documentId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Document parsing complete");
        fetchInsights();
      } else {
        toast.error(data.error || "Document parsing failed");
      }
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast.error("Failed to parse document");
    }
  };

  const [parsingAll, setParsingAll] = useState(false);

  const unparsedDocs = useMemo(() => {
    return documents.filter((d) => !analysesByDocumentId.has(d.id));
  }, [documents, analysesByDocumentId]);

  const parseAllUnparsed = async () => {
    if (unparsedDocs.length === 0) {
      toast.info("All documents are already parsed");
      return;
    }
    setParsingAll(true);
    let successCount = 0;
    let failCount = 0;

    for (const doc of unparsedDocs) {
      try {
        const response = await fetch(
          `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/broker-agent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "analyze_document", applicationId, documentId: doc.id }),
          }
        );
        const data = await response.json();
        if (data.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setParsingAll(false);
    fetchInsights();
    if (successCount > 0) {
      toast.success(`Parsed ${successCount} document${successCount > 1 ? "s" : ""}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to parse ${failCount} document${failCount > 1 ? "s" : ""}`);
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchInsights();
    }
  }, [applicationId]);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "low":
        return <Badge className="bg-success text-success-foreground">🟢 Low Risk</Badge>;
      case "medium":
        return <Badge className="bg-warning text-warning-foreground">🟡 Medium Risk</Badge>;
      case "high":
        return <Badge className="bg-destructive text-destructive-foreground">🔴 High Risk</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading AI insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Broker Agent</CardTitle>
          </div>
          <Button 
            size="sm" 
            onClick={runFullAnalysis} 
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          AI-powered risk assessment and recommendations
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="chat">Client Chat</TabsTrigger>
            <TabsTrigger value="logs">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {appAnalysis ? (
              <>
                {/* Risk Level & Readiness */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Risk Level</span>
                      {getRiskBadge(appAnalysis.overall_risk_level)}
                    </div>
                    {appAnalysis.requires_human_review && (
                      <div className="flex items-center gap-2 text-warning text-sm mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Requires human review</span>
                      </div>
                    )}
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Readiness Score</span>
                      <span className="font-bold">{appAnalysis.readiness_score}%</span>
                    </div>
                    <Progress value={appAnalysis.readiness_score} className="h-2" />
                    {appAnalysis.submission_ready ? (
                      <div className="flex items-center gap-2 text-success text-sm mt-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Ready for submission</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                        <Clock className="h-4 w-4" />
                        <span>Not ready yet</span>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Estimates */}
                {(appAnalysis.estimated_approval_amount || appAnalysis.estimated_monthly_payment) && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Eligibility & Pre-Approval Estimates
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Est. Approval Amount</span>
                        <span className="font-bold text-lg text-primary">
                          {formatCurrency(appAnalysis.estimated_approval_amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Monthly Payment</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(appAnalysis.estimated_monthly_payment)}
                        </span>
                      </div>
                      {appAnalysis.estimated_interest_range && (
                        <div>
                          <span className="text-muted-foreground block">Interest Rate Range</span>
                          <span className="font-bold text-lg">
                            {appAnalysis.estimated_interest_range.min}% - {appAnalysis.estimated_interest_range.max}%
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Eligibility Metrics - New detailed section */}
                {appAnalysis.eligibility_metrics && (
                  <Card className="p-4 border-primary/30 bg-primary/5">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Loan Eligibility Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">LTV Ratio</span>
                        <span className={`font-bold text-lg ${appAnalysis.eligibility_metrics.ltvRatio > 90 ? 'text-destructive' : appAnalysis.eligibility_metrics.ltvRatio > 80 ? 'text-warning' : 'text-success'}`}>
                          {appAnalysis.eligibility_metrics.ltvRatio}%
                        </span>
                        <span className="text-xs text-muted-foreground block">Max 90% FTB / 80% Other</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Income Multiple</span>
                        <span className={`font-bold text-lg ${appAnalysis.eligibility_metrics.incomeMultiple > 3.5 ? 'text-destructive' : appAnalysis.eligibility_metrics.incomeMultiple > 3 ? 'text-warning' : 'text-success'}`}>
                          {appAnalysis.eligibility_metrics.incomeMultiple}x
                        </span>
                        <span className="text-xs text-muted-foreground block">Max 3.5x income</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">DTI Ratio</span>
                        <span className={`font-bold text-lg ${appAnalysis.eligibility_metrics.dtiRatio > 45 ? 'text-destructive' : appAnalysis.eligibility_metrics.dtiRatio > 35 ? 'text-warning' : 'text-success'}`}>
                          {appAnalysis.eligibility_metrics.dtiRatio}%
                        </span>
                        <span className="text-xs text-muted-foreground block">Target &lt;35%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Max Borrowing Power</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(appAnalysis.eligibility_metrics.maxBorrowingCapacity)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Stress Test Payment</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(appAnalysis.eligibility_metrics.stressTestedPayment)}
                        </span>
                        <span className="text-xs text-muted-foreground block">At rate +2%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Affordability</span>
                        <Badge className={
                          appAnalysis.eligibility_metrics.affordabilityStatus === 'Affordable' 
                            ? 'bg-success text-success-foreground' 
                            : appAnalysis.eligibility_metrics.affordabilityStatus.includes('Tight')
                            ? 'bg-warning text-warning-foreground'
                            : 'bg-destructive text-destructive-foreground'
                        }>
                          {appAnalysis.eligibility_metrics.affordabilityStatus}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Risk Flags */}
                {appAnalysis.aggregated_flags && appAnalysis.aggregated_flags.length > 0 && (
                  <Card className="p-4 border-warning/50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Risk Flags ({appAnalysis.aggregated_flags.length})
                    </h4>
                    <ul className="space-y-2">
                      {appAnalysis.aggregated_flags.map((flagItem, i: number) => {
                        const flagText = typeof flagItem === 'string' ? flagItem : (flagItem as AggregatedFlag).flag;
                        const severity = typeof flagItem === 'string' ? 'warning' : (flagItem as AggregatedFlag).severity;
                        return (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                              severity === 'critical' ? 'text-destructive' :
                              severity === 'warning' ? 'text-warning' : 'text-muted-foreground'
                            }`} />
                            {flagText}
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                )}

                {/* Broker Summary */}
                {appAnalysis.broker_summary && (
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Broker Insights (Internal)
                    </h4>
                    <p className="text-sm">{appAnalysis.broker_summary}</p>
                  </Card>
                )}

                {/* Open Items */}
                {appAnalysis.open_items && appAnalysis.open_items.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Open Items</h4>
                    <ul className="space-y-2">
                      {appAnalysis.open_items.map((item: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Recommended Mortgage Programs */}
                {appAnalysis.recommended_programs && appAnalysis.recommended_programs.length > 0 && (
                  <Card className="p-4 border-success/30 bg-success/5">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Recommended Mortgage Programs
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Based on the applicant's profile, these programs may offer the best fit:
                    </p>
                    <div className="space-y-2">
                      {appAnalysis.recommended_programs.map((program: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-background/50 border border-success/20">
                          <Badge className="bg-success/20 text-success-foreground border-success/30">{i + 1}</Badge>
                          <p className="text-sm">{program}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Last Analysis Time */}
                <p className="text-xs text-muted-foreground text-center">
                  Last analyzed: {new Date(appAnalysis.last_analysis_at).toLocaleString()}
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No analysis yet</p>
                <Button onClick={runFullAnalysis} disabled={analyzing}>
                  Run First Analysis
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            {/* Parse All button */}
            {unparsedDocs.length > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {unparsedDocs.length} of {documents.length} document{documents.length > 1 ? "s" : ""} not parsed
                </p>
                <Button size="sm" onClick={parseAllUnparsed} disabled={parsingAll}>
                  {parsingAll ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    "Parse All"
                  )}
                </Button>
              </div>
            )}
            <ScrollArea className="h-[400px]">
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const analysis = analysesByDocumentId.get(doc.id);
                    return (
                      <Card key={doc.id} className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium text-sm truncate">{doc.filename}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {doc.document_type.replace(/_/g, " ")}
                              {typeof doc.score === "number" ? ` • Score: ${doc.score}/100` : ""}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {analysis ? getRiskBadge(analysis.risk_level) : (
                              <Badge variant="secondary">Not parsed yet</Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => analyzeOneDocument(doc.id)}
                            >
                              Parse
                            </Button>
                          </div>
                        </div>

                        {analysis?.extracted_data && (
                          <div className="mt-3">
                            <ExtractedDataDisplay
                              documentType={doc.document_type}
                              extractedData={analysis.extracted_data as any}
                              riskLevel={analysis.risk_level}
                              completenessScore={analysis.completeness_score}
                            />
                          </div>
                        )}

                        {/* Agent Comment - actionable feedback */}
                        {analysis?.broker_commentary && (
                          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="flex items-start gap-2">
                              <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-primary mb-1">Agent Comment</p>
                                <p className="text-sm">{analysis.broker_commentary}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quality Issues */}
                        {analysis?.quality_issues && analysis.quality_issues.length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-warning mb-1">Quality Issues</p>
                                <ul className="space-y-1">
                                  {analysis.quality_issues.map((issue, i) => (
                                    <li key={i} className="text-sm flex items-center gap-1">
                                      <span className="text-warning">•</span> {issue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {!analysis?.extracted_data && doc.analysis_text && (
                          <div className="mt-3 rounded border border-border bg-muted/30 p-3">
                            <p className="text-xs font-medium mb-1">AI analysis</p>
                            <p className="text-sm text-muted-foreground">{doc.analysis_text}</p>
                          </div>
                        )}

                        {analysis?.risk_flags?.length ? (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {analysis.risk_flags.map((flag, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-destructive/50 text-destructive">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No documents found for this client</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <ScrollArea className="h-[400px]">
              {conversations.length > 0 ? (
                <div className="space-y-3">
                  {conversations.slice().reverse().map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.role === "agent" ? "" : "flex-row-reverse"}`}
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {msg.role === "agent" ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "agent"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <span className="text-xs opacity-70 block mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No conversations yet</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <ScrollArea className="h-[400px]">
              {actionLogs.length > 0 ? (
                <div className="space-y-2">
                  {actionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.action_description}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {log.action_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No activity yet</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AgentInsightsPanel;
