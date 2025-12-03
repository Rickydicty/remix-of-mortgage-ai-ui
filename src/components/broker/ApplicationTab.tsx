import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;
      setApplication(appData);

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

  // Row 1 tabs
  const row1Tabs = [
    { id: "security", label: "Additional Security" },
    { id: "alternative", label: "Alternative Lending" },
    { id: "declarations", label: "Declarations" },
    { id: "docs", label: "Docs & Conditions" },
    { id: "transactions", label: "Transactions" },
    { id: "lender", label: "Select Lender" },
    { id: "notes", label: "Notes and Messages" },
    { id: "log", label: "Action Log" },
  ];

  // Row 2 tabs (main tabs)
  const row2Tabs = [
    { id: "summary", label: "Summary" },
    { id: "personal", label: "Personal Details" },
    { id: "income", label: "Income & Employment" },
    { id: "financial", label: "Financial & Credit History" },
    { id: "mortgage", label: "Mortgage Details" },
    { id: "property", label: "Property Details" },
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
    <div className="space-y-4">
      {/* Tab Navigation - Two Rows */}
      <Card className="overflow-hidden">
        <div className="border-b border-border">
          {/* Row 1 */}
          <div className="flex flex-wrap bg-muted/30">
            {row1Tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(`${basePath}/${tab.id}${applicationId ? `?id=${applicationId}` : ''}`)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-r border-b border-border transition-colors",
                  isActive(tab.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Row 2 */}
          <div className="flex flex-wrap bg-background">
            {row2Tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id === "summary" ? `${basePath}${applicationId ? `?id=${applicationId}` : ''}` : `${basePath}/${tab.id}${applicationId ? `?id=${applicationId}` : ''}`)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-r border-border transition-colors",
                  isActive(tab.id)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
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

      {/* Tab Content */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">Loading...</div>
          </CardContent>
        </Card>
      ) : !applicationId || !application ? (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold">No Application Selected</h2>
            <p className="text-muted-foreground">Select an application from the Web tab to view details</p>
          </CardContent>
        </Card>
      ) : (
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
        </Routes>
      )}
    </div>
  );
};

