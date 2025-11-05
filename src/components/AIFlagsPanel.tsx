import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Flag {
  id: string;
  type: "critical" | "warning" | "clear";
  message: string;
  section?: string;
}

interface AIFlagsPanelProps {
  flags: Flag[];
}

const AIFlagsPanel = ({ flags }: AIFlagsPanelProps) => {
  const getIcon = (type: Flag["type"]) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "clear":
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getBadgeVariant = (type: Flag["type"]) => {
    switch (type) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "clear":
        return "bg-success text-success-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No flags at this time</p>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
            >
              {getIcon(flag.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getBadgeVariant(flag.type)}>
                    {flag.type.toUpperCase()}
                  </Badge>
                  {flag.section && (
                    <span className="text-xs text-muted-foreground">{flag.section}</span>
                  )}
                </div>
                <p className="text-sm">{flag.message}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AIFlagsPanel;
