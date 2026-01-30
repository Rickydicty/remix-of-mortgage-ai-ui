import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, Mail, Save, RefreshCw } from "lucide-react";

interface NotificationSetting {
  id: string;
  notification_type: string;
  enabled: boolean;
  recipient_email: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  new_client_signup: "New Client Signup",
  document_uploaded: "Document Uploaded",
  application_submitted: "Application Submitted",
  aip_status_change: "AIP Status Change",
  signature_completed: "Signature Completed",
  message_received: "Message Received",
  form_progress: "Form Progress (50%)",
  docs_complete: "Documents Complete",
  journey_started: "Journey Started",
  human_review_needed: "Human Review Needed",
  application_approved: "Application Approved",
  application_rejected: "Application Rejected",
};

export const NotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<Record<string, { enabled: boolean; recipient_email: string }>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('notification_type');

      if (error) throw error;

      setSettings(data || []);
      // Initialize edited settings
      const initial: Record<string, { enabled: boolean; recipient_email: string }> = {};
      data?.forEach(s => {
        initial[s.id] = { enabled: s.enabled, recipient_email: s.recipient_email };
      });
      setEditedSettings(initial);
    } catch (error: any) {
      console.error('Error fetching notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setEditedSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled }
    }));
  };

  const handleEmailChange = (id: string, recipient_email: string) => {
    setEditedSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], recipient_email }
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Update each setting that was modified
      for (const setting of settings) {
        const edited = editedSettings[setting.id];
        if (edited.enabled !== setting.enabled || edited.recipient_email !== setting.recipient_email) {
          const { error } = await supabase
            .from('notification_settings')
            .update({
              enabled: edited.enabled,
              recipient_email: edited.recipient_email,
            })
            .eq('id', setting.id);

          if (error) throw error;
        }
      }

      toast.success('Notification settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return settings.some(s => {
      const edited = editedSettings[s.id];
      return edited && (edited.enabled !== s.enabled || edited.recipient_email !== s.recipient_email);
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription className="mt-1">
              Configure email notifications for client and broker events
            </CardDescription>
          </div>
          <Button 
            onClick={saveSettings} 
            disabled={saving || !hasChanges()}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {settings.map((setting) => {
            const edited = editedSettings[setting.id] || { enabled: setting.enabled, recipient_email: setting.recipient_email };
            
            return (
              <div 
                key={setting.id} 
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Switch
                      id={`toggle-${setting.id}`}
                      checked={edited.enabled}
                      onCheckedChange={(checked) => handleToggle(setting.id, checked)}
                    />
                    <div>
                      <Label 
                        htmlFor={`toggle-${setting.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {NOTIFICATION_TYPE_LABELS[setting.notification_type] || setting.notification_type}
                      </Label>
                      {setting.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {setting.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="email"
                    value={edited.recipient_email}
                    onChange={(e) => handleEmailChange(setting.id, e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full sm:w-64"
                    disabled={!edited.enabled}
                  />
                </div>
              </div>
            );
          })}

          {settings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No notification settings found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
