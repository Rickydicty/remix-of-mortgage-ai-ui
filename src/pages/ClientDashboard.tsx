import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Building2, LogOut, Upload, MessageSquare, FileText, User, FileCheck, Download, ClipboardList } from "lucide-react";
import ProgressTracker from "@/components/ProgressTracker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import ClientMessaging from "@/components/broker/ClientMessaging";
import AIPTab from "@/components/client/AIPTab";
import { format, addDays } from "date-fns";
import { AIPDocumentsList } from "@/components/client/AIPDocumentsList";
import ClientApplicationTab from "@/components/client/ClientApplicationTab";
import { ESignaturesTab } from "@/components/client/ESignaturesTab";
import { LoanOffersTab } from "@/components/client/LoanOffersTab";

interface Application {
  id: string;
  application_number: string;
  status: string;
  current_step: number;
  assigned_broker_id: string | null;
  aip_letter_url: string | null;
  aip_approved_amount: number | null;
  aip_lender_name: string | null;
  aip_issue_date: string | null;
  aip_validity_period: number | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
}

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [application, setApplication] = useState<Application | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [brokerProfile, setBrokerProfile] = useState<Profile | null>(null);
  const [documentProgress, setDocumentProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    fetchApplicationData();
  }, [user]);

  const fetchApplicationData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      const { data: app } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (app) {
        setApplication(app);

        if (app.assigned_broker_id) {
          const { data: broker } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', app.assigned_broker_id)
            .single();
          
          setBrokerProfile(broker);
        }
      }

      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      if (documents) {
        const requiredDocTypes = ['certified_id', 'proof_of_address', 'payslips', 'bank_statements', 'employment_summary'];
        
        const latestDocs = requiredDocTypes.map(type => {
          const docsOfType = documents.filter(doc => doc.document_type === type);
          return docsOfType.sort((a, b) => 
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          )[0];
        }).filter(Boolean);
        
        const uploadedCount = latestDocs.length;
        const docPercentage = Math.round((uploadedCount / requiredDocTypes.length) * 100);
        
        setDocumentProgress(docPercentage);
      }
    } catch (error) {
      console.error('Error fetching application data:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'in_progress':
      case 'in progress':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStepStatus = (stepNumber: number): "complete" | "current" | "upcoming" => {
    const currentStep = application?.current_step ?? 0;
    if (currentStep > stepNumber) return "complete";
    if (currentStep === stepNumber) return "current";
    return "upcoming";
  };

  const progressSteps = [
    { id: "1", label: "Pre-App", status: getStepStatus(1), phaseProgress: 0 },
    { id: "2", label: "Documents", status: getStepStatus(2), phaseProgress: documentProgress },
    { id: "3", label: "Review", status: getStepStatus(3), phaseProgress: 0 },
    { id: "4", label: "AIP", status: getStepStatus(4), phaseProgress: 0 },
    { id: "5", label: "Offer", status: getStepStatus(5), phaseProgress: 0 },
    { id: "6", label: "Drawdown", status: getStepStatus(6), phaseProgress: 0 },
  ];

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchApplicationData();
  };

  const handleSubmitForReview = async () => {
    if (!application) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'pending_review',
          current_step: 3
        })
        .eq('id', application.id);

      if (error) throw error;

      await fetchApplicationData();
      alert('All documents uploaded! Your application is now under broker review.');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application');
    }
  };

  const canSubmitForReview = () => {
    if (!application) return false;
    return documentProgress === 100 && 
           (application.status === 'draft' || application.status === 'pending' || application.status === 'needs_documents');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{userProfile?.full_name || user?.email?.split('@')[0] || 'User'}</h1>
                <p className="text-xs text-muted-foreground">{userProfile?.email || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          {application && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Application ID</p>
                <p className="font-semibold">{application.application_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge className={getStatusColor(application.status)}>
                  {application.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Step</p>
                <p className="font-semibold">Step {application.current_step} of 6</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned Broker</p>
                {application?.assigned_broker_id ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{brokerProfile?.full_name || brokerProfile?.email || 'Assigned Broker'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Tracker */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressTracker steps={progressSteps} />
          </CardContent>
        </Card>

        {/* Main Application Card with Sub-Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              My Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="aip">AIP</TabsTrigger>
                <TabsTrigger value="aip-letter">AIP Letter</TabsTrigger>
                <TabsTrigger value="loan-offers">Loan Offers</TabsTrigger>
                <TabsTrigger value="signatures">E-Signatures</TabsTrigger>
              </TabsList>

              {/* Details Sub-Tab */}
              <TabsContent value="details">
                <ClientApplicationTab applicationId={application?.id || null} />
              </TabsContent>

              {/* Documents Sub-Tab */}
              <TabsContent value="documents">
                <div className="space-y-8">
                  <DocumentUpload onUploadComplete={handleUploadComplete} />
                  <DocumentList refreshTrigger={refreshTrigger} />

                  {canSubmitForReview() && (
                    <Card className="border-primary bg-primary/5">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">Ready for Review</h3>
                            <p className="text-sm text-muted-foreground">
                              All required documents uploaded. Submit to broker for review.
                            </p>
                          </div>
                          <Button onClick={handleSubmitForReview} size="lg">
                            Submit for Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {application?.status === 'pending_review' && (
                    <Card className="border-warning bg-warning/5">
                      <CardContent className="pt-6">
                        <div className="text-center py-4">
                          <h3 className="font-semibold text-lg mb-2">Under Review</h3>
                          <p className="text-sm text-muted-foreground">
                            Your documents are being reviewed by your broker. You'll be notified once the review is complete.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {application?.status === 'needs_documents' && (
                    <Card className="border-destructive bg-destructive/5">
                      <CardContent className="pt-6">
                        <div className="text-center py-4">
                          <h3 className="font-semibold text-lg mb-2 text-destructive">Additional Documents Required</h3>
                          <p className="text-sm text-muted-foreground">
                            Your broker has requested additional documents. Please check your messages and upload the required documents.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-secondary" />
                        Valuation & Solicitor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Valuation Report</Label>
                        <Button variant="outline" className="w-full">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Valuation Report
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Solicitor Contact</Label>
                        <Input placeholder="Solicitor Name" />
                        <Input placeholder="Email" type="email" />
                        <Input placeholder="Phone" type="tel" />
                      </div>
                    </CardContent>
                  </Card>

                  {application?.assigned_broker_id ? (
                    <ClientMessaging 
                      clientId={application.assigned_broker_id} 
                      clientName={brokerProfile?.full_name || brokerProfile?.email || 'Broker'} 
                      applicationId={application.id}
                    />
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-success" />
                          Support Chat
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-64 border border-border rounded-lg p-4 overflow-y-auto bg-muted/30 flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">A broker will be assigned to your application soon</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* AIP Sub-Tab */}
              <TabsContent value="aip">
                <AIPTab
                  aipData={application as any}
                  brokerProfile={brokerProfile}
                  onNavigateToDocuments={() => setActiveTab("documents")}
                  onOpenMessaging={() => setActiveTab("documents")}
                />
              </TabsContent>

              {/* AIP Letter Sub-Tab */}
              <TabsContent value="aip-letter" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      Agreement in Principle Letter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {application?.aip_letter_url ? (
                      <>
                        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-success/20 rounded-full">
                              <FileCheck className="h-5 w-5 text-success" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-success mb-1">AIP Letter Available</h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                Your Agreement in Principle has been issued. Download your letter below.
                              </p>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => window.open(application.aip_letter_url!, '_blank')}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Download AIP Letter
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Approved Amount</p>
                            <p className="text-2xl font-bold text-success">
                              €{application.aip_approved_amount?.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Lender</p>
                            <p className="text-lg font-semibold">{application.aip_lender_name || 'N/A'}</p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Issue Date</p>
                            <p className="text-lg font-semibold">
                              {application.aip_issue_date 
                                ? format(new Date(application.aip_issue_date), 'dd MMM yyyy')
                                : 'N/A'
                              }
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
                            <p className="text-lg font-semibold">
                              {application.aip_issue_date 
                                ? format(
                                    addDays(new Date(application.aip_issue_date), application.aip_validity_period || 90),
                                    'dd MMM yyyy'
                                  )
                                : 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                          <FileCheck className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">AIP Letter Not Yet Issued</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Your Agreement in Principle is being processed. Once approved, your AIP letter will be available here for download.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-secondary" />
                      AIP Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AIPDocumentsList applicationId={application?.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Loan Offers Sub-Tab */}
              <TabsContent value="loan-offers">
                <LoanOffersTab applicationId={application?.id || null} />
              </TabsContent>

              {/* E-Signatures Sub-Tab */}
              <TabsContent value="signatures">
                <ESignaturesTab 
                  application={application} 
                  onSignatureComplete={fetchApplicationData}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
