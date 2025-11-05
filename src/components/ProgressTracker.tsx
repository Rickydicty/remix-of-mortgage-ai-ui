import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  status: "complete" | "current" | "upcoming";
}

interface ProgressTrackerProps {
  steps: Step[];
}

const ProgressTracker = ({ steps }: ProgressTrackerProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                  step.status === "complete" && "bg-success text-success-foreground",
                  step.status === "current" && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  step.status === "upcoming" && "bg-muted text-muted-foreground"
                )}
              >
                {step.status === "complete" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-xs mt-2 text-center font-medium">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-1 flex-1 mx-2",
                  step.status === "complete" ? "bg-success" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
