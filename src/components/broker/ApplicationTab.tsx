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
import { PropertyValuationReview } from "./PropertyValuationReview";
import CoverLetterView from "./CoverLetterView";

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
  const [formData, setFormData] = useState<any>(null);
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
        const [profileResult, preEligibilityResult, formDataResult] = await Promise.all([
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
            .maybeSingle(),
          supabase
            .from('application_form_data')
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

        if (formDataResult.data) {
          setFormData(formDataResult.data);
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
    { id: "aip-portal", label: "AIP Portal", highlight: true },
    { id: "valuation", label: "Property Valuation" },
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
                onClick={() => {
                  if (tab.id === 'aip-portal' && applicationId) {
                    navigate(`/dashboard/broker/aip/${applicationId}`);
                  } else {
                    navigate(`${basePath}/${tab.id}${applicationId ? `?id=${applicationId}` : ''}`);
                  }
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-r border-b border-border transition-colors",
                  tab.id === 'aip-portal'
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : isActive(tab.id)
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
          <Route index element={<SummaryTab application={application} profile={profile} preEligibility={preEligibility} formData={formData} />} />
          <Route path="summary" element={<SummaryTab application={application} profile={profile} preEligibility={preEligibility} formData={formData} />} />
          <Route path="personal" element={<PersonalTab profile={profile} preEligibility={preEligibility} formData={formData} />} />
          <Route path="income" element={<IncomeTab preEligibility={preEligibility} formData={formData} />} />
          <Route path="financial" element={<FinancialTab preEligibility={preEligibility} formData={formData} />} />
          <Route path="mortgage" element={<MortgageTab preEligibility={preEligibility} formData={formData} />} />
          <Route path="property" element={<PropertyTab preEligibility={preEligibility} formData={formData} />} />
          <Route path="valuation" element={<PropertyValuationReview applicationId={applicationId || ''} propertyAddress={formData?.property_address} />} />
          <Route path="docs" element={<DocsTab applicationId={applicationId} userId={application?.user_id} />} />
          <Route path="declarations" element={<DeclarationsTab preEligibility={preEligibility} formData={formData} />} />
          <Route path="transactions" element={<TransactionsTab />} />
          <Route path="lender" element={<LenderTab />} />
          <Route path="notes" element={<NotesTab />} />
          <Route path="log" element={<ActionLogTab />} />
          <Route path="security" element={<SecurityTab formData={formData} />} />
          <Route path="alternative" element={<AlternativeTab formData={formData} />} />
        </Routes>
      )}
    </div>
  );
};

// AI Pre-Screen Summary Component
const AIPreScreenSummary = ({ preEligibility, formData }: { preEligibility: PreEligibilityData | null; formData: any }) => {
  // Calculate missing information
  const getMissingInfo = () => {
    const missing: string[] = [];
    
    // Check personal details
    if (!formData?.app1_forenames) missing.push('Applicant Name');
    if (!formData?.app1_date_of_birth) missing.push('Date of Birth');
    if (!formData?.app1_pps_number) missing.push('PPS Number');
    if (!formData?.app1_address) missing.push('Current Address');
    if (!formData?.app1_phone && !preEligibility?.phone) missing.push('Phone Number');
    if (!formData?.app1_email && !preEligibility?.email) missing.push('Email');
    
    // Check income details
    if (!formData?.app1_gross_salary && !preEligibility?.income_1) missing.push('Gross Salary');
    
    // Check property details
    if (!formData?.property_address) missing.push('Property Address');
    if (!formData?.property_type) missing.push('Property Type');
    
    // Check mortgage details
    if (!formData?.loan_amount && !preEligibility?.property_value) missing.push('Loan Amount');
    if (!formData?.mortgage_term && !preEligibility?.desired_term) missing.push('Mortgage Term');
    
    return missing;
  };

  const missingInfo = getMissingInfo();
  const eligibilityScore = preEligibility?.eligibility_score || 0;
  const borrowingLow = preEligibility?.borrowing_capacity_low || 0;
  const borrowingHigh = preEligibility?.borrowing_capacity_high || 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/10';
    if (score >= 60) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  return (
    <div>
      <h3 className="font-semibold text-secondary bg-secondary/10 px-3 py-1 mb-2 flex items-center gap-2">
        <span>🤖</span> AI Pre-Screen Summary
      </h3>
      <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
        {/* Borrowing Potential */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm font-medium">Borrowing Potential</Label>
          {borrowingLow > 0 || borrowingHigh > 0 ? (
            <div className="text-xl font-bold text-primary">
              €{borrowingLow.toLocaleString()} - €{borrowingHigh.toLocaleString()}
            </div>
          ) : (
            <div className="text-muted-foreground italic">Not yet calculated</div>
          )}
          {preEligibility?.estimated_monthly_payment && (
            <div className="text-sm text-muted-foreground">
              Est. Monthly: €{preEligibility.estimated_monthly_payment.toLocaleString()}
            </div>
          )}
        </div>

        {/* Eligibility Score */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm font-medium">Eligibility Score</Label>
          {eligibilityScore > 0 ? (
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xl font-bold",
              getScoreBgColor(eligibilityScore),
              getScoreColor(eligibilityScore)
            )}>
              {eligibilityScore}%
            </div>
          ) : (
            <div className="text-muted-foreground italic">Not yet calculated</div>
          )}
          {eligibilityScore >= 80 && <div className="text-sm text-success">High approval likelihood</div>}
          {eligibilityScore >= 60 && eligibilityScore < 80 && <div className="text-sm text-warning">Moderate approval likelihood</div>}
          {eligibilityScore > 0 && eligibilityScore < 60 && <div className="text-sm text-destructive">Review recommended</div>}
        </div>

        {/* Missing Info */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm font-medium">Missing Information</Label>
          {missingInfo.length === 0 ? (
            <div className="text-success font-medium flex items-center gap-1">
              <span>✓</span> All required info provided
            </div>
          ) : (
            <div className="space-y-1">
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                {missingInfo.length} item{missingInfo.length > 1 ? 's' : ''} missing
              </Badge>
              <ul className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
                {missingInfo.slice(0, 4).map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <span className="text-warning">•</span> {item}
                  </li>
                ))}
                {missingInfo.length > 4 && (
                  <li className="text-warning text-xs">+{missingInfo.length - 4} more...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Summary Tab Component
const SummaryTab = ({ application, profile, preEligibility, formData }: { application: any; profile: any; preEligibility: PreEligibilityData | null; formData: any }) => {
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
                <TableHead></TableHead>
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
                <TableCell className="font-medium">Applicant 1</TableCell>
                <TableCell>{formData?.app1_title || ''}</TableCell>
                <TableCell>{formData?.app1_forenames || profile?.full_name?.split(' ')[0] || ''}</TableCell>
                <TableCell>{formData?.app1_surname || profile?.full_name?.split(' ').slice(1).join(' ') || ''}</TableCell>
                <TableCell>{formData?.app1_home_phone || ''}</TableCell>
                <TableCell>{formData?.app1_phone || profile?.phone || preEligibility?.phone || ''}</TableCell>
                <TableCell>{formData?.app1_date_of_birth || ''}</TableCell>
              </TableRow>
              {(formData?.app2_enabled || preEligibility?.applicant_type === 'joint') && (
                <TableRow>
                  <TableCell className="font-medium">
                    Applicant 2
                    {formData?.app2_is_guarantor && <Badge variant="outline" className="ml-2 text-xs">Guarantor</Badge>}
                  </TableCell>
                  <TableCell>{formData?.app2_title || ''}</TableCell>
                  <TableCell>{formData?.app2_forenames || ''}</TableCell>
                  <TableCell>{formData?.app2_surname || ''}</TableCell>
                  <TableCell>{formData?.app2_home_phone || ''}</TableCell>
                  <TableCell>{formData?.app2_phone || ''}</TableCell>
                  <TableCell>{formData?.app2_date_of_birth || ''}</TableCell>
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
                <TableCell>{formData?.property_address || ''}</TableCell>
                <TableCell>{formData?.property_type || ''}</TableCell>
                <TableCell>{formData?.property_new_or_secondhand || ''}</TableCell>
                <TableCell>{formData?.estimated_closing_date ? new Date(formData.estimated_closing_date).toLocaleDateString('en-GB') : ''}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* AI Pre-Screen Summary */}
        <AIPreScreenSummary preEligibility={preEligibility} formData={formData} />

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
const PersonalTab = ({ profile, preEligibility, formData }: { profile: any; preEligibility: PreEligibilityData | null; formData: any }) => {
  const isJoint = formData?.app2_enabled || preEligibility?.applicant_type === 'joint';

  const ApplicantSection = ({ prefix, title }: { prefix: 'app1' | 'app2'; title: string }) => (
    <div className="space-y-4">
      <h3 className="font-bold text-primary text-lg">{title}</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Title</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_title`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Forenames<span className="text-destructive">*</span></Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_forenames`] || (prefix === 'app1' ? profile?.full_name?.split(' ')[0] : '')} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Surname<span className="text-destructive">*</span></Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_surname`] || (prefix === 'app1' ? profile?.full_name?.split(' ').slice(1).join(' ') : '')} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Other/Previous Names</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_other_names`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Gender</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_gender`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Date of Birth</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_date_of_birth`] || ''} readOnly />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Nationality</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_nationality`] || 'Irish'} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">PPS Number</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_pps_number`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Marital Status</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_marital_status`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">No. of Children</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_no_of_children`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Children's Ages</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_children_ages`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Phone</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_phone`] || (prefix === 'app1' ? profile?.phone : '')} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Email</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_email`] || (prefix === 'app1' ? profile?.email : '')} readOnly />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <h4 className="font-semibold bg-primary/10 px-3 py-1 mt-4">Current Address</h4>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Address Line 1</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_address_line1`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Address Line 2</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_address_line2`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Address Line 3</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_address_line3`] || ''} readOnly />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">County</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_county`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Country</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_country`] || 'Ireland'} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Years at Address</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_years_at_address`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-muted-foreground">Residence Status</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_residence_status`] || ''} readOnly />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-6 space-y-8">
        <ApplicantSection prefix="app1" title="Applicant 1 - Personal Details" />
        
        {isJoint && (
          <>
            <div className="border-t pt-6" />
            <ApplicantSection prefix="app2" title="Applicant 2 - Personal Details" />
            {formData?.app2_is_guarantor && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Guarantor</Badge>
            )}
          </>
        )}

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

// Income Tab Component
const IncomeTab = ({ preEligibility, formData }: { preEligibility: PreEligibilityData | null; formData: any }) => {
  const isJoint = formData?.app2_enabled || preEligibility?.applicant_type === 'joint';

  const IncomeSection = ({ prefix, title, defaultIncome }: { prefix: 'app1' | 'app2'; title: string; defaultIncome?: number }) => (
    <div className="space-y-4">
      <h3 className="font-bold text-primary text-lg">{title}</h3>
      
      {/* Employment Details */}
      <h4 className="font-semibold bg-primary/10 px-3 py-1">Employment Details</h4>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Employment Status</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_employment_status`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Occupation</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_occupation`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Employer Name</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_employer_name`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Employer Address</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_employer_address`] || ''} readOnly />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Years with Employer</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_years_with_employer`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Employment Type</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_employment_type`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Nature of Business</Label>
            <Input className="flex-1" defaultValue={formData?.[`${prefix}_nature_of_business`] || ''} readOnly />
          </div>
        </div>
      </div>

      {/* Income Details */}
      <h4 className="font-semibold bg-primary/10 px-3 py-1">Current Income</h4>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="w-56 text-sm text-muted-foreground">Gross basic salary per annum</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="w-28" type="number" defaultValue={formData?.[`${prefix}_gross_salary`] || defaultIncome || ''} readOnly />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-56 text-sm text-muted-foreground">Overtime per annum</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="w-28" type="number" defaultValue={formData?.[`${prefix}_overtime`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-56 text-sm text-muted-foreground">Bonuses per annum</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="w-28" type="number" defaultValue={formData?.[`${prefix}_bonuses`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-56 text-sm text-muted-foreground">Commissions per annum</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="w-28" type="number" defaultValue={formData?.[`${prefix}_commissions`] || ''} readOnly />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="w-56 text-sm text-muted-foreground">Other income</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="w-28" type="number" defaultValue={formData?.[`${prefix}_other_income`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-56 text-sm text-muted-foreground">Lodger income per annum</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="w-28" type="number" defaultValue={formData?.[`${prefix}_lodger_income`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-56 text-sm text-muted-foreground">Residential investment income</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="w-28" type="number" defaultValue={formData?.[`${prefix}_residential_investment_income`] || ''} readOnly />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-56 text-sm text-muted-foreground">Net Monthly Income</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="w-28" type="number" defaultValue={formData?.[`${prefix}_net_monthly_income`] || ''} readOnly />
          </div>
        </div>
      </div>

      {/* Self-Employed Section if applicable */}
      {formData?.[`${prefix}_employment_status`] === 'self_employed' && (
        <>
          <h4 className="font-semibold bg-primary/10 px-3 py-1">Self-Employment Details</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Company Name</Label>
                <Input className="flex-1" defaultValue={formData?.[`${prefix}_se_company_name`] || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Years Established</Label>
                <Input className="flex-1" defaultValue={formData?.[`${prefix}_se_years_established`] || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Average Profit</Label>
                <Input className="flex-1" defaultValue={formData?.[`${prefix}_se_average_profit`] || ''} readOnly />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Shareholding %</Label>
                <Input className="flex-1" defaultValue={formData?.[`${prefix}_se_shareholding_percent`] || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Accountant Name</Label>
                <Input className="flex-1" defaultValue={formData?.[`${prefix}_se_accountant_name`] || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Accountant Firm</Label>
                <Input className="flex-1" defaultValue={formData?.[`${prefix}_se_accountant_firm`] || ''} readOnly />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-6 space-y-8">
        <IncomeSection prefix="app1" title="Applicant 1 - Income & Employment" defaultIncome={preEligibility?.income_1} />
        
        {isJoint && (
          <>
            <div className="border-t pt-6" />
            <IncomeSection prefix="app2" title="Applicant 2 - Income & Employment" defaultIncome={preEligibility?.income_2 || undefined} />
          </>
        )}

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

// Financial Tab Component
const FinancialTab = ({ preEligibility, formData }: { preEligibility: PreEligibilityData | null; formData: any }) => {
  const isJoint = formData?.app2_enabled || preEligibility?.applicant_type === 'joint';

  const CreditHistorySection = ({ prefix, title }: { prefix: 'app1' | 'app2'; title: string }) => (
    <div className="space-y-3">
      <h5 className="font-medium text-sm">{title}</h5>
      <div className="grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Checkbox checked={formData?.[`${prefix}_refused_mortgage`] || false} disabled />
          <span>Refused mortgage: {formData?.[`${prefix}_refused_mortgage`] ? 'Yes' : 'No'}</span>
        </div>
        {formData?.[`${prefix}_refused_mortgage`] && formData?.[`${prefix}_refused_mortgage_details`] && (
          <p className="ml-6 text-muted-foreground">{formData[`${prefix}_refused_mortgage_details`]}</p>
        )}
        <div className="flex items-center gap-2">
          <Checkbox checked={formData?.[`${prefix}_court_order`] || false} disabled />
          <span>Court order: {formData?.[`${prefix}_court_order`] ? 'Yes' : 'No'}</span>
        </div>
        {formData?.[`${prefix}_court_order`] && formData?.[`${prefix}_court_order_details`] && (
          <p className="ml-6 text-muted-foreground">{formData[`${prefix}_court_order_details`]}</p>
        )}
        <div className="flex items-center gap-2">
          <Checkbox checked={formData?.[`${prefix}_bankruptcy`] || false} disabled />
          <span>Bankruptcy/Insolvency: {formData?.[`${prefix}_bankruptcy`] ? 'Yes' : 'No'}</span>
        </div>
        {formData?.[`${prefix}_bankruptcy`] && formData?.[`${prefix}_bankruptcy_details`] && (
          <p className="ml-6 text-muted-foreground">{formData[`${prefix}_bankruptcy_details`]}</p>
        )}
        <div className="flex items-center gap-2">
          <Checkbox checked={formData?.[`${prefix}_mortgage_arrears_24m`] || false} disabled />
          <span>Mortgage arrears (24m): {formData?.[`${prefix}_mortgage_arrears_24m`] ? 'Yes' : 'No'}</span>
        </div>
        {formData?.[`${prefix}_mortgage_arrears_24m`] && formData?.[`${prefix}_mortgage_arrears_details`] && (
          <p className="ml-6 text-muted-foreground">{formData[`${prefix}_mortgage_arrears_details`]}</p>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="font-bold text-primary text-lg">Bank Details</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Bank Name</Label>
                <Input className="flex-1" defaultValue={formData?.bank_name || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Bank Address</Label>
                <Input className="flex-1" defaultValue={formData?.bank_address || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Account Type</Label>
                <Input className="flex-1" defaultValue={formData?.bank_account_type || ''} readOnly />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Account Number</Label>
                <Input className="flex-1" defaultValue={formData?.bank_account_number || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Sort Code / IBAN</Label>
                <Input className="flex-1" defaultValue={formData?.bank_sort_code || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Years Held</Label>
                <Input className="flex-1" defaultValue={formData?.bank_years_held || ''} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Commitments */}
        <div className="mt-6">
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">Financial Commitments</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Monthly Commitments</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" defaultValue={formData?.monthly_commitments || preEligibility?.monthly_commitments || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Existing Loans</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" defaultValue={formData?.existing_loans || ''} readOnly />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Credit Cards</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" defaultValue={formData?.credit_cards || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Savings</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" defaultValue={formData?.savings || ''} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* Credit History */}
        <div className="mt-6">
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">Credit History</h4>
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Credit History Rating</Label>
              <Input className="w-32" defaultValue={formData?.credit_history || preEligibility?.credit_history || ''} readOnly />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <CreditHistorySection prefix="app1" title="Applicant 1" />
            {isJoint && <CreditHistorySection prefix="app2" title="Applicant 2" />}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={formData?.has_ccj || false} disabled />
              <span>CCJs/Defaults: {formData?.has_ccj ? 'Yes' : 'No'}</span>
            </div>
            {formData?.has_ccj && formData?.ccj_details && (
              <p className="ml-6 text-sm text-muted-foreground">{formData.ccj_details}</p>
            )}
            <div className="flex items-center gap-2">
              <Checkbox checked={formData?.has_arrears || false} disabled />
              <span>Arrears on existing loans: {formData?.has_arrears ? 'Yes' : 'No'}</span>
            </div>
            {formData?.has_arrears && formData?.arrears_details && (
              <p className="ml-6 text-sm text-muted-foreground">{formData.arrears_details}</p>
            )}
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

// Mortgage Tab Component
const MortgageTab = ({ preEligibility, formData }: { preEligibility: PreEligibilityData | null; formData: any }) => {
  const loanAmount = formData?.loan_amount || (preEligibility ? preEligibility.property_value - preEligibility.deposit_amount : 0);
  const propertyValue = formData?.property_value || preEligibility?.property_value || 0;
  const ltv = propertyValue > 0 ? ((loanAmount / propertyValue) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Customer Type */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">Customer Type</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Mortgage Purpose</Label>
              <Input className="flex-1" defaultValue={formData?.mortgage_purpose || ''} readOnly />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData?.first_time_buyer || preEligibility?.first_time_buyer || false} disabled />
              <span>First Time Buyer</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData?.max_approval_required || false} disabled />
              <span>Max Approval Required</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox checked={formData?.joint_title !== false} disabled />
              <span>Joint Title</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData?.help_to_buy || false} disabled />
              <span>Help to Buy Scheme</span>
            </div>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="mt-6">
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">Purchase Details</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Property Value</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" defaultValue={propertyValue?.toLocaleString() || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Deposit Amount</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" defaultValue={formData?.deposit_amount || preEligibility?.deposit_amount || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Loan Amount</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" defaultValue={loanAmount?.toLocaleString() || ''} readOnly />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Savings</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" defaultValue={formData?.savings || ''} readOnly />
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">LTV Ratio:</span>
                  <span className="font-semibold">{ltv}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mortgage Terms */}
        <div className="mt-6">
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">Mortgage Terms</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Mortgage Term (Years)</Label>
                <Input className="w-24" defaultValue={formData?.mortgage_term || preEligibility?.desired_term || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Repayment Method</Label>
                <Input className="flex-1" defaultValue={formData?.repayment_method || ''} readOnly />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Rate Type</Label>
                <Input className="flex-1" defaultValue={formData?.rate_type || ''} readOnly />
              </div>
              {formData?.rate_type === 'fixed' && (
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-muted-foreground">Fixed for (Years)</Label>
                  <Input className="w-24" defaultValue={formData?.fixed_rate_years || ''} readOnly />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Solicitor Details */}
        <div className="mt-6">
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">Solicitor Details</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Solicitor Name</Label>
                <Input className="flex-1" defaultValue={formData?.solicitor_name || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Address</Label>
                <Input className="flex-1" defaultValue={formData?.solicitor_address || ''} readOnly />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Phone</Label>
                <Input className="flex-1" defaultValue={formData?.solicitor_phone || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Email</Label>
                <Input className="flex-1" defaultValue={formData?.solicitor_email || ''} readOnly />
              </div>
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
const PropertyTab = ({ preEligibility, formData }: { preEligibility: PreEligibilityData | null; formData: any }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">Property Details</h4>
        
        {/* Property Values */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Property Type</Label>
              <Input className="flex-1" defaultValue={formData?.property_type || ''} readOnly />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">New or Secondhand</Label>
              <Input className="flex-1" defaultValue={formData?.property_new_or_secondhand || ''} readOnly />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Construction Type</Label>
              <Input className="flex-1" defaultValue={formData?.property_construction_type || ''} readOnly />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">BER Rating</Label>
              <Input className="flex-1" defaultValue={formData?.ber_rating || ''} readOnly />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Estimated Value</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" defaultValue={formData?.property_estimated_value || formData?.property_value || preEligibility?.property_value || ''} readOnly />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Year Built</Label>
              <Input className="flex-1" defaultValue={formData?.year_built || ''} readOnly />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Tenure</Label>
              <Input className="flex-1" defaultValue={formData?.property_tenure || ''} readOnly />
            </div>
            {formData?.property_tenure === 'leasehold' && (
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Lease Years Remaining</Label>
                <Input className="flex-1" defaultValue={formData?.property_lease_years || ''} readOnly />
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="mt-6">
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">Property Address</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Address Line 1</Label>
                <Input className="flex-1" defaultValue={formData?.property_address_line1 || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Address Line 2</Label>
                <Input className="flex-1" defaultValue={formData?.property_address_line2 || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Address Line 3</Label>
                <Input className="flex-1" defaultValue={formData?.property_address_line3 || ''} readOnly />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">County</Label>
                <Input className="flex-1" defaultValue={formData?.property_county || ''} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Country</Label>
                <Input className="flex-1" defaultValue={formData?.property_country || 'Ireland'} readOnly />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Closing Date</Label>
                <Input className="flex-1" defaultValue={formData?.estimated_closing_date || ''} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* Number of Rooms */}
        <div className="mt-6">
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1 mb-4">Number of Rooms</h4>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Living Rooms:</Label>
              <span className="font-medium">{formData?.property_num_living_rooms || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Dining Rooms:</Label>
              <span className="font-medium">{formData?.property_num_dining_rooms || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Bedrooms:</Label>
              <span className="font-medium">{formData?.property_num_bedrooms || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Bathrooms:</Label>
              <span className="font-medium">{formData?.property_num_bathrooms || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Kitchens:</Label>
              <span className="font-medium">{formData?.property_num_kitchens || 0}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Checkbox checked={formData?.property_vacant_possession || false} disabled />
            <span>Vacant Possession</span>
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
    <div className="space-y-6">
      {/* Cover Letter Section */}
      {userId && <CoverLetterView userId={userId} />}

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
    </div>
  );
};

// Declarations Tab - AI-Enhanced Comments & Declarations
const DeclarationsTab = ({ preEligibility, formData }: { preEligibility: PreEligibilityData | null; formData: any }) => {
  const [brokerNotes, setBrokerNotes] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [inconsistencies, setInconsistencies] = useState<{field: string; issue: string; severity: 'warning' | 'critical'}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI detects inconsistencies from client inputs
  useEffect(() => {
    if (formData || preEligibility) {
      detectInconsistencies();
    }
  }, [formData, preEligibility]);

  const detectInconsistencies = () => {
    const issues: {field: string; issue: string; severity: 'warning' | 'critical'}[] = [];
    
    // Check income vs loan amount ratio
    const income = formData?.app1_gross_salary || preEligibility?.income_1 || 0;
    const loanAmount = formData?.loan_amount || (preEligibility?.property_value ? preEligibility.property_value - (preEligibility?.deposit_amount || 0) : 0);
    if (income > 0 && loanAmount > income * 4) {
      issues.push({ field: 'Loan Amount', issue: `Loan amount (€${loanAmount.toLocaleString()}) exceeds 4x annual income (€${income.toLocaleString()})`, severity: 'critical' });
    }

    // Check deposit vs property value
    const propertyValue = formData?.property_value || preEligibility?.property_value || 0;
    const deposit = formData?.deposit_amount || preEligibility?.deposit_amount || 0;
    if (propertyValue > 0 && deposit > 0) {
      const depositRatio = (deposit / propertyValue) * 100;
      if (depositRatio < 10) {
        issues.push({ field: 'Deposit', issue: `Deposit (${depositRatio.toFixed(1)}%) is below 10% minimum for most lenders`, severity: 'critical' });
      } else if (depositRatio < 15 && !preEligibility?.first_time_buyer) {
        issues.push({ field: 'Deposit', issue: `Non-FTB with ${depositRatio.toFixed(1)}% deposit may face limited options`, severity: 'warning' });
      }
    }

    // Check credit history concerns
    if (formData?.has_ccj || formData?.has_arrears || formData?.has_missed_repayments) {
      issues.push({ field: 'Credit History', issue: 'Adverse credit history detected - may require alternative lender', severity: 'warning' });
    }

    // Check employment type for income verification
    if (preEligibility?.employment_type === 'self_employed' && !formData?.app1_other_income_details) {
      issues.push({ field: 'Income Verification', issue: 'Self-employed applicant - ensure 2 years accounts available', severity: 'warning' });
    }

    // Age verification
    if (formData?.app1_date_of_birth) {
      const age = Math.floor((new Date().getTime() - new Date(formData.app1_date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const term = formData?.mortgage_term || preEligibility?.desired_term || 25;
      if (age + term > 70) {
        issues.push({ field: 'Term/Age', issue: `Applicant age (${age}) + term (${term}) exceeds 70 years`, severity: 'critical' });
      }
    }

    setInconsistencies(issues);
  };

  const generateAISummary = () => {
    setIsAnalyzing(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const suggestions = [];
      
      if (preEligibility?.first_time_buyer) {
        suggestions.push(`First Time Buyer application - eligible for HTB scheme if property value ≤ €500,000.`);
      }
      
      const income = formData?.app1_gross_salary || preEligibility?.income_1 || 0;
      if (income > 0) {
        suggestions.push(`Based on gross income of €${income.toLocaleString()}, maximum borrowing capacity is approximately €${(income * 3.5).toLocaleString()} - €${(income * 4).toLocaleString()}.`);
      }

      if (preEligibility?.credit_history === 'excellent' || preEligibility?.credit_history === 'good') {
        suggestions.push(`Strong credit profile - eligible for prime lender rates.`);
      }

      if (formData?.property_type === 'apartment') {
        suggestions.push(`Apartment purchase - ensure lender accepts apartment type and size meets minimum requirements.`);
      }

      setAiSuggestions(suggestions);
      setIsAnalyzing(false);
    }, 1500);
  };

  // Auto-populate broker notes from client data
  const autoPopulateNotes = () => {
    const notes = [];
    
    notes.push(`=== AI Auto-Generated Summary ===`);
    notes.push(`Generated: ${new Date().toLocaleString('en-GB')}\n`);
    
    notes.push(`APPLICANT PROFILE:`);
    notes.push(`- Name: ${formData?.app1_forenames || ''} ${formData?.app1_surname || ''}`);
    notes.push(`- Employment: ${preEligibility?.employment_type || 'Not specified'}`);
    notes.push(`- Residency: ${preEligibility?.residency_status || 'Not specified'}`);
    notes.push(`- First Time Buyer: ${preEligibility?.first_time_buyer ? 'Yes' : 'No'}\n`);
    
    notes.push(`FINANCIAL OVERVIEW:`);
    notes.push(`- Gross Income: €${(formData?.app1_gross_salary || preEligibility?.income_1 || 0).toLocaleString()}`);
    notes.push(`- Monthly Commitments: €${(formData?.monthly_commitments || preEligibility?.monthly_commitments || 0).toLocaleString()}`);
    notes.push(`- Credit History: ${preEligibility?.credit_history || 'Not assessed'}\n`);
    
    notes.push(`PROPERTY & MORTGAGE:`);
    notes.push(`- Property Value: €${(formData?.property_value || preEligibility?.property_value || 0).toLocaleString()}`);
    notes.push(`- Deposit: €${(formData?.deposit_amount || preEligibility?.deposit_amount || 0).toLocaleString()}`);
    notes.push(`- Loan Required: €${(formData?.loan_amount || 0).toLocaleString()}`);
    notes.push(`- Term: ${formData?.mortgage_term || preEligibility?.desired_term || 25} years\n`);
    
    if (inconsistencies.length > 0) {
      notes.push(`AI DETECTED ISSUES:`);
      inconsistencies.forEach(issue => {
        notes.push(`- [${issue.severity.toUpperCase()}] ${issue.field}: ${issue.issue}`);
      });
    }
    
    setBrokerNotes(notes.join('\n'));
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* AI Inconsistency Detection */}
        {inconsistencies.length > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <h4 className="font-semibold text-warning flex items-center gap-2 mb-3">
              <span>🤖</span> AI Detected Inconsistencies
            </h4>
            <div className="space-y-2">
              {inconsistencies.map((issue, idx) => (
                <div key={idx} className={cn(
                  "flex items-start gap-2 text-sm p-2 rounded",
                  issue.severity === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                )}>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    issue.severity === 'critical' ? 'border-destructive text-destructive' : 'border-warning text-warning'
                  )}>
                    {issue.severity}
                  </Badge>
                  <div>
                    <span className="font-medium">{issue.field}:</span> {issue.issue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
            <h4 className="font-semibold text-secondary flex items-center gap-2 mb-3">
              <span>💡</span> AI Insights
            </h4>
            <ul className="space-y-1 text-sm">
              {aiSuggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1">⊿ Comments & Declarations</h4>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={autoPopulateNotes}>
            <span className="mr-1">🤖</span> AI Auto-Populate
          </Button>
          <Button variant="outline" size="sm" onClick={generateAISummary} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : '💡 Generate AI Insights'}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Broker Notes (MAX 5000 Characters)</Label>
            <Textarea 
              className="mt-2 min-h-[300px]" 
              placeholder="Enter broker notes here... or click 'AI Auto-Populate' to generate from client data"
              maxLength={5000}
              value={brokerNotes}
              onChange={(e) => setBrokerNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-6 border-t">
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

// Transactions Tab - AI-Enhanced Transaction Analysis
const TransactionsTab = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [affordabilityScore, setAffordabilityScore] = useState<number | null>(null);
  const [incomePatterns, setIncomePatterns] = useState<{category: string; amount: number; trend: 'up' | 'down' | 'stable'; color: string}[]>([]);
  const [expensePatterns, setExpensePatterns] = useState<{category: string; amount: number; percentage: number; color: string}[]>([]);

  const analyzeTransactions = () => {
    setIsAnalyzing(true);
    
    // Simulate AI transaction analysis
    setTimeout(() => {
      setIncomePatterns([
        { category: 'Primary Salary', amount: 4500, trend: 'stable', color: 'text-success' },
        { category: 'Overtime/Bonus', amount: 350, trend: 'up', color: 'text-success' },
        { category: 'Other Income', amount: 200, trend: 'stable', color: 'text-secondary' },
      ]);
      
      setExpensePatterns([
        { category: 'Rent/Mortgage', amount: 1200, percentage: 28, color: 'bg-primary' },
        { category: 'Utilities', amount: 280, percentage: 7, color: 'bg-secondary' },
        { category: 'Transport', amount: 350, percentage: 8, color: 'bg-warning' },
        { category: 'Groceries', amount: 450, percentage: 11, color: 'bg-success' },
        { category: 'Entertainment', amount: 200, percentage: 5, color: 'bg-destructive' },
        { category: 'Savings', amount: 500, percentage: 12, color: 'bg-primary' },
        { category: 'Other', amount: 420, percentage: 10, color: 'bg-muted' },
      ]);
      
      setAffordabilityScore(78);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* AI Analysis Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <span>🤖</span> AI Transaction Analysis
          </h4>
          <Button variant="outline" onClick={analyzeTransactions} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze Transactions'}
          </Button>
        </div>

        {/* Affordability Score */}
        {affordabilityScore !== null && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-secondary">Affordability Score</h5>
                <p className="text-sm text-muted-foreground">Based on income/expense pattern analysis</p>
              </div>
              <div className={cn(
                "text-3xl font-bold",
                affordabilityScore >= 70 ? 'text-success' : affordabilityScore >= 50 ? 'text-warning' : 'text-destructive'
              )}>
                {affordabilityScore}%
              </div>
            </div>
          </div>
        )}

        {/* Income Patterns */}
        {incomePatterns.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span>📈</span> Income Patterns (AI Categorized)
            </h4>
            <Table>
              <TableHeader>
                <TableRow className="bg-success/10">
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Monthly Average</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomePatterns.map((pattern, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{pattern.category}</TableCell>
                    <TableCell className="text-right">€{pattern.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={cn(
                        pattern.trend === 'up' ? 'border-success text-success' : 
                        pattern.trend === 'down' ? 'border-destructive text-destructive' : 'border-muted-foreground'
                      )}>
                        {pattern.trend === 'up' ? '↑ Increasing' : pattern.trend === 'down' ? '↓ Decreasing' : '→ Stable'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Total Monthly Income</TableCell>
                  <TableCell className="text-right">€{incomePatterns.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Expense Patterns */}
        {expensePatterns.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span>📊</span> Expense Breakdown (AI Categorized)
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensePatterns.map((pattern, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{pattern.category}</TableCell>
                      <TableCell className="text-right">€{pattern.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{pattern.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Visual breakdown */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Visual Breakdown</h5>
                {expensePatterns.map((pattern, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{pattern.category}</span>
                      <span>{pattern.percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", pattern.color)} style={{ width: `${pattern.percentage * 2}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {incomePatterns.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Upload bank statements to enable AI transaction analysis</p>
            <p className="text-sm mt-2">AI will automatically categorize income and expenses for affordability scoring</p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Lender Tab - AI Smart Lender Recommendation Engine
const LenderTab = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    lender: string;
    eligibilityScore: number;
    rate: string;
    maxLTV: number;
    processingTime: string;
    strengths: string[];
    concerns: string[];
    recommended: boolean;
  }[]>([]);
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);

  const allLenders = [
    { id: 'haven', name: 'Haven' },
    { id: 'ics', name: 'ICS (Dilosk)' },
    { id: 'pepper', name: 'Pepper HomeLoans' },
    { id: 'ptsb', name: 'Permanent TSB' },
    { id: 'boi', name: 'Bank of Ireland' },
    { id: 'aib', name: 'AIB' },
  ];

  const generateRecommendations = () => {
    setIsAnalyzing(true);
    
    // Simulate AI recommendation engine
    setTimeout(() => {
      setRecommendations([
        {
          lender: 'Bank of Ireland',
          eligibilityScore: 94,
          rate: '3.75%',
          maxLTV: 90,
          processingTime: '2-3 weeks',
          strengths: ['Best rate for FTB', 'Fast processing', 'Strong income match'],
          concerns: [],
          recommended: true,
        },
        {
          lender: 'AIB',
          eligibilityScore: 89,
          rate: '3.85%',
          maxLTV: 90,
          processingTime: '2-4 weeks',
          strengths: ['Competitive cashback', 'Flexible overpayment'],
          concerns: ['Slightly higher rate'],
          recommended: true,
        },
        {
          lender: 'Permanent TSB',
          eligibilityScore: 85,
          rate: '3.90%',
          maxLTV: 90,
          processingTime: '3-4 weeks',
          strengths: ['Good for self-employed', 'Strong local presence'],
          concerns: ['Longer processing'],
          recommended: true,
        },
        {
          lender: 'Haven',
          eligibilityScore: 72,
          rate: '4.10%',
          maxLTV: 80,
          processingTime: '2-3 weeks',
          strengths: ['Quick decisions'],
          concerns: ['Lower LTV limit', 'Higher rate'],
          recommended: false,
        },
        {
          lender: 'ICS (Dilosk)',
          eligibilityScore: 65,
          rate: '4.25%',
          maxLTV: 85,
          processingTime: '2-3 weeks',
          strengths: ['Good for complex cases'],
          concerns: ['Higher rate', 'More documentation required'],
          recommended: false,
        },
        {
          lender: 'Pepper HomeLoans',
          eligibilityScore: 58,
          rate: '4.75%',
          maxLTV: 80,
          processingTime: '1-2 weeks',
          strengths: ['Accepts adverse credit', 'Fast approval'],
          concerns: ['Higher rate', 'Lower LTV'],
          recommended: false,
        },
      ]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const toggleLender = (lenderId: string) => {
    setSelectedLenders(prev => 
      prev.includes(lenderId) 
        ? prev.filter(id => id !== lenderId)
        : [...prev, lenderId]
    );
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* AI Recommendation Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <span>🤖</span> AI Smart Lender Recommendations
          </h4>
          <Button onClick={generateRecommendations} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : '🎯 Get AI Recommendations'}
          </Button>
        </div>

        {/* Top 3 Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h5 className="font-semibold text-success flex items-center gap-2">
              <span>⭐</span> Top 3 Recommended Lenders
            </h5>
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.filter(r => r.recommended).map((rec, idx) => (
                <div key={rec.lender} className={cn(
                  "border rounded-lg p-4 space-y-3",
                  idx === 0 ? 'border-success bg-success/5' : 'border-border'
                )}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{rec.lender}</span>
                    <Badge className={cn(
                      rec.eligibilityScore >= 90 ? 'bg-success' : 
                      rec.eligibilityScore >= 80 ? 'bg-primary' : 'bg-warning'
                    )}>
                      {rec.eligibilityScore}% Match
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="font-medium">{rec.rate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max LTV:</span>
                      <span className="font-medium">{rec.maxLTV}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processing:</span>
                      <span className="font-medium">{rec.processingTime}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-success">✓ {rec.strengths.join(' • ')}</p>
                    {rec.concerns.length > 0 && (
                      <p className="text-xs text-warning mt-1">⚠ {rec.concerns.join(' • ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Lender List */}
        <div>
          <h5 className="font-semibold mb-3">All Lenders</h5>
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedLenders.length === allLenders.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLenders(allLenders.map(l => l.id));
                      } else {
                        setSelectedLenders([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Provider Name</TableHead>
                {recommendations.length > 0 && (
                  <>
                    <TableHead className="text-right">Eligibility</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>AI Notes</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allLenders.map((lender) => {
                const rec = recommendations.find(r => r.lender.toLowerCase().includes(lender.name.toLowerCase().split(' ')[0]));
                return (
                  <TableRow key={lender.id} className={rec?.recommended ? 'bg-success/5' : ''}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedLenders.includes(lender.id)}
                        onCheckedChange={() => toggleLender(lender.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {lender.name}
                      {rec?.recommended && <Badge className="ml-2 bg-success text-xs">Recommended</Badge>}
                    </TableCell>
                    {recommendations.length > 0 && (
                      <>
                        <TableCell className="text-right">
                          {rec && (
                            <span className={cn(
                              "font-medium",
                              rec.eligibilityScore >= 80 ? 'text-success' : 
                              rec.eligibilityScore >= 60 ? 'text-warning' : 'text-destructive'
                            )}>
                              {rec.eligibilityScore}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{rec?.rate || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {rec?.strengths[0] || '-'}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground">
          * AI recommendations based on applicant profile, income, credit history, and lender criteria.
        </p>

        <div className="flex gap-4 mt-6">
          <Button variant="outline" disabled={selectedLenders.length === 0}>
            Submit to Selected ({selectedLenders.length})
          </Button>
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

// Action Log Tab - AI & Broker Actions Compliance Tracking
const ActionLogTab = () => {
  const [filter, setFilter] = useState<'all' | 'ai' | 'broker' | 'system'>('all');
  
  // Sample action log entries for compliance tracking
  const actionLogs = [
    { id: 1, timestamp: '2024-01-15 14:32:05', actor: 'AI System', actorType: 'ai', action: 'Auto-populated declarations from client data', details: 'Generated summary from pre-eligibility and form data', status: 'completed' },
    { id: 2, timestamp: '2024-01-15 14:35:22', actor: 'Kay Condon', actorType: 'broker', action: 'Override: Updated loan amount', details: 'Changed from €350,000 to €380,000 - Client confirmed additional deposit', status: 'override' },
    { id: 3, timestamp: '2024-01-15 15:01:18', actor: 'AI System', actorType: 'ai', action: 'Lender recommendation generated', details: 'Top 3: Bank of Ireland (94%), AIB (89%), PTSB (85%)', status: 'completed' },
    { id: 4, timestamp: '2024-01-15 15:12:44', actor: 'Kay Condon', actorType: 'broker', action: 'Override: Selected non-recommended lender', details: 'Selected Haven instead of BOI - Client preference for cashback offer', status: 'override' },
    { id: 5, timestamp: '2024-01-15 15:30:00', actor: 'AI System', actorType: 'ai', action: 'Inconsistency detected', details: 'Deposit ratio below 10% threshold', status: 'warning' },
    { id: 6, timestamp: '2024-01-15 16:05:33', actor: 'System', actorType: 'system', action: 'Document uploaded', details: 'Payslip_Jan2024.pdf - Pending AI analysis', status: 'completed' },
    { id: 7, timestamp: '2024-01-15 16:06:01', actor: 'AI System', actorType: 'ai', action: 'Document analyzed', details: 'Payslip verified - Monthly gross €4,850 detected', status: 'completed' },
    { id: 8, timestamp: '2024-01-16 09:15:22', actor: 'AI System', actorType: 'ai', action: 'Transaction analysis completed', details: 'Affordability score: 78% - Income patterns stable', status: 'completed' },
    { id: 9, timestamp: '2024-01-16 10:30:00', actor: 'Kay Condon', actorType: 'broker', action: 'Override: Approved despite AI warning', details: 'Proceeded with application despite LTV warning - Guarantor added', status: 'override' },
    { id: 10, timestamp: '2024-01-16 11:45:18', actor: 'AI System', actorType: 'ai', action: 'Guarantor detected', details: 'Additional security identified in form data', status: 'completed' },
  ];

  const filteredLogs = filter === 'all' 
    ? actionLogs 
    : actionLogs.filter(log => log.actorType === filter);

  const getStatusBadge = (status: string, actorType: string) => {
    if (status === 'override') {
      return <Badge className="bg-warning text-warning-foreground">Override</Badge>;
    }
    if (status === 'warning') {
      return <Badge variant="outline" className="border-warning text-warning">Warning</Badge>;
    }
    if (actorType === 'ai') {
      return <Badge variant="outline" className="border-secondary text-secondary">AI Action</Badge>;
    }
    return <Badge variant="outline">Completed</Badge>;
  };

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case 'ai': return '🤖';
      case 'broker': return '👤';
      case 'system': return '⚙️';
      default: return '📋';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Header with compliance info */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              <span>📋</span> Compliance Action Log
            </h4>
            <p className="text-sm text-muted-foreground">Tracks all AI actions and broker overrides for regulatory compliance</p>
          </div>
          <Button variant="outline" size="sm">
            Export Log
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'ai', label: '🤖 AI Actions' },
            { id: 'broker', label: '👤 Broker Actions' },
            { id: 'system', label: '⚙️ System' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={filter === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(tab.id as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Action Log Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10">
              <TableHead className="w-40">Timestamp</TableHead>
              <TableHead className="w-32">Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No action records found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className={log.status === 'override' ? 'bg-warning/5' : ''}>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {getActorIcon(log.actorType)}
                      <span className="text-sm">{log.actor}</span>
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                  <TableCell>{getStatusBadge(log.status, log.actorType)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">{actionLogs.filter(l => l.actorType === 'ai').length}</div>
            <div className="text-sm text-muted-foreground">AI Actions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{actionLogs.filter(l => l.actorType === 'broker').length}</div>
            <div className="text-sm text-muted-foreground">Broker Actions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{actionLogs.filter(l => l.status === 'override').length}</div>
            <div className="text-sm text-muted-foreground">Overrides</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{actionLogs.filter(l => l.status === 'warning').length}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Security Tab - AI-Enhanced Additional Security Detection
const SecurityTab = ({ formData }: { formData: any }) => {
  const [aiDetection, setAiDetection] = useState<{
    hasGuarantor: boolean;
    hasAdditionalCollateral: boolean;
    detectedProperties: {type: string; value: number; equity: number}[];
    recommendations: string[];
  } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const runAIDetection = () => {
    setIsDetecting(true);
    
    // Simulate AI detection from form data
    setTimeout(() => {
      const detection = {
        hasGuarantor: formData?.app2_is_guarantor || false,
        hasAdditionalCollateral: (formData?.security_market_value || 0) > 0,
        detectedProperties: [],
        recommendations: [],
      };

      // Check for additional collateral
      if (formData?.security_market_value && formData?.security_current_loan_balance) {
        const equity = formData.security_market_value - formData.security_current_loan_balance;
        if (equity > 0) {
          detection.detectedProperties.push({
            type: formData?.security_type || 'Residential Property',
            value: formData.security_market_value,
            equity: equity,
          });
        }
      }

      // Generate recommendations
      if (detection.hasGuarantor) {
        detection.recommendations.push('Guarantor detected - ensure guarantor documents are collected');
      }
      if (detection.detectedProperties.length > 0) {
        detection.recommendations.push('Additional property collateral available - may improve LTV ratio');
      }
      if (!detection.hasGuarantor && !detection.hasAdditionalCollateral) {
        detection.recommendations.push('Consider adding guarantor or additional collateral to strengthen application');
      }

      setAiDetection(detection);
      setIsDetecting(false);
    }, 1500);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* AI Detection Panel */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <span>🤖</span> AI Security Detection
          </h4>
          <Button variant="outline" onClick={runAIDetection} disabled={isDetecting}>
            {isDetecting ? 'Detecting...' : 'Run AI Detection'}
          </Button>
        </div>

        {aiDetection && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Detection Results */}
            <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 space-y-3">
              <h5 className="font-semibold text-secondary">Detection Results</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Guarantor Detected:</span>
                  <Badge className={aiDetection.hasGuarantor ? 'bg-success' : 'bg-muted'}>
                    {aiDetection.hasGuarantor ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Additional Collateral:</span>
                  <Badge className={aiDetection.hasAdditionalCollateral ? 'bg-success' : 'bg-muted'}>
                    {aiDetection.hasAdditionalCollateral ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              {aiDetection.detectedProperties.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Detected Properties:</p>
                  {aiDetection.detectedProperties.map((prop, idx) => (
                    <div key={idx} className="text-sm bg-background p-2 rounded">
                      <div className="font-medium">{prop.type}</div>
                      <div className="text-muted-foreground">
                        Value: €{prop.value.toLocaleString()} | Equity: €{prop.equity.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 space-y-3">
              <h5 className="font-semibold text-warning flex items-center gap-2">
                <span>💡</span> AI Recommendations
              </h5>
              <ul className="space-y-2 text-sm">
                {aiDetection.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1">⊿ Properties as security</h4>
        
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
            <Input className="flex-1" type="number" defaultValue={formData?.security_market_value || 0} />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Current Loan Balance</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="flex-1" type="number" defaultValue={formData?.security_current_loan_balance || 0} />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-48 text-muted-foreground">Current Monthly Repayment</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="flex-1" type="number" defaultValue={formData?.security_monthly_repayment || 0} />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-32 text-muted-foreground text-right">Address</Label>
                <Input className="flex-1" defaultValue={formData?.security_address || ''} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-muted-foreground text-right">Type of Security</Label>
                <Select defaultValue={formData?.security_type}>
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

        <div className="flex justify-center gap-4 pt-6 border-t">
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

// Alternative Tab - AI-Enhanced Alternative Lending with Secondary Lender Suggestions
const AlternativeTab = ({ formData }: { formData: any }) => {
  const [showSecondaryLenders, setShowSecondaryLenders] = useState(false);
  const [secondaryLenders] = useState([
    { name: 'Pepper HomeLoans', rate: '4.75%', specialty: 'Adverse credit', approval: '85%', note: 'Accepts up to 3 missed payments in last 12 months' },
    { name: 'Finance Ireland', rate: '4.95%', specialty: 'Self-employed', approval: '78%', note: 'Flexible income verification' },
    { name: 'Dilosk/ICS', rate: '4.50%', specialty: 'Complex cases', approval: '72%', note: 'Good for non-standard properties' },
  ]);

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* AI Secondary Lender Panel */}
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-secondary flex items-center gap-2">
              <span>🤖</span> AI Secondary Lender Suggestions
            </h5>
            <Button variant="outline" size="sm" onClick={() => setShowSecondaryLenders(!showSecondaryLenders)}>
              {showSecondaryLenders ? 'Hide' : 'Show'} Alternatives
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">If top-tier lenders decline, AI suggests these secondary options based on applicant profile.</p>
          
          {showSecondaryLenders && (
            <div className="mt-4 space-y-3">
              {secondaryLenders.map((lender, idx) => (
                <div key={idx} className="bg-background p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{lender.name}</span>
                    <Badge variant="outline" className="border-secondary text-secondary">{lender.approval} likely</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>Rate: {lender.rate}</span> • <span>Specialty: {lender.specialty}</span>
                  </div>
                  <p className="text-xs text-success mt-1">💡 {lender.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-1">⊿ Please Complete this section if Alternative Lending is sought</h4>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Label className="w-72 text-muted-foreground">Have you had a mortgage on any other property?</Label>
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
            <Label className="w-72 text-muted-foreground">Have there been missed repayments or judgements?</Label>
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

          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-4">
              <span className="w-8">1.</span>
              <Label className="w-80 text-muted-foreground">Installment Arrears in last 12 months</Label>
              <Input className="w-20" type="number" defaultValue="0" />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-8">2.</span>
              <Label className="w-80 text-muted-foreground">Installment Arrears in last 6 months</Label>
              <Input className="w-20" type="number" defaultValue="0" />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-6 border-t">
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
export default ApplicationTab;
