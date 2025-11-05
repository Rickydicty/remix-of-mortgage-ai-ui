import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Bot, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: "client" | "broker" | "ai" | "system";
  title: string;
  description: string;
  timestamp: string;
}

interface SmartTimelineProps {
  events: TimelineEvent[];
}

const SmartTimeline = ({ events }: SmartTimelineProps) => {
  const getIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "client":
        return <User className="h-4 w-4" />;
      case "broker":
        return <FileText className="h-4 w-4" />;
      case "ai":
        return <Bot className="h-4 w-4" />;
      case "system":
        return <Clock className="h-4 w-4" />;
    }
  };

  const getIconBg = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "client":
        return "bg-primary";
      case "broker":
        return "bg-secondary";
      case "ai":
        return "bg-success";
      case "system":
        return "bg-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="relative">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white",
                    getIconBg(event.type)
                  )}
                >
                  {getIcon(event.type)}
                </div>
                {index < events.length - 1 && (
                  <div className="absolute left-1/2 top-8 bottom-0 w-0.5 bg-border -translate-x-1/2 h-4" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartTimeline;
