import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const BrokerTrackerTab = () => {
  // TODO: Fetch pipeline cases from database
  const cases: any[] = [];
  
  const stageColumns = [
    { id: "pre-app", label: "Pre-App", count: 0 },
    { id: "documents", label: "Documents", count: 0 },
    { id: "review", label: "Review", count: 0 },
    { id: "aip", label: "AIP", count: 0 },
    { id: "offer", label: "Offer", count: 0 },
    { id: "drawdown", label: "Drawdown", count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-6 gap-4">
        {stageColumns.map((stage) => (
          <Card key={stage.id}>
            <CardContent className="pt-6 text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{stage.label}</h3>
              <p className="text-3xl font-bold text-primary">{stage.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pipeline Tracker</CardTitle>
            <div className="flex gap-2">
              <Badge className="bg-success text-success-foreground">Complete</Badge>
              <Badge className="bg-warning text-warning-foreground">Pending</Badge>
              <Badge className="bg-destructive text-destructive-foreground">Flagged</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 pb-3 border-b border-border text-sm font-medium text-muted-foreground">
              <div>App ID</div>
              <div>Client</div>
              <div>Stage</div>
              <div>Progress</div>
              <div>Status</div>
              <div>Expected AIP</div>
              <div>Last Activity</div>
            </div>

            {/* Case Rows */}
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="grid grid-cols-7 gap-4 py-4 items-center border-b border-border last:border-0 hover:bg-accent/50 transition-colors rounded-lg px-2 cursor-pointer"
              >
                <div className="font-mono text-sm font-medium">{caseItem.id}</div>
                <div className="font-medium">{caseItem.client}</div>
                <div>
                  <Badge variant="outline">{caseItem.stage}</Badge>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${caseItem.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{caseItem.progress}%</span>
                  </div>
                </div>
                <div>
                  <StatusBadge status={caseItem.status} />
                </div>
                <div className="text-sm">
                  {caseItem.expectedAIP === "Delayed" ? (
                    <span className="text-destructive font-medium">{caseItem.expectedAIP}</span>
                  ) : (
                    caseItem.expectedAIP
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{caseItem.lastActivity}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Forecast & Auto-Escalation */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              AI Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-success/10 rounded-lg">
              <h4 className="font-medium text-success mb-2">On Track</h4>
              <p className="text-sm">8 cases expected to complete AIP this week</p>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg">
              <h4 className="font-medium text-warning mb-2">At Risk</h4>
              <p className="text-sm">3 cases may miss deadlines - review recommended</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Average Time to AIP</h4>
              <p className="text-2xl font-bold text-primary">8.5 days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Auto-Escalation Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">No escalation alerts.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrokerTrackerTab;
