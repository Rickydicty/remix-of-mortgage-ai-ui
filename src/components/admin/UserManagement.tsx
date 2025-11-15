import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Briefcase, Trash2, Sparkles, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'broker' | 'admin';
  created_at: string;
  assigned_broker_id?: string;
  client_count?: number;
}

interface BrokerSuggestion {
  broker_id: string;
  broker_name: string;
  reason: string;
  current_clients: number;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [brokers, setBrokers] = useState<UserProfile[]>([]);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get broker assignments and counts
      const { data: applications } = await supabase
        .from('applications')
        .select('user_id, assigned_broker_id');

      const usersWithRoles = profiles?.map(profile => {
        const role = roles?.find(r => r.user_id === profile.id)?.role || 'client';
        const userApp = applications?.find(a => a.user_id === profile.id);
        const clientCount = role === 'broker' 
          ? applications?.filter(a => a.assigned_broker_id === profile.id).length 
          : 0;

        return {
          ...profile,
          role,
          assigned_broker_id: userApp?.assigned_broker_id,
          client_count: clientCount
        };
      }) || [];

      setUsers(usersWithRoles);
      setBrokers(usersWithRoles.filter(u => u.role === 'broker'));
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'client' | 'broker' | 'admin') => {
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
      if (error) throw error;
      toast({ title: "Role updated", description: "User role has been updated successfully" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error updating role", description: error.message, variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-user', { body: { userId } });
      if (error) throw error;
      toast({ title: "User deleted", description: "User has been removed successfully" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error deleting user", description: error.message, variant: "destructive" });
    }
  };

  const assignBroker = async (clientId: string, brokerId: string) => {
    try {
      const { data: app } = await supabase.from('applications').select('id').eq('user_id', clientId).maybeSingle();
      if (!app) {
        const appNumber = `APP-${Date.now().toString(36).toUpperCase()}`;
        const { error } = await supabase.from('applications').insert([{ 
          user_id: clientId, 
          assigned_broker_id: brokerId,
          application_number: appNumber
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('applications').update({ assigned_broker_id: brokerId }).eq('user_id', clientId);
        if (error) throw error;
      }
      toast({ title: "Broker assigned", description: "Client has been assigned to broker" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error assigning broker", description: error.message, variant: "destructive" });
    }
  };

  const getAISuggestion = async (clientId: string) => {
    setAiSuggesting(true);
    try {
      const client = users.find(u => u.id === clientId);
      const { data, error } = await supabase.functions.invoke('suggest-broker', {
        body: { clientId, clientName: client?.full_name, brokers }
      });
      if (error) throw error;
      const suggestion: BrokerSuggestion = data.suggestion;
      toast({
        title: "AI Suggestion",
        description: `${suggestion.broker_name} (${suggestion.current_clients} clients) - ${suggestion.reason}`,
        duration: 8000
      });
      if (suggestion.broker_id) await assignBroker(clientId, suggestion.broker_id);
    } catch (error: any) {
      toast({ title: "Error getting AI suggestion", description: error.message, variant: "destructive" });
    } finally {
      setAiSuggesting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'broker': return <Briefcase className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'broker': return 'default';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Broker Workload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {brokers.map((broker) => (
              <div key={broker.id} className="p-4 border border-border rounded-lg">
                <p className="font-medium text-foreground">{broker.full_name}</p>
                <p className="text-2xl font-bold text-primary mt-2">{broker.client_count || 0}</p>
                <p className="text-xs text-muted-foreground">clients assigned</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{user.full_name || 'No name'}</p>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1">
                      {getRoleIcon(user.role)}
                      {user.role}
                    </Badge>
                    {user.role === 'broker' && (
                      <Badge variant="outline">{user.client_count || 0} clients</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user.role === 'client' && (
                    <>
                      <Select
                        value={user.assigned_broker_id || "unassigned"}
                        onValueChange={(value) => value !== "unassigned" && assignBroker(user.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assign broker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {brokers.map((broker) => (
                            <SelectItem key={broker.id} value={broker.id}>
                              {broker.full_name} ({broker.client_count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getAISuggestion(user.id)}
                        disabled={aiSuggesting}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Select
                    value={user.role}
                    onValueChange={(value) => updateUserRole(user.id, value as any)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="broker">Broker</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {user.full_name || user.email}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(user.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
