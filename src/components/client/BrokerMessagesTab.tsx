import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, User, Bot } from "lucide-react";
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
  approval_status?: string;
}

interface BrokerMessagesTabProps {
  applicationId: string | null;
  brokerId: string | null;
  brokerName?: string | null;
}

const BrokerMessagesTab = ({ 
  applicationId, 
  brokerId,
  brokerName 
}: BrokerMessagesTabProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('broker-messages-tab')
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
          if (brokerId && newMsg.sender_id === brokerId) {
            setMessages(prev => [...prev, newMsg]);
            // Mark as read since we're viewing
            markAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, brokerId]);

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (brokerId) {
        query = query.or(`and(sender_id.eq.${brokerId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${brokerId})`);
      } else {
        // If no broker assigned, just show messages where user is receiver
        query = query.eq('receiver_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);

      // Mark unread messages as read
      if (brokerId && data) {
        const unreadIds = data
          .filter(msg => msg.sender_id === brokerId && !msg.read)
          .map(msg => msg.id);
        
        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadIds);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
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
          approval_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state immediately
      if (msgData) {
        setMessages(prev => [...prev, msgData]);
      }

      // Create admin approval record
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

      toast.success("Message sent for approval");
      setReplyText("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!brokerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Broker Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No broker assigned yet</p>
            <p className="text-sm mt-1">Once a broker is assigned to your application, you'll be able to message them here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Messages with {brokerName || 'Your Broker'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages List */}
        <ScrollArea className="h-80 border rounded-lg p-4 bg-muted/20">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm mt-1">Start a conversation with your broker</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isFromClient = msg.sender_id === user?.id;
                const isPending = msg.approval_status === 'pending';
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isFromClient ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[80%] ${isFromClient ? 'flex-row-reverse' : ''}`}>
                      <div className={`rounded-full p-2 ${isFromClient ? 'bg-primary/10' : 'bg-muted'}`}>
                        {isFromClient ? (
                          <User className="h-4 w-4 text-primary" />
                        ) : (
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          isFromClient
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${isPending ? 'opacity-70' : ''}`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <div className={`flex items-center gap-2 mt-1 ${isFromClient ? 'justify-end' : 'justify-start'}`}>
                          <p className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                          {isPending && isFromClient && (
                            <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                              Pending approval
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Reply Input */}
        <div className="space-y-3">
          <Textarea
            placeholder="Type your message to your broker..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Your message will be sent for admin approval before being delivered.
            </p>
            <Button 
              onClick={sendReply} 
              disabled={sending || !replyText.trim()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrokerMessagesTab;
