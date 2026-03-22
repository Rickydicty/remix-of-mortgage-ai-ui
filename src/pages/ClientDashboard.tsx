import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Building2, LogOut, User, ClipboardList, CreditCard, CheckCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProgressTracker from "@/components/ProgressTracker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ClientApplicationTab from "@/components/client/ClientApplicationTab";
import ApplicationFeePayment from "@/components/payments/ApplicationFeePayment";
import UnifiedChatBot from "@/components/client/UnifiedChatBot";
import BrokerMessageNotification from "@/components/client/BrokerMessageNotification";
import { DeleteApplicationDialog } from "@/components/client/DeleteApplicationDialog";
import { ClientInstructions } from "@/components/client/AppInstructions";
import PhoneVerification from "@/components/client/PhoneVerification";
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
  const [application, setApplication] = useState<Application | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [brokerProfile, setBrokerProfile] = useState<Profile | null>(null);
  const [documentProgress, setDocumentProgress] = useState(0);
  const [plansOpen, setPlansOpen] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

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

      const { data: apps } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let app = apps?.[0] || null;

      // Auto-create application if none exists (so chat can work)
      if (!app) {
        const { data: newApp, error: createError } = await supabase
          .from('applications')
          .insert({
            user_id: user.id,
            application_number: `APP-${Date.now()}`,
            status: 'draft',
            current_step: 1
          })
          .select()
          .single();

        if (!createError && newApp) {
          app = newApp;
        }
      }

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
    try {
      await supabase.auth.signOut({ scope: 'local' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return { label: 'Approved', color: 'bg-success/10 text-success border-success/20', description: 'Your application has been approved' };
      case 'in_progress':
      case 'in progress':
        return { label: 'In Progress', color: 'bg-primary/10 text-primary border-primary/20', description: 'You are filling out your application' };
      case 'pending_review':
        return { label: 'Under Review', color: 'bg-warning/10 text-warning border-warning/20', description: 'Your broker is reviewing your application' };
      case 'pending':
        return { label: 'Pending Assignment', color: 'bg-warning/10 text-warning border-warning/20', description: 'Waiting for a broker to be assigned' };
      case 'needs_documents':
        return { label: 'Awaiting Documents', color: 'bg-destructive/10 text-destructive border-destructive/20', description: 'Additional documents are required' };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-destructive/10 text-destructive border-destructive/20', description: 'Your application was not approved' };
      case 'draft':
        return { label: 'Draft', color: 'bg-muted/10 text-muted-foreground border-muted/20', description: 'Complete your forms and upload documents to proceed' };
      default:
        return { label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), color: 'bg-muted/10 text-muted-foreground border-muted/20', description: '' };
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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/pre-eligibility')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Eligibility
              </Button>
              <Dialog open={plansOpen} onOpenChange={setPlansOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payments
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Application Fees</DialogTitle>
                  </DialogHeader>
                  <ApplicationFeePayment applicationId={application?.id} />
                </DialogContent>
              </Dialog>
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
                {(() => {
                  const statusInfo = getStatusDisplay(application.status);
                  return (
                    <div>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      {statusInfo.description && (
                        <p className="text-xs text-muted-foreground mt-1">{statusInfo.description}</p>
                      )}
                    </div>
                  );
                })()}
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
        {/* Instructions */}
        <div className="mb-6">
          <ClientInstructions />
        </div>

        {/* Broker Message Notification */}
        {application?.assigned_broker_id && (
          <BrokerMessageNotification
            applicationId={application?.id || null}
            brokerId={application?.assigned_broker_id}
            brokerName={brokerProfile?.full_name}
          />
        )}

        {/* Progress Tracker */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressTracker steps={progressSteps} />
          </CardContent>
        </Card>

        {/* Main Application Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              My Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClientApplicationTab 
              applicationId={application?.id || null} 
              application={application}
              brokerProfile={brokerProfile}
              onRefresh={fetchApplicationData}
            />
            
            {/* Delete Application */}
            {application && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-destructive">Danger Zone</p>
                    <p className="text-xs text-muted-foreground">Permanently delete your application and all data.</p>
                  </div>
                  <DeleteApplicationDialog
                    applicationId={application.id}
                    applicationNumber={application.application_number}
                    onDeleted={() => {
                      setApplication(null);
                      fetchApplicationData();
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unified Chat Bot - Available in all tabs */}
      {user && (
        <UnifiedChatBot
          applicationId={application?.id || null}
          userId={user.id}
          brokerId={application?.assigned_broker_id}
        />
      )}
    </div>
  );
};

export default ClientDashboard;
