import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ClientMessaging from "@/components/broker/ClientMessaging";
import DocumentReview from "@/components/broker/DocumentReview";

const BrokerWebTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMessageFor, setOpenMessageFor] = useState<string | null>(null);
  const [openDocsFor, setOpenDocsFor] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);

    // 1) Fetch applications only (no joins; there are no DB FKs defined)
    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      setLoading(false);
      return;
    }

    if (!apps || apps.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    // 2) Fetch related profiles and documents in parallel using user_id list
    const userIds = Array.from(new Set(apps.map((a: any) => a.user_id)));

    const [profilesRes, docsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').in('id', userIds),
      supabase.from('documents').select('id, status, document_type, user_id').in('user_id', userIds),
    ]);

    const profiles = profilesRes.data || [];
    const docs = docsRes.data || [];

    if (profilesRes.error) {
      console.error('Error fetching profiles:', profilesRes.error);
    }
    if (docsRes.error) {
      console.error('Error fetching documents:', docsRes.error);
    }

    // 3) Map by user_id
    const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
    for (const p of profiles as any[]) profileMap[(p as any).id] = { full_name: (p as any).full_name, email: (p as any).email };

    const docsByUser: Record<string, any[]> = {};
    for (const d of docs as any[]) {
      const uid = (d as any).user_id;
      if (!docsByUser[uid]) docsByUser[uid] = [];
      docsByUser[uid].push(d);
    }

    // 4) Enrich applications so the rest of the UI can stay the same
    const enriched = (apps as any[]).map((app: any) => ({
      ...app,
      profile: profileMap[app.user_id] || null,
      documents: docsByUser[app.user_id] || [],
    }));

    setApplications(enriched);
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
                  {applications.filter((a: any) => a.status === 'pending_review' || a.status === 'in_review').length}
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
              {applications
                .sort((a: any, b: any) => {
                  // Prioritize review statuses
                  const aReview = a.status === 'pending_review' || a.status === 'in_review';
                  const bReview = b.status === 'pending_review' || b.status === 'in_review';
                  if (aReview && !bReview) return -1;
                  if (!aReview && bReview) return 1;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map((app: any) => {
                const docStats = getDocumentStats(app.documents || []);
                return (
                  <div 
                    key={app.id} 
                    className={`p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                      (app.status === 'pending_review' || app.status === 'in_review') ? 'border-warning bg-warning/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
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
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setOpenDocsFor(prev => prev === app.id ? null : app.id)}
                        >
                          Documents
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setOpenMessageFor(prev => prev === app.id ? null : app.id)}
                        >
                          Message
                        </Button>
                      </div>
                    </div>

                    {openDocsFor === app.id && (
                      <div className="mt-4">
                        <DocumentReview
                          clientId={app.user_id}
                          clientName={app.profile?.full_name || 'Unknown'}
                          applicationId={app.id}
                          onUpdate={fetchApplications}
                        />
                      </div>
                    )}

                    {openMessageFor === app.id && (
                      <div className="mt-4">
                        <ClientMessaging
                          clientId={app.user_id}
                          clientName={app.profile?.full_name || 'Unknown'}
                          applicationId={app.id}
                        />
                      </div>
                    )}
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
