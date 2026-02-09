import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Bot,
  User,
  Send,
  Loader2,
  MessageCircle,
  X,
  AlertTriangle,
  FileText,
  CheckCircle,
  Paperclip,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { emailTemplates } from "@/lib/emailTemplates";

interface Message {
  id: string;
  role: "agent" | "client";
  message: string;
  created_at: string;
  type?: "clarification" | "chat" | "escalation";
  documentId?: string;
  documentType?: string;
}

interface PendingClarification {
  documentId: string;
  documentType: string;
  flagReason: string;
  filename: string;
}

interface UnifiedChatBotProps {
  applicationId: string | null;
  userId: string;
  brokerId?: string | null;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  certified_id: "Certified ID",
  proof_of_address: "Proof of Address",
  payslips: "Payslips",
  bank_statements: "Bank Statements",
  employment_summary: "Employment Summary",
  p60: "P60",
  tax_returns: "Tax Returns",
  car_sale_agreement: "Car Sale Agreement",
  gift_letter: "Gift Letter",
  other: "Document",
};

const UnifiedChatBot = ({ applicationId, userId, brokerId }: UnifiedChatBotProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingClarifications, setPendingClarifications] = useState<PendingClarification[]>([]);
  const [activeClarification, setActiveClarification] = useState<PendingClarification | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch pending document clarifications
  const fetchPendingClarifications = async () => {
    if (!userId) return;

    const { data: flaggedDocs, error } = await supabase
      .from("documents")
      .select("id, document_type, flag_reason, filename, status")
      .eq("user_id", userId)
      .eq("status", "flagged")
      .is("client_justification", null);

    if (error) {
      console.error("Error fetching clarifications:", error);
      return;
    }

    if (flaggedDocs && flaggedDocs.length > 0) {
      const clarifications = flaggedDocs.map((doc) => ({
        documentId: doc.id,
        documentType: doc.document_type,
        flagReason: doc.flag_reason || "Additional information needed",
        filename: doc.filename,
      }));
      setPendingClarifications(clarifications);
      
      // Auto-open if there are pending clarifications
      if (clarifications.length > 0 && !isOpen) {
        setHasUnread(true);
        // Set the first clarification as active
        setActiveClarification(clarifications[0]);
      }
    }
  };

  // Fetch chat history
  const fetchMessages = async () => {
    if (!applicationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agent_conversations")
        .select("id, role, message, created_at, message_type, metadata")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(
        (data || []).map((m) => ({
          id: m.id,
          role: m.role as "agent" | "client",
          message: m.message,
          created_at: m.created_at,
          type: m.message_type as Message["type"],
        }))
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingClarifications();
    if (applicationId) {
      fetchMessages();
    }
  }, [applicationId, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Send clarification response
  const submitClarification = async () => {
    if (!input.trim() || !activeClarification) return;

    const clarificationText = input.trim();
    setInput("");
    setSending(true);

    try {
      // Update document with client justification
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          client_justification: clarificationText,
          status: "pending", // Move back to pending for review
        })
        .eq("id", activeClarification.documentId);

      if (updateError) throw updateError;

      // Add to conversation
      if (applicationId) {
        await supabase.from("agent_conversations").insert({
          application_id: applicationId,
          client_id: userId,
          role: "client",
          message: `[Clarification for ${DOCUMENT_TYPE_LABELS[activeClarification.documentType] || activeClarification.documentType}]: ${clarificationText}`,
          message_type: "clarification",
          metadata: { documentId: activeClarification.documentId },
        });
      }

      // Remove from pending
      setPendingClarifications((prev) =>
        prev.filter((c) => c.documentId !== activeClarification.documentId)
      );

      // Add success message
      setMessages((prev) => [
        ...prev,
        {
          id: `clarification-${Date.now()}`,
          role: "client",
          message: `Clarification for ${DOCUMENT_TYPE_LABELS[activeClarification.documentType] || activeClarification.documentType}: ${clarificationText}`,
          created_at: new Date().toISOString(),
          type: "clarification",
        },
        {
          id: `agent-confirm-${Date.now()}`,
          role: "agent",
          message: `Thank you for providing that clarification! We've received your explanation for the ${DOCUMENT_TYPE_LABELS[activeClarification.documentType] || activeClarification.documentType}. Our team will review it shortly and update your document status.`,
          created_at: new Date().toISOString(),
          type: "chat",
        },
      ]);

      // Check for more clarifications
      const remaining = pendingClarifications.filter(
        (c) => c.documentId !== activeClarification.documentId
      );
      if (remaining.length > 0) {
        setActiveClarification(remaining[0]);
      } else {
        setActiveClarification(null);
      }

      toast.success("Clarification submitted successfully");
    } catch (error) {
      console.error("Error submitting clarification:", error);
      toast.error("Failed to submit clarification");
    } finally {
      setSending(false);
    }
  };

  // Send regular chat message
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    if (!applicationId) {
      toast.error("Application not ready yet", {
        description: "Please wait a moment while we set up your application."
      });
      return;
    }

    // If there's an active clarification, submit that instead
    if (activeClarification) {
      return submitClarification();
    }

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: "client",
        message: userMessage,
        created_at: new Date().toISOString(),
        type: "chat",
      },
    ]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to chat");
        return;
      }

      const response = await supabase.functions.invoke("unified-chat-bot", {
        body: {
          message: userMessage,
          applicationId,
          brokerId,
        },
      });

      // Check for rate limit or other errors in response data
      const data = response.data;
      
      if (response.error || data?.error) {
        const errorCode = data?.code;
        const errorMessage = data?.error || response.error?.message;
        
        // Handle rate limiting gracefully
        if (errorCode === "RATE_LIMITED" || response.error?.message?.includes("429")) {
          setMessages((prev) => [
            ...prev,
            {
              id: `agent-${Date.now()}`,
              role: "agent",
              message: "I'm currently experiencing high demand. Please wait a moment and try again. 🙏",
              created_at: new Date().toISOString(),
              type: "chat",
            },
          ]);
          toast.info("Please wait a moment", {
            description: "The AI assistant is busy. Try again in 30 seconds.",
          });
          return;
        }
        
        throw new Error(errorMessage || "Unknown error");
      }

      if (data.success && data.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            role: "agent",
            message: data.response,
            created_at: new Date().toISOString(),
            type: data.escalated ? "escalation" : "chat",
          },
        ]);

        // Notify broker that client replied in AI chat
        if (brokerId) {
          const { data: brokerProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', brokerId)
            .single();

          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

          if (brokerProfile?.email) {
            supabase.functions.invoke('send-notification', {
              body: {
                notification_type: 'client_replied_to_ai',
                subject: `Client AI Chat: ${clientProfile?.full_name || 'A client'} needs attention`,
                recipient_email: brokerProfile.email,
                html_content: emailTemplates.clientRepliedToAI({
                  clientName: clientProfile?.full_name || 'A client',
                  messagePreview: userMessage.substring(0, 200),
                  applicationId: applicationId || '',
                  dashboardUrl: 'https://yourkey.ie/login',
                }),
              }
            });
          }
        }

        if (data.escalated) {
          toast.info("Your message has been forwarded to your broker", {
            description: "They will respond within 24 hours.",
          });
        }
      } else {
        toast.error("Failed to get response");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      // Show friendly error in chat instead of just toast
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-error-${Date.now()}`,
          role: "agent",
          message: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          created_at: new Date().toISOString(),
          type: "chat",
        },
      ]);
      
      toast.error("Message not sent", {
        description: "Please try again in a few seconds."
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!applicationId) {
      toast.error("Application not ready yet", {
        description: "Please wait a moment while we set up your application."
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Authentication required", {
          description: "Please log in to upload documents"
        });
        return;
      }

      // Show uploading message
      const uploadMessageId = `upload-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: uploadMessageId,
          role: "client",
          message: `📎 Uploading ${file.name}...`,
          created_at: new Date().toISOString(),
          type: "chat",
        },
      ]);

      // Determine document type from filename or use "other"
      const documentType = "other"; // Default, can be enhanced later

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetch(
        `https://urdyzlulkpgffzrwefwj.supabase.co/functions/v1/analyze-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Remove uploading message and add success message
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== uploadMessageId);
        return [
          ...filtered,
          {
            id: `upload-success-${Date.now()}`,
            role: "client",
            message: `✅ Successfully uploaded ${file.name}`,
            created_at: new Date().toISOString(),
            type: "chat",
          },
          {
            id: `agent-upload-${Date.now()}`,
            role: "agent",
            message: `Thank you for uploading ${file.name}! I've received your document and it's being processed. Our team will review it shortly.`,
            created_at: new Date().toISOString(),
            type: "chat",
          },
        ];
      });

      // Add to conversation
      await supabase.from("agent_conversations").insert({
        application_id: applicationId,
        client_id: userId,
        role: "client",
        message: `[Document Upload]: ${file.name}`,
        message_type: "chat",
        metadata: { documentId: data.document?.id, filename: file.name },
      });

      toast.success("Document uploaded successfully");
      
      // Refresh pending clarifications in case new ones appear
      fetchPendingClarifications();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload document");
      
      // Remove uploading message and add error message
      setMessages((prev) => {
        const filtered = prev.filter(m => !m.id.startsWith('upload-'));
        return [
          ...filtered,
          {
            id: `upload-error-${Date.now()}`,
            role: "agent",
            message: "I'm sorry, there was an error uploading your document. Please try again or contact support.",
            created_at: new Date().toISOString(),
            type: "chat",
          },
        ];
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const quickQuestions = [
    "What documents do I still need?",
    "How long will the process take?",
    "What's the next step?",
  ];

  const totalNotifications = pendingClarifications.length;

  return (
    <>
      {/* Floating Chat Button - hidden when chat is open */}
      {!isOpen && (
        <Button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {(hasUnread || totalNotifications > 0) && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {totalNotifications > 0 ? totalNotifications : "!"}
            </span>
          )}
        </Button>
      )}

      {/* Chat Panel - Fixed bottom right */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[500px] flex flex-col z-50 shadow-2xl border">
          {/* Header */}
          <CardHeader className="p-3 pb-2 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Mortgage Assistant</h3>
                  <p className="text-[10px] text-muted-foreground">Here to help 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingClarifications.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                    {pendingClarifications.length} action{pendingClarifications.length > 1 ? "s" : ""}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Clarification Banner */}
            {activeClarification && (
              <div className="mx-3 mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg shrink-0">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                      Clarification needed
                    </p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5">
                      <span className="font-medium">
                        {DOCUMENT_TYPE_LABELS[activeClarification.documentType] || activeClarification.documentType}
                      </span>
                      : {activeClarification.flagReason}
                    </p>
                    {pendingClarifications.length > 1 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                        +{pendingClarifications.length - 1} more
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-amber-600 hover:text-amber-800"
                    onClick={() => setActiveClarification(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 && !activeClarification ? (
                <div className="text-center py-6">
                  <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-3 text-xs">
                    Hi! I'm your mortgage assistant. Ask me anything!
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {quickQuestions.map((q, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 px-2"
                        onClick={() => {
                          setInput(q);
                        }}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.role === "agent" ? "" : "flex-row-reverse"}`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === "agent" ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        {msg.role === "agent" ? (
                          <Bot className="h-3 w-3 text-primary" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-lg p-2 ${
                          msg.role === "agent"
                            ? "bg-muted"
                            : msg.type === "clarification"
                            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {msg.type === "clarification" && (
                          <div className="flex items-center gap-1 mb-0.5">
                            <FileText className="h-2.5 w-2.5" />
                            <span className="text-[10px] font-medium">Clarification</span>
                          </div>
                        )}
                        {msg.type === "escalation" && msg.role === "agent" && (
                          <div className="flex items-center gap-1 mb-0.5 text-primary">
                            <CheckCircle className="h-2.5 w-2.5" />
                            <span className="text-[10px] font-medium">Forwarded to broker</span>
                          </div>
                        )}
                        <p className="text-xs whitespace-pre-wrap">{msg.message}</p>
                        <span className="text-[9px] opacity-60 block mt-0.5">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <div className="flex gap-1">
                          <span
                            className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t shrink-0">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={uploading || !applicationId}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !applicationId}
                  title="Upload document"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  placeholder={
                    activeClarification
                      ? `Clarify ${DOCUMENT_TYPE_LABELS[activeClarification.documentType] || "document"}...`
                      : "Type your message..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending || uploading || !applicationId}
                  className="flex-1 h-9 text-sm"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={sendMessage}
                  disabled={!input.trim() || sending || uploading || !applicationId}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!applicationId && (
                <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                  Start your application to enable chat
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default UnifiedChatBot;
