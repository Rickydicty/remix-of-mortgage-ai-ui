import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
}

interface ClientMessagingProps {
  clientId: string;
  clientName: string;
  applicationId?: string;
}

const ClientMessaging = ({ clientId, clientName, applicationId }: ClientMessagingProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user || !clientId) return;

    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${clientId},receiver_id=eq.${user.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, clientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;

    // Brokers only see approved messages from clients
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${clientId}),and(sender_id.eq.${clientId},receiver_id.eq.${user.id},approval_status.eq.approved)`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    setLoading(true);
    
    // Check if sender is a client (needs approval) or broker (direct send)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isClient = roleData?.role === 'client';
    
    const { data: msgData, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: clientId,
        application_id: applicationId,
        message: newMessage.trim(),
        approval_status: isClient ? 'pending' : 'approved' // Clients need approval
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } else {
      // If client, create admin approval record
      if (isClient && msgData) {
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
              message_preview: newMessage.trim().substring(0, 100)
            }
          });
        toast.success("Message sent for approval");
      } else {
        toast.success("Message sent");
      }

      // Send message_received notification email
      supabase.functions.invoke('send-notification', {
        body: {
          notification_type: 'message_received',
          subject: `New Message from ${isClient ? 'Client' : 'Broker'}`,
          html_content: `
            <h2>New Message Received</h2>
            <p>A new message has been sent in the mortgage portal.</p>
            <h3>Message Details:</h3>
            <ul>
              <li><strong>From:</strong> ${isClient ? 'Client' : 'Broker'}</li>
              <li><strong>To:</strong> ${clientName}</li>
              ${applicationId ? `<li><strong>Application ID:</strong> ${applicationId}</li>` : ''}
            </ul>
            <p><strong>Message Preview:</strong></p>
            <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin: 10px 0;">
              ${newMessage.trim().substring(0, 200)}${newMessage.length > 200 ? '...' : ''}
            </blockquote>
            <p>Please log in to the dashboard to view the full message.</p>
          `,
          event_data: {
            sender_type: isClient ? 'client' : 'broker',
            receiver_name: clientName,
            application_id: applicationId,
          },
        },
      }).catch(err => console.log("Message notification sent:", err));

      setNewMessage("");
      fetchMessages();
    }
    
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages with {clientName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages List */}
        <div className="h-96 overflow-y-auto space-y-3 border border-border rounded-lg p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet. Start a conversation!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
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
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={2}
            className="resize-none"
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientMessaging;
