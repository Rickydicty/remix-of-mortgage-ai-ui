import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Building2, LogOut, Upload, MessageSquare, Bell, FileText, PenTool, User } from "lucide-react";
import ProgressTracker from "@/components/ProgressTracker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";

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
  const [notificationsEnabled, setNotificationsEnabled] = useState({
    email: true,
    whatsapp: false,
  });

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

  const progressSteps = [
    { id: "1", label: "Pre-App", status: (application?.current_step ?? 0) > 1 ? "complete" : (application?.current_step === 1 ? "current" : "upcoming") as const },
    { id: "2", label: "Documents", status: (application?.current_step ?? 0) > 2 ? "complete" : (application?.current_step === 2 ? "current" : "upcoming") as const },
    { id: "3", label: "Review", status: (application?.current_step ?? 0) > 3 ? "complete" : (application?.current_step === 3 ? "current" : "upcoming") as const },
    { id: "4", label: "AIP", status: (application?.current_step ?? 0) > 4 ? "complete" : (application?.current_step === 4 ? "current" : "upcoming") as const },
    { id: "5", label: "Offer", status: (application?.current_step ?? 0) > 5 ? "complete" : (application?.current_step === 5 ? "current" : "upcoming") as const },
    { id: "6", label: "Drawdown", status: (application?.current_step ?? 0) > 6 ? "complete" : (application?.current_step === 6 ? "current" : "upcoming") as const },
  ];

  const clarifications: Array<{ id: string; from: string; message: string; timestamp: string; replies: number }> = [];
  const notifications: Array<{ id: string; message: string; time: string }> = [];

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
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
                {brokerProfile ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{brokerProfile.full_name || brokerProfile.email}</p>
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Document Upload */}
            <DocumentUpload onUploadComplete={handleUploadComplete} />

            {/* Document List */}
            <DocumentList refreshTrigger={refreshTrigger} />

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

            {/* E-Signatures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-primary" />
                  E-Signatures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No documents to sign</p>
                  <p className="text-sm mt-2">Signature requests will appear here</p>
                </div>
              </CardContent>
            </Card>

            {/* Support Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-success" />
                  Support Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 border border-border rounded-lg p-4 overflow-y-auto bg-muted/30 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Start a conversation with support</p>
                </div>
                <div className="flex gap-2">
                  <Textarea placeholder="Type your message..." className="flex-1" />
                  <Button>Send</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-warning" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Email Notifications</Label>
                    <Switch
                      checked={notificationsEnabled.email}
                      onCheckedChange={(checked) =>
                        setNotificationsEnabled({ ...notificationsEnabled, email: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>WhatsApp Alerts</Label>
                    <Switch
                      checked={notificationsEnabled.whatsapp}
                      onCheckedChange={(checked) =>
                        setNotificationsEnabled({ ...notificationsEnabled, whatsapp: checked })
                      }
                    />
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No new notifications
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="text-sm">
                          <p className="font-medium">{notif.message}</p>
                          <p className="text-xs text-muted-foreground">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
