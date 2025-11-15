import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const BrokerRatesTab = () => {
  // TODO: Fetch mortgage rates from database or external API
  const rates: any[] = [];

  return (
    <div className="space-y-6">
      {/* Rate Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Trends - Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
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
          <p className="text-sm text-muted-foreground">No matching opportunities at this time.</p>
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