// Summary Tab Component
const SummaryTab = ({ application, profile, preEligibility }: { application: any; profile: any; preEligibility: PreEligibilityData | null }) => {
  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB');
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Main Info Grid */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Application ID:</Label>
              <span className="font-medium">{application?.application_number || '[new application]'}</span>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Status:</Label>
              <Select defaultValue={application?.status || 'draft'}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">New Application</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="aip_pending">AIP Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Provider, Product:</Label>
              <span className="text-muted-foreground">[not selected]</span>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">BINS Underwriter:</Label>
              <Input className="w-64" placeholder="" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Projected Completion Date:</Label>
              <Input className="w-40" type="date" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Broker:</Label>
              <span className="font-medium text-primary underline cursor-pointer">Rockcourt Financial Services</span>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Financial Advisor:</Label>
              <span className="font-medium">Kay Condon</span>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Broker Tel No:</Label>
              <Input className="w-40" defaultValue="012091955" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Broker Fax No:</Label>
              <Input className="w-40" defaultValue="00000000" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">BINS Administrator:</Label>
              <Input className="w-64" placeholder="" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Date Paper Application Received:</Label>
              <Input className="w-40" type="date" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Application Submitted Date:</Label>
              <span className="font-medium">{formatDate(application?.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Customers Section */}
        <div>
          <h3 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-2">⊿ Customers</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Title</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Surname</TableHead>
                <TableHead>Home Phone</TableHead>
                <TableHead>Mobile Phone</TableHead>
                <TableHead>Date of Birth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>{profile?.full_name?.split(' ')[0] || ''}</TableCell>
                <TableCell>{profile?.full_name?.split(' ').slice(1).join(' ') || ''}</TableCell>
                <TableCell></TableCell>
                <TableCell>{profile?.phone || preEligibility?.phone || ''}</TableCell>
                <TableCell></TableCell>
              </TableRow>
              {preEligibility?.applicant_type === 'joint' && (
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Properties Section */}
        <div>
          <h3 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-2">⊿ Properties</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>New or Secondhand</TableHead>
                <TableHead>Estimated Closing Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          <Button variant="outline">Print</Button>
          <Button variant="outline">Save</Button>
          <Button variant="outline">Generic Letter</Button>
          <Button variant="outline">Create Application Copy</Button>
        </div>

        {/* Navigation */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Personal Tab Component
const PersonalTab = ({ profile, preEligibility }: { profile: any; preEligibility: PreEligibilityData | null }) => {
  const isJoint = preEligibility?.applicant_type === 'joint';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Applicant 1 */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary text-lg">Applicant 1</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Forenames<span className="text-destructive">*</span></Label>
                <Input className="flex-1" defaultValue={profile?.full_name?.split(' ')[0] || ''} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Surname<span className="text-destructive">*</span></Label>
                <Input className="flex-1" defaultValue={profile?.full_name?.split(' ').slice(1).join(' ') || ''} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Other/Previous Names</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Gender</Label>
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Title</Label>
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mr">Mr</SelectItem>
                    <SelectItem value="mrs">Mrs</SelectItem>
                    <SelectItem value="ms">Ms</SelectItem>
                    <SelectItem value="miss">Miss</SelectItem>
                    <SelectItem value="dr">Dr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Date of Birth (dd/mm/yyyy)</Label>
                <Input className="flex-1" type="date" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Nationality</Label>
                <Input className="flex-1" defaultValue="Irish" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">PPS Number</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Marital Status</Label>
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">No. of Children</Label>
                <Input className="w-20" type="number" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Children's Ages</Label>
                <Input className="flex-1" placeholder="e.g., 5, 8, 12" />
              </div>
            </div>
          </div>

          {/* Applicant 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-primary text-lg">Applicant 2</h3>
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="enabled" checked={isJoint} />
                  <Label htmlFor="enabled" className="text-sm">Enabled</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="guarantor" />
                  <Label htmlFor="guarantor" className="text-sm">Guarantor</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="copyAddress" />
                  <Label htmlFor="copyAddress" className="text-sm">Copy Address</Label>
                </div>
              </div>
            </div>
            <div className={cn("space-y-3", !isJoint && "opacity-50 pointer-events-none")}>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Forenames<span className="text-destructive">*</span></Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Surname<span className="text-destructive">*</span></Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Other/Previous Names</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Gender</Label>
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Title</Label>
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mr">Mr</SelectItem>
                    <SelectItem value="mrs">Mrs</SelectItem>
                    <SelectItem value="ms">Ms</SelectItem>
                    <SelectItem value="miss">Miss</SelectItem>
                    <SelectItem value="dr">Dr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Date of Birth (dd/mm/yyyy)</Label>
                <Input className="flex-1" type="date" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Nationality</Label>
                <Input className="flex-1" defaultValue="Irish" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">PPS Number</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Marital Status</Label>
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">No. of Children</Label>
                <Input className="w-20" type="number" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Children's Ages</Label>
                <Input className="flex-1" placeholder="e.g., 5, 8, 12" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6 border-t mt-6">
          <Button variant="outline">Applicant One & Two</Button>
          <Button variant="outline">Applicant Three & Four</Button>
          <Button variant="outline">Save</Button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Income Tab Component
const IncomeTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => {
  const isJoint = preEligibility?.applicant_type === 'joint';

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-destructive text-center mb-4">Fill in personal details first</p>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Applicant 1 */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary text-lg">Applicant 1</h3>
            <h4 className="font-semibold bg-primary/10 px-3 py-1">⊿ Current Income</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Gross basic wage/salary per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" defaultValue={preEligibility?.income_1 || ''} />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Overtime per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Bonuses per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Commissions per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Other income (non rental) per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Other Income Details</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Lodger income per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Residential investment income per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Label className="w-56 text-sm text-muted-foreground">Other Household Income (spouse income if not applicant)</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
              </div>
            </div>
          </div>

          {/* Applicant 2 */}
          <div className={cn("space-y-4", !isJoint && "opacity-50 pointer-events-none")}>
            <h3 className="font-bold text-primary text-lg">Applicant 2</h3>
            <h4 className="font-semibold bg-primary/10 px-3 py-1">⊿ Current Income</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Gross basic wage/salary per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" defaultValue={preEligibility?.income_2 || ''} />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Overtime per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Bonuses per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Commissions per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Other income (non rental) per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Income frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Other Income Details</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Lodger income per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Residential investment income per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Label className="w-56 text-sm text-muted-foreground">Other Household Income (spouse income if not applicant)</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6 border-t mt-6">
          <Button variant="outline">Applicant One & Two</Button>
          <Button variant="outline">Applicant Three & Four</Button>
          <Button variant="outline">Save</Button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Financial Tab Component
const FinancialTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => {
  const isJoint = preEligibility?.applicant_type === 'joint';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Applicant 1 */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary text-lg">Applicant 1</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Current Bank/Building Society</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">Address Line 1</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">Address Line 2</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">Address Line 3</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">County</Label>
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dublin">Dublin</SelectItem>
                    <SelectItem value="cork">Cork</SelectItem>
                    <SelectItem value="galway">Galway</SelectItem>
                    <SelectItem value="limerick">Limerick</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">Country</Label>
                <Input className="flex-1" defaultValue="Ireland" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Account Type</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Account Number</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Sort Code</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">How long have you held this account</Label>
                <Input className="w-16" type="number" placeholder="" />
                <span className="text-sm text-muted-foreground">years,</span>
                <Input className="w-16" type="number" placeholder="" />
                <span className="text-sm text-muted-foreground">months</span>
              </div>
            </div>
          </div>

          {/* Applicant 2 */}
          <div className={cn("space-y-4", !isJoint && "opacity-50 pointer-events-none")}>
            <h3 className="font-bold text-primary text-lg">Applicant 2</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Current Bank/Building Society</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">Address Line 1</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">Address Line 2</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">Address Line 3</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">County</Label>
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dublin">Dublin</SelectItem>
                    <SelectItem value="cork">Cork</SelectItem>
                    <SelectItem value="galway">Galway</SelectItem>
                    <SelectItem value="limerick">Limerick</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground text-right">Country</Label>
                <Input className="flex-1" defaultValue="Ireland" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Account Type</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Account Number</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Sort Code</Label>
                <Input className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">How long have you held this account</Label>
                <Input className="w-16" type="number" placeholder="" />
                <span className="text-sm text-muted-foreground">years,</span>
                <Input className="w-16" type="number" placeholder="" />
                <span className="text-sm text-muted-foreground">months</span>
              </div>
            </div>
          </div>
        </div>

        {/* Saving Account Information */}
        <div className="mt-6">
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-2">⊿ Saving Account Information</h4>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Applicant</TableHead>
                <TableHead>Financial Institution</TableHead>
                <TableHead>A/C Number</TableHead>
                <TableHead>Date Opened</TableHead>
                <TableHead>Monthly Savings (€)</TableHead>
                <TableHead>Balance (€)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6 border-t mt-6">
          <Button variant="outline">Applicant One & Two</Button>
          <Button variant="outline">Applicant Three & Four</Button>
          <Button variant="outline">Save</Button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Mortgage Tab Component
const MortgageTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-destructive text-center mb-4">Fill all the required fields</p>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Customer Type<span className="text-destructive">*</span></Label>
            <Select>
              <SelectTrigger className="flex-1 bg-yellow-50 border-yellow-300">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ftb">First Time Buyer</SelectItem>
                <SelectItem value="mover">Mover</SelectItem>
                <SelectItem value="remortgage">Remortgage</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Max approval required<span className="text-destructive">*</span></Label>
            <Checkbox />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">First Time Buyer</Label>
              <div className="flex-1">
                <div className="flex items-center gap-8">
                  <span className="w-32">First Applicant</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <input type="radio" name="ftb1" id="ftb1yes" defaultChecked={preEligibility?.first_time_buyer} />
                      <Label htmlFor="ftb1yes">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="radio" name="ftb1" id="ftb1no" defaultChecked={!preEligibility?.first_time_buyer} />
                      <Label htmlFor="ftb1no">No</Label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <span className="w-32">Second Applicant</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <input type="radio" name="ftb2" id="ftb2yes" />
                      <Label htmlFor="ftb2yes">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="radio" name="ftb2" id="ftb2no" />
                      <Label htmlFor="ftb2no">No</Label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <span className="w-32">Third Applicant</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <input type="radio" name="ftb3" id="ftb3yes" />
                      <Label htmlFor="ftb3yes">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="radio" name="ftb3" id="ftb3no" />
                      <Label htmlFor="ftb3no">No</Label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <span className="w-32">Fourth Applicant</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <input type="radio" name="ftb4" id="ftb4yes" />
                      <Label htmlFor="ftb4yes">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="radio" name="ftb4" id="ftb4no" />
                      <Label htmlFor="ftb4no">No</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <Label className="text-muted-foreground">If joint application, is title of property to be in joint names</Label>
          <Checkbox />
        </div>

        <div className="flex items-center gap-4 mt-4">
          <Label className="w-48 text-muted-foreground">Purpose of Loan<span className="text-destructive">*</span></Label>
          <Select>
            <SelectTrigger className="w-64 bg-yellow-50 border-yellow-300">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="remortgage">Remortgage</SelectItem>
              <SelectItem value="equity">Equity Release</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Section One (Purchase Only) */}
        <div className="mt-6">
          <h4 className="font-semibold bg-primary/10 px-3 py-1 mb-4">⊿ Section One (Purchase Only)</h4>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Purchase price/cost of Building</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1 bg-yellow-50 border-yellow-300" type="number" defaultValue={preEligibility?.property_value || ''} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Savings*</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" defaultValue={preEligibility?.deposit_amount || ''} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Site Price (if applicable)</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Grant</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Legal & stamp duty (if applicable)</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Gifts</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6 border-t mt-6">
          <Button variant="outline">Save</Button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Property Tab Component
const PropertyTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">⊿ Property</h4>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground">Purchase Price</Label>
              <Input className="flex-1" type="number" defaultValue={preEligibility?.property_value || ''} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground">Proposed Rent</Label>
              <Input className="flex-1" type="number" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-56 text-muted-foreground">Loan Amount For this Property</Label>
              <Input className="flex-1" type="number" defaultValue={preEligibility ? preEligibility.property_value - preEligibility.deposit_amount : ''} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-56 text-muted-foreground">Will this property be used as security on this loan?</Label>
              <Checkbox />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-56 text-muted-foreground">Security Strength</Label>
              <Select>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strong">Strong</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="weak">Weak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">Address Line 1</Label>
              <Input className="flex-1" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">Address Line 2</Label>
              <Input className="flex-1" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">Address Line 3</Label>
              <Input className="flex-1" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">County</Label>
              <Select>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dublin">Dublin</SelectItem>
                  <SelectItem value="cork">Cork</SelectItem>
                  <SelectItem value="galway">Galway</SelectItem>
                  <SelectItem value="limerick">Limerick</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">Country</Label>
              <Input className="flex-1" defaultValue="Ireland" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-56 text-muted-foreground">Type of Property<span className="text-destructive">*</span></Label>
              <Select>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detached">Detached House</SelectItem>
                  <SelectItem value="semi-detached">Semi-Detached House</SelectItem>
                  <SelectItem value="terraced">Terraced House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="bungalow">Bungalow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-56 text-muted-foreground">Estimated completion/closing date</Label>
              <Input className="flex-1" type="date" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-56 text-muted-foreground">New Property</Label>
              <Checkbox />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-56 text-muted-foreground">Number of floors in block</Label>
              <Input className="w-20" type="number" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-56 text-muted-foreground">Estimated Value</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" defaultValue={preEligibility?.property_value || ''} />
            </div>
          </div>
        </div>

        {/* Number of Rooms */}
        <div className="mt-6">
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">⊿ Number of Rooms</h4>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground">Living rooms</Label>
              <Input className="w-20" type="number" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground">Dining rooms</Label>
              <Input className="w-20" type="number" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground">Bedrooms</Label>
              <Input className="w-20" type="number" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground">Bathrooms</Label>
              <Input className="w-20" type="number" />
            </div>
          </div>
        </div>

        {/* Pagination and Actions */}
        <div className="flex items-center justify-between mt-6 border-t pt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">|&lt;</Button>
            <Button variant="outline" size="sm">&lt;</Button>
            <span className="text-sm">1 of 1</span>
            <Button variant="outline" size="sm">&gt;</Button>
            <Button variant="outline" size="sm">&gt;|</Button>
            <Button variant="outline" size="sm">+</Button>
            <Button variant="outline" size="sm">×</Button>
            <Button variant="outline">Save</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Docs Tab - Docs & Conditions
const DocsTab = ({ applicationId, userId }: { applicationId: string | null; userId: string | null }) => {
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [userId]);

  const fetchDocuments = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setDocuments(data);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10">
              <TableHead>Q No.</TableHead>
              <TableHead>Document Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Request By</TableHead>
              <TableHead>Received Date</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc, i) => (
                <TableRow key={doc.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{doc.filename}</TableCell>
                  <TableCell>{doc.document_type}</TableCell>
                  <TableCell>Applicant 1</TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell>Broker</TableCell>
                  <TableCell>{doc.status === 'approved' ? new Date(doc.updated_at).toLocaleDateString('en-GB') : ''}</TableCell>
                  <TableCell>
                    <Checkbox checked={doc.status === 'approved'} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex justify-between mt-6">
          <Button variant="outline">Add document requirement &gt;&gt;</Button>
          <Button variant="outline">Save received documents and Submit</Button>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Declarations Tab - Comments & Declarations
const DeclarationsTab = ({ preEligibility }: { preEligibility: PreEligibilityData | null }) => (
  <Card>
    <CardContent className="pt-6">
      <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">⊿ Comments & Declarations</h4>
      <div className="space-y-4">
        <div>
          <Label className="text-muted-foreground">Broker Notes (MAX 5000 Characters)</Label>
          <Textarea 
            className="mt-2 min-h-[300px]" 
            placeholder="Enter broker notes here..."
            maxLength={5000}
          />
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-6 border-t mt-6">
        <Button variant="outline">Save</Button>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm">Previous</Button>
        <Button variant="outline" size="sm">Next</Button>
      </div>
    </CardContent>
  </Card>
);

// Transactions Tab - Transaction History
const TransactionsTab = () => (
  <Card>
    <CardContent className="pt-6">
      <h4 className="font-semibold mb-4">Transaction History</h4>
      <div className="min-h-[200px] border border-border rounded-lg p-4">
        {/* Transaction history content area */}
      </div>

      <h4 className="font-semibold mt-6 mb-4">Broker Position</h4>
      <div className="min-h-[200px] border border-border rounded-lg p-4">
        {/* Broker position content area */}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm">Previous</Button>
        <Button variant="outline" size="sm">Next</Button>
      </div>
    </CardContent>
  </Card>
);

// Lender Tab - Select Lender
const LenderTab = () => {
  const lenders = [
    { id: 'haven', name: 'Haven' },
    { id: 'ics', name: 'ICS (Dilosk)' },
    { id: 'pepper', name: 'Pepper HomeLoans' },
    { id: 'ptsb', name: 'Permanent TSB' },
    { id: 'boi', name: 'Bank of Ireland' },
    { id: 'aib', name: 'AIB' },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-destructive text-center mb-4">
          Application not complete (Personal Details, Income & Employment, Property Details, Mortgage Details)
        </p>

        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10">
              <TableHead className="w-12">
                <div className="flex items-center gap-2">
                  <Checkbox />
                  <span>(All)</span>
                </div>
              </TableHead>
              <TableHead>Provider Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lenders.map((lender) => (
              <TableRow key={lender.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>{lender.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="text-sm text-muted-foreground mt-4">
          * Denotes that some fields must be changed before submitting the application to" the Lender.
        </p>

        <div className="mt-6">
          <Button variant="outline">Submit to PIBA</Button>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Notes Tab - Notes and Messages
const NotesTab = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex gap-4">
        <Textarea 
          className="flex-1 min-h-[150px]" 
          placeholder="Enter note..."
        />
        <div className="space-y-3">
          <Select defaultValue="other">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="followup">Follow Up</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Add note</Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <Checkbox id="broker" />
          <Label htmlFor="broker">Broker</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="bins" defaultChecked />
          <Label htmlFor="bins">BINS</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="lender" />
          <Label htmlFor="lender">Lender</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm">Previous</Button>
        <Button variant="outline" size="sm">Next</Button>
      </div>
    </CardContent>
  </Card>
);

// Action Log Tab
const ActionLogTab = () => (
  <Card>
    <CardContent className="pt-6">
      <p className="text-muted-foreground">No Action Log records found</p>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm">Previous</Button>
        <Button variant="outline" size="sm">Next</Button>
      </div>
    </CardContent>
  </Card>
);

// Security Tab - Additional Security (Properties as security)
const SecurityTab = () => (
  <Card>
    <CardContent className="pt-6">
      <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">⊿ Properties as security</h4>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label className="w-48 text-muted-foreground">Lending Institution<span className="text-destructive">*</span></Label>
          <Select>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boi">Bank of Ireland</SelectItem>
              <SelectItem value="aib">AIB</SelectItem>
              <SelectItem value="ptsb">Permanent TSB</SelectItem>
              <SelectItem value="haven">Haven</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-48 text-muted-foreground">Market Value<span className="text-destructive">*</span></Label>
          <span className="text-muted-foreground">€</span>
          <Input className="flex-1" type="number" defaultValue="0" />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-48 text-muted-foreground">Current Loan Balance</Label>
          <span className="text-muted-foreground">€</span>
          <Input className="flex-1" type="number" defaultValue="0" />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-48 text-muted-foreground">Current Monthly Repayment</Label>
          <span className="text-muted-foreground">€</span>
          <Input className="flex-1" type="number" defaultValue="0" />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">Address Line 1</Label>
              <Input className="flex-1" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">Address Line 2</Label>
              <Input className="flex-1" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">Address Line 3</Label>
              <Input className="flex-1" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">County</Label>
              <Select>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dublin">Dublin</SelectItem>
                  <SelectItem value="cork">Cork</SelectItem>
                  <SelectItem value="galway">Galway</SelectItem>
                  <SelectItem value="limerick">Limerick</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-muted-foreground text-right">Country</Label>
              <Input className="flex-1" defaultValue="Ireland" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <Label className="w-48 text-muted-foreground">Type Of Security<span className="text-destructive">*</span></Label>
          <Select>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential Property</SelectItem>
              <SelectItem value="commercial">Commercial Property</SelectItem>
              <SelectItem value="land">Land</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button variant="outline" size="sm">|&lt;</Button>
        <Button variant="outline" size="sm">&lt;</Button>
        <span className="text-sm">0 of 0</span>
        <Button variant="outline" size="sm">&gt;</Button>
        <Button variant="outline" size="sm">&gt;|</Button>
        <Button variant="outline" size="sm">+</Button>
        <Button variant="outline" size="sm">×</Button>
      </div>

      <div className="flex justify-center gap-4 pt-6 border-t mt-6">
        <Button variant="outline">Save</Button>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm">Previous</Button>
        <Button variant="outline" size="sm">Next</Button>
      </div>
    </CardContent>
  </Card>
);

// Alternative Tab - Alternative Lending
const AlternativeTab = () => (
  <Card>
    <CardContent className="pt-6">
      <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">⊿ Please Complete this section if Alternative Lending is sought</h4>
      
      <div className="space-y-6">
        {/* Question 1 */}
        <div className="flex items-start gap-4">
          <Label className="w-72 text-muted-foreground">Have you had a mortgage on any other property other than previously detailed?</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <input type="radio" name="otherMortgage" id="otherMortgageYes" />
              <Label htmlFor="otherMortgageYes">Yes</Label>
            </div>
            <div className="flex items-center gap-1">
              <input type="radio" name="otherMortgage" id="otherMortgageNo" defaultChecked />
              <Label htmlFor="otherMortgageNo">No</Label>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Label className="w-72 text-muted-foreground">If yes, please give Details</Label>
          <Textarea className="flex-1 min-h-[80px]" />
        </div>

        {/* Question 2 */}
        <div className="flex items-start gap-4">
          <Label className="w-72 text-muted-foreground">Have there ever been any missed Repayments or revoked Credit Cards or Judgements?</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <input type="radio" name="missedRepayments" id="missedRepaymentsYes" />
              <Label htmlFor="missedRepaymentsYes">Yes</Label>
            </div>
            <div className="flex items-center gap-1">
              <input type="radio" name="missedRepayments" id="missedRepaymentsNo" defaultChecked />
              <Label htmlFor="missedRepaymentsNo">No</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground">If yes, please specify by completing the following:</p>
          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-4">
              <span className="w-8">1.</span>
              <Label className="w-80 text-muted-foreground">Current Mortgage - Highest Number of Installment Arrears in last 12 months</Label>
              <Input className="w-20" type="number" defaultValue="0" />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-8">2.</span>
              <Label className="w-80 text-muted-foreground">Current Mortgage - Highest Number of Installment Arrears in last 6 months</Label>
              <Input className="w-20" type="number" defaultValue="0" />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-8">3.</span>
              <Label className="w-80 text-muted-foreground">Other Facilities - Highest Number of Other Arrears in last 12 months</Label>
              <Input className="w-20" type="number" defaultValue="0" />
            </div>
          </div>
        </div>

        {/* Question 3 */}
        <div className="flex items-start gap-4">
          <Label className="w-72 text-muted-foreground">Have any judgement proceedings relating to debt ever been brought against you or any Judgments made against you?</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <input type="radio" name="judgements" id="judgementsYes" />
              <Label htmlFor="judgementsYes">Yes</Label>
            </div>
            <div className="flex items-center gap-1">
              <input type="radio" name="judgements" id="judgementsNo" defaultChecked />
              <Label htmlFor="judgementsNo">No</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground">If yes, please specify by completing the following:</p>
          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-4">
              <span className="w-8">1.</span>
              <Label className="w-80 text-muted-foreground">Judgments - Total Value Judgments Outstanding in last 24 months</Label>
              <Input className="w-20" type="number" defaultValue="0" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-6 border-t mt-6">
        <Button variant="outline">Save</Button>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm">Previous</Button>
        <Button variant="outline" size="sm">Next</Button>
      </div>
    </CardContent>
  </Card>
);

export default ApplicationTab;
