import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, FileCheck } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";

const BrokerTrackerTab = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageLabel = (step: number) => {
    const stages = ["Pre-App", "Documents", "Review", "AIP", "Offer", "Drawdown"];
    return stages[step - 1] || "Unknown";
  };

  const calculateProgress = (step: number) => {
    return Math.round((step / 6) * 100);
  };

  const stageCounts = applications.reduce((acc, app) => {
    const stage = getStageLabel(app.current_step);
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const stageColumns = [
    { id: "pre-app", label: "Pre-App", count: stageCounts["Pre-App"] || 0 },
    { id: "documents", label: "Documents", count: stageCounts["Documents"] || 0 },
    { id: "review", label: "Review", count: stageCounts["Review"] || 0 },
    { id: "aip", label: "AIP", count: stageCounts["AIP"] || 0 },
    { id: "offer", label: "Offer", count: stageCounts["Offer"] || 0 },
    { id: "drawdown", label: "Drawdown", count: stageCounts["Drawdown"] || 0 },
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
            <div className="grid grid-cols-8 gap-4 pb-3 border-b border-border text-sm font-medium text-muted-foreground">
              <div>App ID</div>
              <div>Client</div>
              <div>Stage</div>
              <div>Progress</div>
              <div>Status</div>
              <div>AIP Status</div>
              <div>Last Updated</div>
              <div>Actions</div>
            </div>

            {/* Case Rows */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No applications found</div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="grid grid-cols-8 gap-4 py-4 items-center border-b border-border last:border-0 hover:bg-accent/50 transition-colors rounded-lg px-2"
                >
                  <div className="font-mono text-sm font-medium">{app.application_number}</div>
                  <div className="font-medium">
                    {app.profiles?.full_name || app.profiles?.email || 'Unknown'}
                  </div>
                  <div>
                    <Badge variant="outline">{getStageLabel(app.current_step)}</Badge>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${calculateProgress(app.current_step)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{calculateProgress(app.current_step)}%</span>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={app.status as any} />
                  </div>
                  <div>
                    {app.aip_status ? (
                      <Badge className={
                        app.aip_status === 'approved' ? 'bg-success' :
                        app.aip_status === 'declined' ? 'bg-destructive' :
                        'bg-warning'
                      }>
                        {app.aip_status}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(app.updated_at).toLocaleDateString()}
                  </div>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/broker/aip/${app.id}`)}
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      AIP
                    </Button>
                  </div>
                </div>
              ))
            )}
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
