import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, MessageSquare, Send, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { emailTemplates } from "@/lib/emailTemplates";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
  application_id: string | null;
}

interface BrokerMessageNotificationProps {
  applicationId: string | null;
  brokerId: string | null;
  brokerName?: string | null;
}

const BrokerMessageNotification = ({ 
  applicationId, 
  brokerId,
  brokerName 
}: BrokerMessageNotificationProps) => {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!user || !brokerId) return;

    fetchMessages();

    // Subscribe to new messages from broker
    const channel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only show broker messages (approved ones)
          if (newMsg.sender_id === brokerId) {
            setUnreadMessages(prev => [...prev, newMsg]);
            setAllMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, brokerId]);

  const fetchMessages = async () => {
    if (!user || !brokerId) return;

    // Fetch messages between client and broker
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${brokerId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${brokerId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setAllMessages(data || []);
    
    // Filter unread messages from broker
    const unread = (data || []).filter(
      msg => msg.sender_id === brokerId && !msg.read
    );
    setUnreadMessages(unread);
  };

  const openMessageDialog = async (message?: Message) => {
    setSelectedMessage(message || null);
    setDialogOpen(true);

    // Mark messages as read
    if (user && brokerId) {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', brokerId)
        .eq('read', false);

      if (!error) {
        setUnreadMessages([]);
      }
    }
  };

  const sendReply = async () => {
    if (!user || !brokerId || !replyText.trim()) return;

    setSending(true);

    try {
      // Get broker's email for notification
      const { data: brokerProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', brokerId)
        .maybeSingle();

      const { data: msgData, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: brokerId,
          application_id: applicationId,
          message: replyText.trim(),
          approval_status: 'pending' // Client messages need admin approval
        })
        .select('id')
        .single();

      if (error) throw error;

      // Create admin approval record for client message
      if (msgData) {
        await supabase
          .from('admin_approvals')
          .insert({
            action_type: 'message',
            entity_id: msgData.id,
            entity_table: 'messages',
            client_id: user.id,
            application_id: applicationId || null,
            status: 'pending',
            metadata: {
              message_preview: replyText.trim().substring(0, 100)
            }
          });
      }

      // Send email notification to broker
      if (brokerProfile?.email) {
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        await supabase.functions.invoke('send-notification', {
          body: {
            notification_type: 'message_received',
            recipient_email: brokerProfile.email,
            subject: `New Message from Client - YourKey Mortgages`,
            html_content: emailTemplates.messageReceived({
              recipientName: brokerProfile.full_name || 'Broker',
              senderType: 'client',
              messagePreview: replyText.trim().substring(0, 200) + (replyText.length > 200 ? '...' : ''),
              applicationId: applicationId || undefined,
              loginUrl: `${window.location.origin}/login`,
            }),
            event_data: {
              sender_type: 'client',
              receiver_name: brokerProfile.full_name,
              application_id: applicationId,
            },
          },
        });
      }

      toast.success("Reply sent for approval");
      setReplyText("");
      fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const dismissNotification = () => {
    setDialogOpen(false);
    setSelectedMessage(null);
    setReplyText("");
  };

  if (!brokerId || unreadMessages.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Banner */}
      <Card className="mb-4 border-primary/50 bg-primary/5 animate-in slide-in-from-top duration-300">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-6 w-6 text-primary" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadMessages.length}
                </Badge>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  New message{unreadMessages.length > 1 ? 's' : ''} from your broker
                </p>
                <p className="text-sm text-muted-foreground">
                  {brokerName || 'Your assigned broker'} sent you a message
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => openMessageDialog(unreadMessages[0])}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                View & Reply
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async () => {
                  // Mark all as read without opening
                  if (user && brokerId) {
                    await supabase
                      .from('messages')
                      .update({ read: true })
                      .eq('receiver_id', user.id)
                      .eq('sender_id', brokerId);
                    setUnreadMessages([]);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Messages with {brokerName || 'Your Broker'}
            </DialogTitle>
          </DialogHeader>

          {/* Messages List */}
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-3">
              {allMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No messages yet
                </p>
              ) : (
                allMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Reply Input */}
          <div className="space-y-3 pt-4 border-t">
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Note: Your message will be sent for admin approval before being delivered.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={dismissNotification}>
              Cancel
            </Button>
            <Button 
              onClick={sendReply} 
              disabled={sending || !replyText.trim()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BrokerMessageNotification;
