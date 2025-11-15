import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Briefcase, CreditCard, Home, FileText, CheckSquare, Building2, MessageSquare, History, Shield, AlertCircle } from "lucide-react";

const ApplicationTab = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const subTabs = [
    { id: "summary", label: "Summary", icon: FileText },
    { id: "personal", label: "Personal", icon: User },
    { id: "income", label: "Income", icon: Briefcase },
    { id: "financial", label: "Financial", icon: CreditCard },
    { id: "mortgage", label: "Mortgage", icon: Home },
    { id: "property", label: "Property", icon: Building2 },
    { id: "docs", label: "Docs", icon: FileText },
    { id: "declarations", label: "Declarations", icon: CheckSquare },
    { id: "transactions", label: "Transactions", icon: History },
    { id: "lender", label: "Select Lender", icon: Building2 },
    { id: "notes", label: "Notes", icon: MessageSquare },
    { id: "log", label: "Action Log", icon: History },
    { id: "security", label: "Security", icon: Shield },
    { id: "alternative", label: "Alternative", icon: AlertCircle },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
  ];

  const currentPath = location.pathname;
  const basePath = "/dashboard/broker/application";

  const isActive = (tabId: string) => {
    if (tabId === "summary") {
      return currentPath === basePath || currentPath === `${basePath}/`;
    }
    return currentPath === `${basePath}/${tabId}`;
  };

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">No Application Selected</h2>
              <p className="text-muted-foreground">Select an application to view details</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled>Export PDF</Button>
              <Button disabled>Submit to Lender</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Tab Navigation */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={isActive(tab.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    navigate(tab.id === "summary" ? basePath : `${basePath}/${tab.id}`)
                  }
                  className={cn("gap-2")}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sub-Tab Content */}
      <Routes>
        <Route index element={<SummaryTab />} />
        <Route path="summary" element={<SummaryTab />} />
        <Route path="personal" element={<PersonalTab />} />
        <Route path="income" element={<IncomeTab />} />
        <Route path="financial" element={<FinancialTab />} />
        <Route path="mortgage" element={<MortgageTab />} />
        <Route path="property" element={<PropertyTab />} />
        <Route path="docs" element={<DocsTab />} />
        <Route path="declarations" element={<DeclarationsTab />} />
        <Route path="transactions" element={<TransactionsTab />} />
        <Route path="lender" element={<LenderTab />} />
        <Route path="notes" element={<NotesTab />} />
        <Route path="log" element={<ActionLogTab />} />
        <Route path="security" element={<SecurityTab />} />
        <Route path="alternative" element={<AlternativeTab />} />
        <Route path="tasks" element={<TasksTab />} />
      </Routes>
    </div>
  );
};

// Placeholder components for each sub-tab
const SummaryTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>AI-Generated Summary</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <h3 className="font-semibold mb-2">Client Profile</h3>
        <p className="text-sm text-muted-foreground">
          John Doe, 35, PAYE employee with stable €65,000 annual income. First-time buyer seeking €300,000 mortgage
          for property valued at €350,000. Strong credit history with no adverse events.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-success/10 rounded-lg">
          <h4 className="font-medium text-success mb-1">Strengths</h4>
          <ul className="text-sm space-y-1">
            <li>• Stable employment (5 years)</li>
            <li>• Good credit score</li>
            <li>• 14% deposit available</li>
          </ul>
        </div>
        <div className="p-4 bg-warning/10 rounded-lg">
          <h4 className="font-medium text-warning mb-1">Considerations</h4>
          <ul className="text-sm space-y-1">
            <li>• High monthly commitments</li>
            <li>• Recent large transaction</li>
          </ul>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-1">Recommendations</h4>
          <ul className="text-sm space-y-1">
            <li>• Bank of Ireland (95% match)</li>
            <li>• AIB (92% match)</li>
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PersonalTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Personal Details</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Full Name</p>
          <p className="font-medium">John Patrick Doe</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Date of Birth</p>
          <p className="font-medium">15 March 1989 (35 years)</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">PPS Number</p>
          <p className="font-medium">1234567AB</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Residency Status</p>
          <p className="font-medium">Irish Citizen ✓</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Address</p>
          <p className="font-medium">123 Main Street, Dublin 2, Ireland</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Years at Address</p>
          <p className="font-medium">3 years</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const IncomeTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Income & Employment - AI Parsed</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="p-4 bg-success/10 rounded-lg">
          <h4 className="font-medium text-success mb-2">Verified Income: €65,000/year</h4>
          <p className="text-sm">Source: 6 months payslips • Confidence: 98%</p>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Month</th>
                <th className="p-3 text-right">Gross</th>
                <th className="p-3 text-right">Tax</th>
                <th className="p-3 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {["Nov 2024", "Oct 2024", "Sep 2024", "Aug 2024", "Jul 2024", "Jun 2024"].map((month) => (
                <tr key={month} className="border-t border-border">
                  <td className="p-3">{month}</td>
                  <td className="p-3 text-right">€5,417</td>
                  <td className="p-3 text-right">€1,625</td>
                  <td className="p-3 text-right font-medium">€3,792</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
);

const FinancialTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Financial & Credit Analysis</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border border-border rounded-lg">
          <h4 className="font-medium mb-2">Monthly Commitments</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Rent</span>
              <span className="font-medium">€1,200</span>
            </div>
            <div className="flex justify-between">
              <span>Car Loan</span>
              <span className="font-medium">€350</span>
            </div>
            <div className="flex justify-between">
              <span>Credit Card</span>
              <span className="font-medium">€100</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-bold">
              <span>Total</span>
              <span>€1,650</span>
            </div>
          </div>
        </div>
        <div className="p-4 border border-border rounded-lg">
          <h4 className="font-medium mb-2">Credit Score</h4>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-success">750</div>
            <div className="flex-1">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: "85%" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Excellent</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-warning/10 rounded-lg">
        <h4 className="font-medium text-warning mb-2">AI Detected Risks</h4>
        <ul className="text-sm space-y-1">
          <li>• Large deposit (€5,000) on March 15 - source verification needed</li>
          <li>• High rent-to-income ratio (18.5%)</li>
        </ul>
      </div>
    </CardContent>
  </Card>
);

const MortgageTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Mortgage Details - Auto Calculated</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Property Value</p>
          <p className="text-2xl font-bold">€350,000</p>
        </div>
        <div className="p-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Deposit</p>
          <p className="text-2xl font-bold">€50,000 (14%)</p>
        </div>
        <div className="p-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
          <p className="text-2xl font-bold">€300,000</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border border-border rounded-lg">
          <h4 className="font-medium mb-3">Affordability Ratio</h4>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-success">32%</div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Within safe limits (&lt;35%)</p>
            </div>
          </div>
        </div>
        <div className="p-4 border border-border rounded-lg">
          <h4 className="font-medium mb-3">LTV Ratio</h4>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-success">86%</div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Good for first-time buyer</p>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PropertyTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Property Details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Address</p>
          <p className="font-medium">45 Oak Avenue, Dublin 6W, D6W K2R4</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Property Type</p>
          <p className="font-medium">3-bed semi-detached house</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Purchase Price</p>
          <p className="font-medium">€350,000</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Valuation Status</p>
          <p className="font-medium text-warning">Pending</p>
        </div>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">AI Valuation Range</h4>
        <p className="text-sm text-muted-foreground">
          Based on comparable properties: €340,000 - €360,000
        </p>
      </div>
    </CardContent>
  </Card>
);

const DocsTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Documents & AI Flags</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {[
        { doc: "ID - Passport", status: "verified", flag: null },
        { doc: "Payslips (6 months)", status: "verified", flag: null },
        { doc: "Bank Statements", status: "pending", flag: "Needs clarification" },
        { doc: "Proof of Deposit", status: "verified", flag: null },
      ].map((item) => (
        <div key={item.doc} className="flex items-center justify-between p-3 border border-border rounded-lg">
          <div>
            <p className="font-medium">{item.doc}</p>
            {item.flag && <p className="text-xs text-warning">{item.flag}</p>}
          </div>
          <div className="flex items-center gap-2">
            {item.status === "verified" ? (
              <span className="text-success text-sm">✓ Verified</span>
            ) : (
              <span className="text-warning text-sm">○ Pending</span>
            )}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const DeclarationsTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Declarations & Inconsistencies</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="p-4 bg-success/10 rounded-lg">
        <p className="text-sm font-medium text-success">✓ No adverse credit events declared</p>
      </div>
      <div className="p-4 bg-success/10 rounded-lg">
        <p className="text-sm font-medium text-success">✓ Employment history consistent</p>
      </div>
      <div className="p-4 bg-warning/10 rounded-lg">
        <p className="text-sm font-medium text-warning">⚠ AI detected 2-month gap in 2022 - needs clarification</p>
      </div>
    </CardContent>
  </Card>
);

const TransactionsTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Categorized Transactions - AI Parsed</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {[
              { date: "Dec 1", desc: "Salary Credit", cat: "Income", amount: "+€3,792" },
              { date: "Dec 2", desc: "Rent Payment", cat: "Housing", amount: "-€1,200" },
              { date: "Dec 5", desc: "Tesco Groceries", cat: "Food", amount: "-€85" },
              { date: "Dec 8", desc: "Paddy Power", cat: "Gambling ⚠", amount: "-€50" },
            ].map((tx, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-3">{tx.date}</td>
                <td className="p-3">{tx.desc}</td>
                <td className="p-3">
                  <span className={tx.cat.includes("⚠") ? "text-warning" : ""}>{tx.cat}</span>
                </td>
                <td className={`p-3 text-right font-medium ${tx.amount.startsWith("+") ? "text-success" : ""}`}>
                  {tx.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

const LenderTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Top 3 Lender Matches - AI Recommended</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {[
        { name: "Bank of Ireland", match: 95, rate: "3.1%", notes: "Best for first-time buyers" },
        { name: "AIB", match: 92, rate: "3.3%", notes: "Green mortgage discount available" },
        { name: "Haven", match: 88, rate: "3.5%", notes: "Flexible overpayment options" },
      ].map((lender) => (
        <div key={lender.name} className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-lg">{lender.name}</h4>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{lender.rate}</span>
              <span className="text-success font-medium">{lender.match}% Match</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{lender.notes}</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

const NotesTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Notes & Messages - Unified Thread</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        {[
          { from: "broker", message: "Requested clarification on March deposit", time: "2 hours ago" },
          { from: "ai", message: "Detected gambling transaction - review recommended", time: "1 day ago" },
          { from: "client", message: "Uploaded updated bank statement", time: "2 days ago" },
        ].map((note, i) => (
          <div key={i} className="p-3 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium capitalize">{note.from}</span>
              <span className="text-xs text-muted-foreground">{note.time}</span>
            </div>
            <p className="text-sm">{note.message}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ActionLogTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Action Log - Timeline</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {[
        { action: "AI verified payslips", by: "AI System", time: "1 hour ago" },
        { action: "Broker requested bank clarification", by: "Sarah O'Connor", time: "2 hours ago" },
        { action: "Client uploaded documents", by: "John Doe", time: "1 day ago" },
        { action: "Application created", by: "Sarah O'Connor", time: "3 days ago" },
      ].map((log, i) => (
        <div key={i} className="flex items-start gap-3 p-3 border-l-2 border-primary pl-4">
          <div className="flex-1">
            <p className="text-sm font-medium">{log.action}</p>
            <p className="text-xs text-muted-foreground">
              {log.by} • {log.time}
            </p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const SecurityTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Additional Security</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">No additional security or guarantor required for this application.</p>
    </CardContent>
  </Card>
);

const AlternativeTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Alternative Lending Options</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">
        If primary lenders decline, these alternative options are available:
      </p>
      <div className="p-3 border border-border rounded-lg">
        <h4 className="font-medium">Finance Ireland</h4>
        <p className="text-sm text-muted-foreground">Higher rates but flexible criteria</p>
      </div>
    </CardContent>
  </Card>
);

const TasksTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Tasks & Admin - Compliance Summary</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="p-3 bg-success/10 rounded-lg">
        <p className="text-sm font-medium text-success">✓ AML checks completed</p>
      </div>
      <div className="p-3 bg-success/10 rounded-lg">
        <p className="text-sm font-medium text-success">✓ Data protection acknowledged</p>
      </div>
      <div className="p-3 bg-warning/10 rounded-lg">
        <p className="text-sm font-medium text-warning">○ Final sign-off pending</p>
      </div>
    </CardContent>
  </Card>
);

export default ApplicationTab;
