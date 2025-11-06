import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Building2, LogOut, Upload, MessageSquare, Bell, CreditCard, FileText, PenTool } from "lucide-react";
import ProgressTracker from "@/components/ProgressTracker";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState({
    email: true,
    whatsapp: false,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const progressSteps = [
    { id: "1", label: "Pre-App", status: "complete" as const },
    { id: "2", label: "Documents", status: "current" as const },
    { id: "3", label: "Review", status: "upcoming" as const },
    { id: "4", label: "AIP", status: "upcoming" as const },
    { id: "5", label: "Offer", status: "upcoming" as const },
    { id: "6", label: "Drawdown", status: "upcoming" as const },
  ];

  const documents = [
    { category: "ID / Passport", files: 2, status: "verified" as const },
    { category: "Payslips", files: 3, status: "verified" as const },
    { category: "Bank Statements", files: 6, status: "pending" as const },
    { category: "Proof of Deposit", files: 1, status: "verified" as const },
    { category: "Property Details", files: 0, status: "pending" as const },
    { category: "Misc", files: 0, status: "pending" as const },
  ];

  const clarifications = [
    {
      id: "1",
      from: "broker",
      message: "Could you provide more details about the large deposit on March 15th?",
      timestamp: "2 hours ago",
      replies: 1,
    },
    {
      id: "2",
      from: "ai",
      message: "We noticed a gap in your employment history. Please clarify.",
      timestamp: "1 day ago",
      replies: 0,
    },
  ];

  const notifications = [
    { id: "1", message: "Document verification complete for Payslips", time: "30 mins ago" },
    { id: "2", message: "Broker requested clarification on bank statement", time: "2 hours ago" },
    { id: "3", message: "AIP expected within 5 business days", time: "1 day ago" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{user?.email?.split('@')[0] || 'User'}</h1>
                <p className="text-sm text-muted-foreground">App ID: #MG-2024-1234</p>
              </div>
              <StatusBadge status="in-progress" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Assigned Broker</p>
                <p className="font-medium">Sarah O'Connor</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
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
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">60% Complete</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Document Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.category}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{doc.category}</h4>
                      <p className="text-sm text-muted-foreground">
                        {doc.files} file{doc.files !== 1 ? "s" : ""} uploaded
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={doc.status} />
                      <Button size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>AI Feedback Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-success/10 rounded-lg">
                    <h4 className="font-medium text-success mb-2">Verified Income</h4>
                    <p className="text-sm">€65,000 annual salary confirmed</p>
                    <p className="text-xs text-muted-foreground mt-1">Confidence: 98%</p>
                  </div>
                  <div className="p-4 bg-warning/10 rounded-lg">
                    <h4 className="font-medium text-warning mb-2">Action Required</h4>
                    <p className="text-sm">Bank statements need clarification</p>
                    <p className="text-xs text-muted-foreground mt-1">See clarifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clarifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-secondary" />
                  Clarifications & Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {clarifications.map((item) => (
                  <div key={item.id} className="p-4 border border-border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge
                        status={item.from === "broker" ? "pending" : "flagged"}
                        text={item.from === "broker" ? "Broker" : "AI"}
                      />
                      <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                    </div>
                    <p className="text-sm">{item.message}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        Reply
                      </Button>
                      <Button size="sm" variant="outline">
                        <Upload className="h-3 w-3 mr-1" />
                        Attach File
                      </Button>
                      {item.replies > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {item.replies} {item.replies === 1 ? "reply" : "replies"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment & Fees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment & Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium">Valuation Fee</h4>
                    <p className="text-sm text-muted-foreground">Due: Dec 20, 2024</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">€150</span>
                    <Button>Pay Now</Button>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Payment history: 1 invoice paid (€100 application fee)
                  </p>
                </div>
              </CardContent>
            </Card>

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
              <CardContent className="space-y-3">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Loan Agreement</h4>
                    <StatusBadge status="pending" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Please review and sign the loan agreement
                  </p>
                  <Button className="w-full">Review & Sign</Button>
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
                <div className="h-64 border border-border rounded-lg p-4 overflow-y-auto bg-muted/30">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs text-white">
                        AI
                      </div>
                      <div className="flex-1 bg-card p-3 rounded-lg">
                        <p className="text-sm">
                          Hi John! How can I help you today?
                        </p>
                      </div>
                    </div>
                  </div>
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
                <div className="border-t border-border pt-4 space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="text-sm">
                      <p className="font-medium">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">{notif.time}</p>
                    </div>
                  ))}
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
