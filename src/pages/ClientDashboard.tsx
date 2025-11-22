import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Building2, LogOut, Upload, MessageSquare, FileText, PenTool, User } from "lucide-react";
import ProgressTracker from "@/components/ProgressTracker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import ClientMessaging from "@/components/broker/ClientMessaging";
import { SignatureDialog } from "@/components/SignatureDialog";
import AIPTab from "@/components/client/AIPTab";

interface Application {
  id: string;
  application_number: string;
  status: string;
  current_step: number;
  assigned_broker_id: string | null;
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
  const [signatureDialog, setSignatureDialog] = useState({ open: false, documentType: '' });
  const [activeTab, setActiveTab] = useState("documents");

  useEffect(() => {
    fetchApplicationData();
  }, [user]);

  const fetchApplicationData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      // Fetch application
      const { data: app } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (app) {
        setApplication(app);

        // Fetch broker profile if assigned
        if (app.assigned_broker_id) {
          const { data: broker } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', app.assigned_broker_id)
            .single();
          
          setBrokerProfile(broker);
        }
      }

      // Fetch documents to calculate phase progress
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      if (documents) {
        // Define required document types
        const requiredDocTypes = ['certified_id', 'proof_of_address', 'payslips', 'bank_statements', 'employment_summary'];
        
        // Get latest document of each type
        const latestDocs = requiredDocTypes.map(type => {
          const docsOfType = documents.filter(doc => doc.document_type === type);
          return docsOfType.sort((a, b) => 
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          )[0];
        }).filter(Boolean);
        
        const uploadedCount = latestDocs.length;
        
        // Once all docs uploaded, phase is 100% complete
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

  const clarifications: Array<{ id: string; from: string; message: string; timestamp: string; replies: number }> = [];

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchApplicationData(); // Refresh to update progress
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

        {/* Tabs for Different Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="documents">Documents & Conditions</TabsTrigger>
            <TabsTrigger value="aip">AIP</TabsTrigger>
            <TabsTrigger value="signatures">E-Signatures</TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="space-y-8">
              {/* Document Upload */}
              <DocumentUpload onUploadComplete={handleUploadComplete} />

              {/* Document List */}
              <DocumentList refreshTrigger={refreshTrigger} />

              {/* Submit for Review */}
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

              {/* Waiting for Broker Review */}
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

              {/* Need to Upload More Documents */}
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

              {/* Valuation & Solicitor */}
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

              {/* Broker Messaging */}
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

          {/* AIP Tab */}
          <TabsContent value="aip">
            <AIPTab
              aipData={application as any}
              brokerProfile={brokerProfile}
              onNavigateToDocuments={() => setActiveTab("documents")}
              onOpenMessaging={() => setActiveTab("documents")}
            />
          </TabsContent>

          {/* E-Signatures Tab */}
          <TabsContent value="signatures">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-primary" />
                  E-Signatures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application?.status === 'aip' && (
                  <>
                    <div className="space-y-3">
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          setSignatureDialog({ open: true, documentType: 'Agreement in Principle' });
                        }}
                      >
                        <PenTool className="mr-2 h-4 w-4" />
                        Sign Agreement in Principle
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setSignatureDialog({ open: true, documentType: 'Mortgage Application' });
                        }}
                      >
                        <PenTool className="mr-2 h-4 w-4" />
                        Sign Mortgage Application
                      </Button>
                    </div>
                  </>
                )}
                {(!application || application.status !== 'aip') && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No documents to sign</p>
                    <p className="text-sm mt-2">Signature requests will appear when your application reaches AIP stage</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Signature Dialog */}
      {application && (
        <SignatureDialog
          open={signatureDialog.open}
          onOpenChange={(open) => setSignatureDialog({ ...signatureDialog, open })}
          documentType={signatureDialog.documentType}
          applicationId={application.id}
          onSignatureComplete={() => {
            fetchApplicationData();
          }}
        />
      )}
    </div>
  );
};

export default ClientDashboard;
