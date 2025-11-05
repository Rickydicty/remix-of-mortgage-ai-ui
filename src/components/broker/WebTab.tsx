import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const BrokerWebTab = () => {
  const leads = [
    {
      id: "1",
      name: "Michael Ryan",
      email: "m.ryan@email.com",
      income: "€75,000",
      propertyValue: "€400,000",
      eligibility: 88,
      submittedAt: "2 hours ago",
      status: "new" as const,
    },
    {
      id: "2",
      name: "Emma Walsh",
      email: "e.walsh@email.com",
      income: "€120,000",
      propertyValue: "€550,000",
      eligibility: 92,
      submittedAt: "5 hours ago",
      status: "new" as const,
    },
    {
      id: "3",
      name: "James Murphy",
      email: "j.murphy@email.com",
      income: "€58,000",
      propertyValue: "€320,000",
      eligibility: 76,
      submittedAt: "1 day ago",
      status: "incomplete" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Eligibility</p>
                <p className="text-3xl font-bold">85%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold">8</p>
              </div>
              <Clock className="h-10 w-10 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Incomplete</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Lead Scanner */}
      <Card>
        <CardHeader>
          <CardTitle>AI Lead Scanner - New Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Income</p>
                    <p className="font-medium text-sm">{lead.income}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Property Value</p>
                    <p className="font-medium text-sm">{lead.propertyValue}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Eligibility</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-success h-2 rounded-full"
                          style={{ width: `${lead.eligibility}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{lead.eligibility}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium text-sm">{lead.submittedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lead.status === "incomplete" && (
                    <StatusBadge status="flagged" text="Incomplete" />
                  )}
                  <Button size="sm">Assign</Button>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Pre-Screen Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Pre-Screen Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-success/10 rounded-lg">
              <h4 className="font-medium text-success mb-1">High Quality Leads</h4>
              <p className="text-sm">8 leads with 85%+ eligibility ready for assignment</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <h4 className="font-medium text-warning mb-1">Missing Information</h4>
              <p className="text-sm">3 leads need follow-up for complete assessment</p>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg">
              <h4 className="font-medium text-destructive mb-1">Low Eligibility</h4>
              <p className="text-sm">1 lead with concerns - income verification needed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Real-Time Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 border border-border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Duplicate Application Detected</p>
                <p className="text-xs text-muted-foreground">
                  James Murphy submitted 2 applications with different emails
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border border-border rounded-lg">
              <TrendingUp className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">High Value Lead</p>
                <p className="text-xs text-muted-foreground">
                  Emma Walsh - €550k property, excellent eligibility score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrokerWebTab;
