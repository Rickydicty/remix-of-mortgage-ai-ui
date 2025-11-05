import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const BrokerRatesTab = () => {
  const rates = [
    {
      lender: "Bank of Ireland",
      fixedRate: "3.10%",
      variableRate: "3.85%",
      ltv: "Up to 90%",
      change: "down",
      changeAmount: "0.15%",
    },
    {
      lender: "AIB",
      fixedRate: "3.30%",
      variableRate: "4.00%",
      ltv: "Up to 90%",
      change: "down",
      changeAmount: "0.10%",
    },
    {
      lender: "Haven",
      fixedRate: "3.50%",
      variableRate: "4.15%",
      ltv: "Up to 90%",
      change: "up",
      changeAmount: "0.05%",
    },
    {
      lender: "Avant Money",
      fixedRate: "3.45%",
      variableRate: "3.95%",
      ltv: "Up to 80%",
      change: "same",
      changeAmount: "0%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Rate Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Trends - Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {[3.8, 3.7, 3.65, 3.6, 3.55, 3.5, 3.45, 3.4, 3.35, 3.3, 3.25, 3.2].map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                  style={{ height: `${(value / 4) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
                  {i % 3 === 0 && `Week ${Math.floor(i / 3) + 1}`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-success font-medium">
              ↓ Average rates decreased by 0.60% this month
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Rates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Mortgage Rates</CardTitle>
            <Button size="sm" variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Set Rate Alerts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Lender</th>
                  <th className="p-3 text-right">Fixed (3yr)</th>
                  <th className="p-3 text-right">Variable</th>
                  <th className="p-3 text-left">Max LTV</th>
                  <th className="p-3 text-center">Change</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.lender} className="border-t border-border hover:bg-accent/50">
                    <td className="p-3 font-medium">{rate.lender}</td>
                    <td className="p-3 text-right font-bold text-primary">{rate.fixedRate}</td>
                    <td className="p-3 text-right">{rate.variableRate}</td>
                    <td className="p-3">{rate.ltv}</td>
                    <td className="p-3 text-center">
                      {rate.change === "down" && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <TrendingDown className="h-4 w-4" />
                          {rate.changeAmount}
                        </span>
                      )}
                      {rate.change === "up" && (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <TrendingUp className="h-4 w-4" />
                          {rate.changeAmount}
                        </span>
                      )}
                      {rate.change === "same" && (
                        <span className="text-muted-foreground">No change</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Matchmaking */}
      <Card>
        <CardHeader>
          <CardTitle>AI Matchmaking - Clients Who Benefit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 border border-primary/50 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">John Doe - MG-2024-1234</h4>
              <Button size="sm" variant="outline">
                Notify
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Bank of Ireland rate dropped 0.15% - potential savings: €45/month
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                Better rate available
              </span>
            </div>
          </div>
          <div className="p-4 border border-primary/50 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Emma Walsh - MG-2024-1235</h4>
              <Button size="sm" variant="outline">
                Notify
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              AIB now offers better rate for her LTV - potential savings: €30/month
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                Consider switching lender
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Alert Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Rate Drop Alert</h4>
                <p className="text-sm text-muted-foreground">Notify when rates drop by 0.10% or more</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-success/20 text-success px-3 py-1 rounded">Active</span>
              </div>
            </div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Client Opportunity Alert</h4>
                <p className="text-sm text-muted-foreground">
                  Auto-match clients with new competitive rates
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-success/20 text-success px-3 py-1 rounded">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerRatesTab;
