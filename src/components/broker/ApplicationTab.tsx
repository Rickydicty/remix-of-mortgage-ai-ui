import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Briefcase, CreditCard, Home, FileText, CheckSquare, Building2, MessageSquare, History, Shield, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import DocumentReview from "./DocumentReview";

interface PreEligibilityData {
  applicant_type: string;
  employment_type: string;
  residency_status: string;
  credit_history: string;
  income_1: number;
  income_2: number | null;
  monthly_commitments: number;
  property_value: number;
  deposit_amount: number;
  first_time_buyer: boolean;
  desired_term: number;
  borrowing_capacity_low: number | null;
  borrowing_capacity_high: number | null;
  estimated_monthly_payment: number | null;
  eligibility_score: number | null;
  phone: string | null;
  email: string | null;
}

const ApplicationTab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [application, setApplication] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [preEligibility, setPreEligibility] = useState<PreEligibilityData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get application ID from URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const applicationId = searchParams.get('id');

  useEffect(() => {
    if (applicationId) {
      fetchApplicationData();
    } else {
      setLoading(false);
    }
  }, [applicationId]);

  const fetchApplicationData = async () => {
    if (!applicationId) return;

    try {
      // Fetch application
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;
      setApplication(appData);

      // Fetch client profile and pre-eligibility data
      if (appData?.user_id) {
        const [profileResult, preEligibilityResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', appData.user_id)
            .single(),
          supabase
            .from('pre_eligibility_data')
            .select('*')
            .eq('user_id', appData.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        if (profileResult.error) throw profileResult.error;
        setProfile(profileResult.data);
        
        if (preEligibilityResult.data) {
          setPreEligibility(preEligibilityResult.data);
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'aip_pending':
        return 'bg-success/10 text-success border-success/20';
      case 'pending_review':
      case 'in_review':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'pending':
      case 'draft':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      case 'needs_documents':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

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
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : !applicationId || !application ? (
            <div>
              <h2 className="text-2xl font-bold">No Application Selected</h2>
              <p className="text-muted-foreground">Select an application from the Web tab to view details</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">
                  {profile?.full_name || profile?.email || 'Client'}
                </h2>
                <div className="flex gap-4 text-sm">
                  <p className="text-muted-foreground">
                    Application: <span className="font-semibold">{application.application_number}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Step: <span className="font-semibold">{application.current_step} of 6</span>
                  </p>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Export PDF</Button>
                <Button>Submit to Lender</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Review for pending_review status */}
      {(application?.status === 'pending_review' || application?.status === 'in_review') && (
        <DocumentReview
          clientId={application.user_id}
          clientName={profile?.full_name || profile?.email || 'Client'}
          applicationId={application.id}
          onUpdate={fetchApplicationData}
        />
      )}

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
        <Route index element={<SummaryTab application={application} profile={profile} preEligibility={preEligibility} />} />
        <Route path="summary" element={<SummaryTab application={application} profile={profile} preEligibility={preEligibility} />} />
        <Route path="personal" element={<PersonalTab profile={profile} preEligibility={preEligibility} />} />
        <Route path="income" element={<IncomeTab preEligibility={preEligibility} />} />
        <Route path="financial" element={<FinancialTab preEligibility={preEligibility} />} />
        <Route path="mortgage" element={<MortgageTab preEligibility={preEligibility} />} />
        <Route path="property" element={<PropertyTab preEligibility={preEligibility} />} />
        <Route path="docs" element={<DocsTab applicationId={applicationId} userId={application?.user_id} />} />
        <Route path="declarations" element={<DeclarationsTab preEligibility={preEligibility} />} />
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
// Summary Tab Component
const SummaryTab = ({ application, profile, preEligibility }: { application: any; profile: any; preEligibility: PreEligibilityData | null }) => {
  if (!application) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No application data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'Not provided';
    return `€${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client Name</p>
              <p className="font-semibold">{profile?.full_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{profile?.email || preEligibility?.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold">{profile?.phone || preEligibility?.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Application Number</p>
              <p className="font-semibold">{application.application_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Step</p>
              <p className="font-semibold">Step {application.current_step} of 6</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold">{application.status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Property Value</p>
              <p className="font-semibold">{formatCurrency(preEligibility?.property_value)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loan Amount</p>
              <p className="font-semibold">{formatCurrency(preEligibility ? preEligibility.property_value - preEligibility.deposit_amount : null)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-semibold">{new Date(application.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-semibold">{new Date(application.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Personal Tab Component
const PersonalTab = ({ profile, preEligibility }: { profile: any; preEligibility: PreEligibilityData | null }) => {
  const getResidencyLabel = (status: string | null | undefined) => {
    if (!status) return 'Not provided';
    const labels: Record<string, string> = {
      'irish_citizen': 'Irish Citizen',
      'eu_citizen': 'EU Citizen',
      'non_eu_with_visa': 'Non-EU with Visa',
      'other': 'Other'
    };
    return labels[status] || status;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{profile?.full_name || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{profile?.email || preEligibility?.email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{profile?.phone || preEligibility?.phone || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Applicant Type</p>
            <p className="font-medium capitalize">{preEligibility?.applicant_type?.replace('_', ' ') || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Residency Status</p>
            <p className="font-medium">{getResidencyLabel(preEligibility?.residency_status)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">First Time Buyer</p>
            <p className="font-medium">{preEligibility?.first_time_buyer ? 'Yes' : preEligibility?.first_time_buyer === false ? 'No' : 'Not provided'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const IncomeTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '€0';
    return `€${amount.toLocaleString()}`;
  };

  const getEmploymentLabel = (type: string | null | undefined) => {
    if (!type) return 'Not provided';
    const labels: Record<string, string> = {
      'paye': 'PAYE Employee',
      'self_employed': 'Self Employed',
      'contractor': 'Contractor',
      'public_servant': 'Public Servant'
    };
    return labels[type] || type;
  };

  const totalIncome = (preEligibility?.income_1 || 0) + (preEligibility?.income_2 || 0);
  const monthlyIncome = totalIncome / 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income & Employment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-success/10 rounded-lg">
            <h4 className="font-medium text-success mb-2">Total Annual Income: {formatCurrency(totalIncome)}</h4>
            <p className="text-sm">Monthly: {formatCurrency(monthlyIncome)}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium mb-2">Applicant 1 Income</h4>
              <p className="text-2xl font-bold">{formatCurrency(preEligibility?.income_1)}/year</p>
              <p className="text-sm text-muted-foreground mt-1">
                Employment: {getEmploymentLabel(preEligibility?.employment_type)}
              </p>
            </div>
            {preEligibility?.income_2 && preEligibility.income_2 > 0 && (
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-2">Applicant 2 Income</h4>
                <p className="text-2xl font-bold">{formatCurrency(preEligibility.income_2)}/year</p>
              </div>
            )}
          </div>
          {preEligibility?.borrowing_capacity_low && preEligibility?.borrowing_capacity_high && (
            <div className="p-4 bg-primary/5 rounded-lg">
              <h4 className="font-medium mb-2">Estimated Borrowing Capacity</h4>
              <p className="text-lg">
                {formatCurrency(preEligibility.borrowing_capacity_low)} - {formatCurrency(preEligibility.borrowing_capacity_high)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const FinancialTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '€0';
    return `€${amount.toLocaleString()}`;
  };

  const getCreditLabel = (history: string | null | undefined) => {
    if (!history) return 'Not provided';
    const labels: Record<string, string> = {
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor'
    };
    return labels[history] || history;
  };

  const getCreditColor = (history: string | null | undefined) => {
    switch (history) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-success';
      case 'fair': return 'text-warning';
      case 'poor': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getCreditScore = (history: string | null | undefined) => {
    switch (history) {
      case 'excellent': return { score: 800, width: '95%' };
      case 'good': return { score: 700, width: '80%' };
      case 'fair': return { score: 600, width: '60%' };
      case 'poor': return { score: 500, width: '40%' };
      default: return { score: 0, width: '0%' };
    }
  };

  const creditInfo = getCreditScore(preEligibility?.credit_history);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial & Credit Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-medium mb-2">Monthly Commitments</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between pt-2 border-t border-border font-bold">
                <span>Total Monthly Commitments</span>
                <span>{formatCurrency(preEligibility?.monthly_commitments)}</span>
              </div>
            </div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-medium mb-2">Credit History</h4>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${getCreditColor(preEligibility?.credit_history)}`}>
                {creditInfo.score > 0 ? creditInfo.score : 'N/A'}
              </div>
              <div className="flex-1">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${getCreditColor(preEligibility?.credit_history)} bg-current`} style={{ width: creditInfo.width }} />
                </div>
                <p className={`text-xs mt-1 ${getCreditColor(preEligibility?.credit_history)}`}>
                  {getCreditLabel(preEligibility?.credit_history)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {preEligibility?.eligibility_score && (
          <div className="p-4 bg-primary/5 rounded-lg">
            <h4 className="font-medium mb-2">Eligibility Score</h4>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-primary">{preEligibility.eligibility_score}%</div>
              <div className="flex-1">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${preEligibility.eligibility_score}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MortgageTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '€0';
    return `€${amount.toLocaleString()}`;
  };

  const propertyValue = preEligibility?.property_value || 0;
  const deposit = preEligibility?.deposit_amount || 0;
  const loanAmount = propertyValue - deposit;
  const ltv = propertyValue > 0 ? ((loanAmount / propertyValue) * 100).toFixed(1) : 0;
  const depositPercent = propertyValue > 0 ? ((deposit / propertyValue) * 100).toFixed(1) : 0;

  const totalIncome = (preEligibility?.income_1 || 0) + (preEligibility?.income_2 || 0);
  const monthlyIncome = totalIncome / 12;
  const monthlyRepayment = preEligibility?.estimated_monthly_payment || 0;
  const affordabilityRatio = monthlyIncome > 0 ? ((monthlyRepayment / monthlyIncome) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mortgage Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Property Value</p>
            <p className="text-2xl font-bold">{formatCurrency(propertyValue)}</p>
          </div>
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Deposit</p>
            <p className="text-2xl font-bold">{formatCurrency(deposit)} ({depositPercent}%)</p>
          </div>
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
            <p className="text-2xl font-bold">{formatCurrency(loanAmount)}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-medium mb-3">LTV Ratio</h4>
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold ${Number(ltv) <= 90 ? 'text-success' : 'text-warning'}`}>{ltv}%</div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {preEligibility?.first_time_buyer ? 'First-time buyer' : 'Existing homeowner'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-medium mb-3">Mortgage Term</h4>
            <div className="text-3xl font-bold">{preEligibility?.desired_term || 25} years</div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-medium mb-3">Est. Monthly Payment</h4>
            <div className="text-3xl font-bold text-primary">{formatCurrency(monthlyRepayment)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Affordability: {affordabilityRatio}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PropertyTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '€0';
    return `€${amount.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Purchase Price</p>
            <p className="font-medium">{formatCurrency(preEligibility?.property_value)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Buyer Type</p>
            <p className="font-medium">{preEligibility?.first_time_buyer ? 'First Time Buyer' : 'Existing Homeowner'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deposit Amount</p>
            <p className="font-medium">{formatCurrency(preEligibility?.deposit_amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valuation Status</p>
            <p className="font-medium text-warning">Pending</p>
          </div>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Note</h4>
          <p className="text-sm text-muted-foreground">
            Property address and detailed information will be added once provided by the client.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const DocsTab = ({ applicationId, userId }: { applicationId: string | null; userId: string | null }) => {
  if (!applicationId || !userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No application selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <DocumentReview
      clientId={userId}
      clientName="Client"
      applicationId={applicationId}
      onUpdate={() => {}}
    />
  );
};

const DeclarationsTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => (
  <Card>
    <CardHeader>
      <CardTitle>Declarations & Checks</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className={`p-4 rounded-lg ${preEligibility?.credit_history === 'excellent' || preEligibility?.credit_history === 'good' ? 'bg-success/10' : 'bg-warning/10'}`}>
        <p className={`text-sm font-medium ${preEligibility?.credit_history === 'excellent' || preEligibility?.credit_history === 'good' ? 'text-success' : 'text-warning'}`}>
          {preEligibility?.credit_history === 'excellent' || preEligibility?.credit_history === 'good' 
            ? '✓ Credit history declared as ' + (preEligibility?.credit_history || 'unknown')
            : '⚠ Credit history declared as ' + (preEligibility?.credit_history || 'unknown') + ' - review recommended'}
        </p>
      </div>
      <div className="p-4 bg-success/10 rounded-lg">
        <p className="text-sm font-medium text-success">
          ✓ Residency status: {preEligibility?.residency_status?.replace('_', ' ') || 'Not provided'}
        </p>
      </div>
      <div className="p-4 bg-success/10 rounded-lg">
        <p className="text-sm font-medium text-success">
          ✓ Employment type: {preEligibility?.employment_type?.replace('_', ' ') || 'Not provided'}
        </p>
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
