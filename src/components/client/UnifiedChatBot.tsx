import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const [pendingClarifications, setPendingClarifications] = useState<PendingClarification[]>([]);
  const [activeClarification, setActiveClarification] = useState<PendingClarification | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!input.trim() || !applicationId) return;

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

      if (response.error) throw response.error;

      const data = response.data;

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

        if (data.escalated) {
          toast.info("Your message has been forwarded to your broker", {
            description: "They will respond within 24 hours.",
          });
        }
      } else {
        toast.error("Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
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
      {/* Floating Chat Button */}
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

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[440px] h-[600px] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base">Mortgage Assistant</DialogTitle>
                  <p className="text-xs text-muted-foreground">Here to help 24/7</p>
                </div>
              </div>
              {pendingClarifications.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingClarifications.length} action{pendingClarifications.length > 1 ? "s" : ""} needed
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Clarification Banner */}
          {activeClarification && (
            <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg shrink-0">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Clarification needed
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    <span className="font-medium">
                      {DOCUMENT_TYPE_LABELS[activeClarification.documentType] || activeClarification.documentType}
                    </span>
                    : {activeClarification.flagReason}
                  </p>
                  {pendingClarifications.length > 1 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      +{pendingClarifications.length - 1} more clarification{pendingClarifications.length > 2 ? "s" : ""} needed
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800"
                  onClick={() => setActiveClarification(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 && !activeClarification ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4 text-sm">
                  Hi! I'm your mortgage assistant. I can help with questions about your application, documents, and more.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs"
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
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === "agent" ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === "agent" ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      {msg.role === "agent" ? (
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-lg p-2.5 ${
                        msg.role === "agent"
                          ? "bg-muted"
                          : msg.type === "clarification"
                          ? "bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {msg.type === "clarification" && (
                        <div className="flex items-center gap-1 mb-1">
                          <FileText className="h-3 w-3" />
                          <span className="text-xs font-medium">Clarification</span>
                        </div>
                      )}
                      {msg.type === "escalation" && msg.role === "agent" && (
                        <div className="flex items-center gap-1 mb-1 text-primary">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs font-medium">Forwarded to broker</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <span className="text-[10px] opacity-60 block mt-1">
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
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-2.5">
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
          <div className="p-4 border-t shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder={
                  activeClarification
                    ? `Provide clarification for ${DOCUMENT_TYPE_LABELS[activeClarification.documentType] || "document"}...`
                    : "Type your message..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending || !applicationId}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || sending || !applicationId}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!applicationId && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Start your application to enable chat
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnifiedChatBot;
