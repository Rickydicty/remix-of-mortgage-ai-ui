import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "complete" | "pending" | "flagged" | "verified" | "in-progress" | "draft";

interface StatusBadgeProps {
  status: Status;
  text?: string;
  className?: string;
}

const StatusBadge = ({ status, text, className }: StatusBadgeProps) => {
  const getVariant = () => {
    switch (status) {
      case "complete":
      case "verified":
        return "bg-success text-success-foreground";
      case "pending":
      case "in-progress":
        return "bg-warning text-warning-foreground";
      case "flagged":
        return "bg-destructive text-destructive-foreground";
      case "draft":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDisplayText = () => {
    if (text) return text;
    return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
  };

  return (
    <Badge className={cn(getVariant(), className)}>
      {getDisplayText()}
    </Badge>
  );
};

export default StatusBadge;
