import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Users, FileText } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";

const BrokerTrackerTab = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for the applications
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(app => app.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          // Map profiles to applications
          const appsWithProfiles = data.map(app => ({
            ...app,
            profile: profilesData.find(p => p.id === app.user_id)
          }));
          setApplications(appsWithProfiles);
        } else {
          setApplications(data);
        }
      } else {
        setApplications([]);
      }
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

  // Calculate summary stats
  const totalApplications = applications.length;
  const inProgressCount = applications.filter(app => !['completed', 'declined'].includes(app.status)).length;
  const completedCount = applications.filter(app => app.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalApplications}</p>
                <p className="text-sm text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">8.5 days</p>
                <p className="text-sm text-muted-foreground">Avg. Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {stageColumns.map((stage) => (
              <div key={stage.id} className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">{stage.label}</p>
                <p className="text-2xl font-bold text-primary">{stage.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Progress Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Client Progress</CardTitle>
            <div className="flex gap-2">
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Complete</Badge>
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">In Progress</Badge>
              <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Pending</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 pb-3 border-b border-border text-sm font-medium text-muted-foreground">
              <div>App ID</div>
              <div>Client</div>
              <div>Current Stage</div>
              <div>Progress</div>
              <div>Status</div>
              <div>Last Updated</div>
            </div>

            {/* Client Rows */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No applications found</div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="grid grid-cols-6 gap-4 py-4 items-center border-b border-border last:border-0 hover:bg-accent/50 transition-colors rounded-lg px-2"
                >
                  <div className="font-mono text-sm font-medium">{app.application_number}</div>
                  <div className="font-medium">
                    {app.profile?.full_name || app.profile?.email || 'Unknown'}
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
                  <div className="text-sm text-muted-foreground">
                    {new Date(app.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Progress Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-green-500/10 rounded-lg">
              <h4 className="font-medium text-green-600 mb-2">On Track</h4>
              <p className="text-sm">8 clients progressing as expected</p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-lg">
              <h4 className="font-medium text-yellow-600 mb-2">Needs Attention</h4>
              <p className="text-sm">3 clients may need follow-up</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.slice(0, 3).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{app.profile?.full_name || 'Client'}</p>
                  <p className="text-xs text-muted-foreground">Stage: {getStageLabel(app.current_step)}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(app.updated_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {applications.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrokerTrackerTab;
