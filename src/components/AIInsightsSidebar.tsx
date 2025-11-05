import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";

interface Insight {
  lender: string;
  eligibility: number;
  rate: string;
  notes: string;
}

interface AIInsightsSidebarProps {
  insights: Insight[];
  recommendations: string[];
  summary: string;
}

const AIInsightsSidebar = ({ insights, recommendations, summary }: AIInsightsSidebarProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-secondary" />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Lender Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.lender} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{insight.lender}</span>
                <Badge className="bg-success text-success-foreground">
                  {insight.eligibility}% Match
                </Badge>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate:</span>
                  <span className="font-medium">{insight.rate}</span>
                </div>
                <p className="text-muted-foreground">{insight.notes}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsightsSidebar;
