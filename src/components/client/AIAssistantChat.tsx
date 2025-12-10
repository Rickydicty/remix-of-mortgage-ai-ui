import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, Paperclip, User, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: string;
  hasAttachment?: boolean;
  attachmentName?: string;
}

const quickQuestions = [
  "What is a P60?",
  "What documents do I need?",
  "How long does approval take?",
  "What is an AIP?",
];

interface AIAssistantChatProps {
  onEscalate?: () => void;
}

const AIAssistantChat = ({ onEscalate }: AIAssistantChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your mortgage assistant. I can help answer questions about documents, the application process, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (messageText: string, hasAttachment = false) => {
    if (!messageText.trim() && !hasAttachment) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
      hasAttachment,
      attachmentName: attachedFile?.name,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: messageText,
          hasAttachment,
          attachmentType: attachedFile?.type,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        type: data.type,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Handle escalation
      if (data.escalate) {
        toast.info("This question may require human support", {
          description: "Your broker can help with compliance or complex questions.",
          action: {
            label: "Contact Broker",
            onClick: () => onEscalate?.(),
          },
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again or contact your broker directly.",
        timestamp: new Date(),
        type: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input, !!attachedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum file size is 10MB" });
        return;
      }
      setAttachedFile(file);
      toast.success("File attached", { description: file.name });
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary" />
          AI Assistant
          <Badge variant="secondary" className="ml-auto text-xs">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question) => (
            <Button
              key={question}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleQuickQuestion(question)}
              disabled={isLoading}
            >
              {question}
            </Button>
          ))}
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-3 border border-border rounded-lg p-3 bg-muted/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-2.5 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border"
                }`}
              >
                {msg.hasAttachment && (
                  <div className="flex items-center gap-1 text-xs mb-1 opacity-80">
                    <Paperclip className="h-3 w-3" />
                    {msg.attachmentName}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] opacity-60 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-background border border-border rounded-lg p-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attached File Preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{attachedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setAttachedFile(null)}
            >
              Remove
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(input, !!attachedFile)}
            disabled={isLoading || (!input.trim() && !attachedFile)}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Escalation Notice */}
        <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            For complex questions or compliance matters, I'll suggest connecting you with your broker.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistantChat;
