import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BrokerAdminTab = () => {
  return (
    <div className="space-y-6">
      {/* AI Analytics Dashboard */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold">76%</p>
                <p className="text-xs text-success">+5% vs last month</p>
              </div>
              <TrendingUp className="h-10 w-10 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Time to AIP</p>
                <p className="text-3xl font-bold">8.5</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <Clock className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approval Ratio</p>
                <p className="text-3xl font-bold">92%</p>
                <p className="text-xs text-success">+3% vs last month</p>
              </div>
              <CheckCircle className="h-10 w-10 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cases</p>
                <p className="text-3xl font-bold">48</p>
                <p className="text-xs text-muted-foreground">across all stages</p>
              </div>
              <Users className="h-10 w-10 text-secondary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends - Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-3">
            {[68, 72, 70, 74, 76, 76].map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-success rounded-t transition-all hover:bg-success/80"
                  style={{ height: `${value}%` }}
                />
                <span className="text-xs text-muted-foreground mt-2">
                  {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
                </span>
                <span className="text-xs font-medium">{value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Anomaly Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 border border-warning/50 bg-warning/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Unusual Edit Detected</h4>
              <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded">Warning</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Case MG-2024-1220: Income figure edited 3 times in 10 minutes
            </p>
            <p className="text-xs text-muted-foreground">Broker: Mark Johnson • Dec 15, 2024 at 14:35</p>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">High Volume Activity</h4>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Info</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              15 document uploads in last hour - higher than usual
            </p>
            <p className="text-xs text-muted-foreground">System-wide • Dec 15, 2024</p>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <Button size="sm">Add User</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Sarah O'Connor", role: "Senior Broker", cases: 48, status: "active" },
              { name: "Mark Johnson", role: "Broker", cases: 32, status: "active" },
              { name: "Lisa Murphy", role: "Junior Broker", cases: 18, status: "active" },
              { name: "Tom Wilson", role: "Admin", cases: 0, status: "active" },
            ].map((user) => (
              <div
                key={user.name}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{user.name}</h4>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.cases} cases</p>
                    <p className="text-xs text-success capitalize">{user.status}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance & Audit Logs</CardTitle>
            <Button size="sm" variant="outline">
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { event: "AML check completed", case: "MG-2024-1234", time: "10 mins ago" },
              { event: "Document verified", case: "MG-2024-1235", time: "1 hour ago" },
              { event: "Lender submission", case: "MG-2024-1236", time: "2 hours ago" },
              { event: "Client consent recorded", case: "MG-2024-1237", time: "3 hours ago" },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-3 border-l-2 border-primary pl-4">
                <div>
                  <p className="text-sm font-medium">{log.event}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.case} • {log.time}
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerAdminTab;
