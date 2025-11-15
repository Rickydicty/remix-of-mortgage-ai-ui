import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const BrokerWebTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    
    // Fetch all applications with user profiles and document counts
    const { data: apps, error } = await supabase
      .from('applications')
      .select(`
        *,
        profile:profiles!user_id(full_name, email),
        documents:documents!user_id(id, status, document_type)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
      return;
    }

    setApplications(apps || []);
    setLoading(false);
  };

  const assignApplication = async (applicationId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('applications')
      .update({ assigned_broker_id: user.id })
      .eq('id', applicationId);

    if (error) {
      console.error('Error assigning application:', error);
      toast.error("Failed to assign application");
    } else {
      toast.success("Application assigned to you");
      fetchApplications();
    }
  };

  const getDocumentStats = (docs: any[]) => {
    const approved = docs.filter((d: any) => d.status === 'approved').length;
    const waiting = docs.filter((d: any) => d.status === 'waiting').length;
    const total = docs.length;
    return { approved, waiting, total };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-3xl font-bold">{applications.length}</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned to Me</p>
                <p className="text-3xl font-bold">
                  {applications.filter((a: any) => a.assigned_broker_id === user?.id).length}
                </p>
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
                <p className="text-3xl font-bold">
                  {applications.filter((a: any) => a.status === 'pending' || a.status === 'draft').length}
                </p>
              </div>
              <Clock className="h-10 w-10 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-3xl font-bold">
                  {applications.filter((a: any) => !a.assigned_broker_id).length}
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Client Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No applications yet
            </p>
          ) : (
            <div className="space-y-4">
              {applications.map((app: any) => {
                const docStats = getDocumentStats(app.documents || []);
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div>
                        <p className="font-medium">{app.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{app.profile?.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">#{app.application_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <StatusBadge status={app.status} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Documents</p>
                        <p className="font-medium text-sm">
                          {docStats.approved} approved / {docStats.total} total
                        </p>
                        {docStats.waiting > 0 && (
                          <p className="text-xs text-warning">{docStats.waiting} waiting</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Assigned</p>
                        <p className="font-medium text-sm">
                          {app.assigned_broker_id ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Submitted</p>
                        <p className="font-medium text-sm">
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!app.assigned_broker_id && (
                        <Button
                          size="sm"
                          onClick={() => assignApplication(app.id)}
                        >
                          Assign
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dashboard/broker/application?id=${app.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerWebTab;
