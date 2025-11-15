import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const BrokerWebTab = () => {
  // TODO: Fetch leads from database
  const leads: any[] = [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-3xl font-bold">{leads.filter(l => l.status === 'new').length}</p>
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
                <p className="text-3xl font-bold">—</p>
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
                <p className="text-3xl font-bold">—</p>
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
                <p className="text-3xl font-bold">{leads.filter(l => l.status === 'incomplete').length}</p>
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
            <p className="text-sm text-muted-foreground">No insights available.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Real-Time Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">No alerts at this time.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrokerWebTab;
