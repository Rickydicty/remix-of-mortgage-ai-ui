import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Upload, FileText, MessageSquare, FileCheck, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import ClientMessaging from "@/components/broker/ClientMessaging";
import AIPTab from "@/components/client/AIPTab";
import { AIPDocumentsList } from "@/components/client/AIPDocumentsList";
import { ESignaturesTab } from "@/components/client/ESignaturesTab";
import { LoanOffersTab } from "@/components/client/LoanOffersTab";
import { format, addDays } from "date-fns";

interface Application {
  id: string;
  application_number: string;
  status: string;
  current_step: number;
  assigned_broker_id: string | null;
  aip_letter_url: string | null;
  aip_approved_amount: number | null;
  aip_lender_name: string | null;
  aip_issue_date: string | null;
  aip_validity_period: number | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
}

interface ClientApplicationTabProps {
  applicationId: string | null;
  application?: Application | null;
  brokerProfile?: Profile | null;
  onRefresh?: () => void;
}

interface FormData {
  // Personal - App 1
  app1_title: string;
  app1_forenames: string;
  app1_surname: string;
  app1_other_names: string;
  app1_gender: string;
  app1_date_of_birth: string;
  app1_nationality: string;
  app1_pps_number: string;
  app1_marital_status: string;
  app1_no_of_children: number;
  app1_children_ages: string;
  app1_phone: string;
  app1_email: string;
  app1_address: string;
  app1_years_at_address: number;
  
  // Personal - App 2
  app2_enabled: boolean;
  app2_is_guarantor: boolean;
  app2_title: string;
  app2_forenames: string;
  app2_surname: string;
  app2_other_names: string;
  app2_gender: string;
  app2_date_of_birth: string;
  app2_nationality: string;
  app2_pps_number: string;
  app2_marital_status: string;
  app2_no_of_children: number;
  app2_children_ages: string;
  app2_phone: string;
  app2_email: string;
  app2_address: string;
  app2_years_at_address: number;
  
  // Income - App 1
  app1_gross_salary: number;
  app1_salary_frequency: string;
  app1_overtime: number;
  app1_overtime_frequency: string;
  app1_bonuses: number;
  app1_bonuses_frequency: string;
  app1_commissions: number;
  app1_commissions_frequency: string;
  app1_other_income: number;
  app1_other_income_frequency: string;
  app1_other_income_details: string;
  app1_lodger_income: number;
  app1_residential_investment_income: number;
  app1_other_household_income: number;
  
  // Income - App 2
  app2_gross_salary: number;
  app2_salary_frequency: string;
  app2_overtime: number;
  app2_overtime_frequency: string;
  app2_bonuses: number;
  app2_bonuses_frequency: string;
  app2_commissions: number;
  app2_commissions_frequency: string;
  app2_other_income: number;
  app2_other_income_frequency: string;
  app2_other_income_details: string;
  app2_lodger_income: number;
  app2_residential_investment_income: number;
  
  // Financial
  monthly_commitments: number;
  existing_loans: number;
  credit_cards: number;
  savings: number;
  credit_history: string;
  has_ccj: boolean;
  ccj_details: string;
  has_arrears: boolean;
  arrears_details: string;
  
  // Mortgage
  property_value: number;
  deposit_amount: number;
  loan_amount: number;
  mortgage_term: number;
  mortgage_type: string;
  first_time_buyer: boolean;
  help_to_buy: boolean;
  
  // Property
  property_type: string;
  property_address: string;
  ber_rating: string;
  year_built: number;
  property_new_or_secondhand: string;
  estimated_closing_date: string;
  
  // Alternative Lending
  has_other_mortgage: boolean;
  other_mortgage_details: string;
  has_missed_repayments: boolean;
  missed_repayments_details: string;
  has_judgements: boolean;
  judgements_details: string;
  
  // Additional Security
  security_lending_institution: string;
  security_market_value: number;
  security_current_loan_balance: number;
  security_monthly_repayment: number;
  security_address: string;
  security_type: string;
  
  // Notes
  broker_notes: string;
}

const defaultFormData: FormData = {
  app1_title: '',
  app1_forenames: '',
  app1_surname: '',
  app1_other_names: '',
  app1_gender: '',
  app1_date_of_birth: '',
  app1_nationality: 'Irish',
  app1_pps_number: '',
  app1_marital_status: '',
  app1_no_of_children: 0,
  app1_children_ages: '',
  app1_phone: '',
  app1_email: '',
  app1_address: '',
  app1_years_at_address: 0,
  
  app2_enabled: false,
  app2_is_guarantor: false,
  app2_title: '',
  app2_forenames: '',
  app2_surname: '',
  app2_other_names: '',
  app2_gender: '',
  app2_date_of_birth: '',
  app2_nationality: 'Irish',
  app2_pps_number: '',
  app2_marital_status: '',
  app2_no_of_children: 0,
  app2_children_ages: '',
  app2_phone: '',
  app2_email: '',
  app2_address: '',
  app2_years_at_address: 0,
  
  app1_gross_salary: 0,
  app1_salary_frequency: 'annual',
  app1_overtime: 0,
  app1_overtime_frequency: 'annual',
  app1_bonuses: 0,
  app1_bonuses_frequency: 'annual',
  app1_commissions: 0,
  app1_commissions_frequency: 'annual',
  app1_other_income: 0,
  app1_other_income_frequency: 'annual',
  app1_other_income_details: '',
  app1_lodger_income: 0,
  app1_residential_investment_income: 0,
  app1_other_household_income: 0,
  
  app2_gross_salary: 0,
  app2_salary_frequency: 'annual',
  app2_overtime: 0,
  app2_overtime_frequency: 'annual',
  app2_bonuses: 0,
  app2_bonuses_frequency: 'annual',
  app2_commissions: 0,
  app2_commissions_frequency: 'annual',
  app2_other_income: 0,
  app2_other_income_frequency: 'annual',
  app2_other_income_details: '',
  app2_lodger_income: 0,
  app2_residential_investment_income: 0,
  
  monthly_commitments: 0,
  existing_loans: 0,
  credit_cards: 0,
  savings: 0,
  credit_history: '',
  has_ccj: false,
  ccj_details: '',
  has_arrears: false,
  arrears_details: '',
  
  property_value: 0,
  deposit_amount: 0,
  loan_amount: 0,
  mortgage_term: 25,
  mortgage_type: '',
  first_time_buyer: false,
  help_to_buy: false,
  
  property_type: '',
  property_address: '',
  ber_rating: '',
  year_built: 0,
  property_new_or_secondhand: '',
  estimated_closing_date: '',
  
  has_other_mortgage: false,
  other_mortgage_details: '',
  has_missed_repayments: false,
  missed_repayments_details: '',
  has_judgements: false,
  judgements_details: '',
  
  security_lending_institution: '',
  security_market_value: 0,
  security_current_loan_balance: 0,
  security_monthly_repayment: 0,
  security_address: '',
  security_type: '',
  
  broker_notes: '',
};

const ClientApplicationTab = ({ applicationId, application, brokerProfile, onRefresh }: ClientApplicationTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formDataId, setFormDataId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Tab configuration - Row 1: Documents, AIP, Loan Offers, E-Signatures
  const row1Tabs = [
    { id: "documents", label: "Documents" },
    { id: "aip", label: "AIP" },
    { id: "aip-letter", label: "AIP Letter" },
    { id: "loan-offers", label: "Loan Offers" },
    { id: "signatures", label: "E-Signatures" },
  ];

  // Tab configuration - Row 2: Application form tabs
  const row2Tabs = [
    { id: "personal", label: "Personal Details" },
    { id: "income", label: "Income & Employment" },
    { id: "financial", label: "Financial & Credit History" },
    { id: "mortgage", label: "Mortgage Details" },
    { id: "property", label: "Property Details" },
    { id: "security", label: "Additional Security" },
    { id: "alternative", label: "Alternative Lending" },
    { id: "declarations", label: "Declarations" },
  ];

  useEffect(() => {
    fetchData();
  }, [user, applicationId]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch existing form data
      const query = supabase
        .from('application_form_data')
        .select('*')
        .eq('user_id', user.id);
      
      if (applicationId) {
        query.eq('application_id', applicationId);
      }

      const { data: formDataResult } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (formDataResult) {
        setFormDataId(formDataResult.id);
        setFormData({
          ...defaultFormData,
          ...formDataResult,
          app1_date_of_birth: formDataResult.app1_date_of_birth || '',
          app2_date_of_birth: formDataResult.app2_date_of_birth || '',
          estimated_closing_date: formDataResult.estimated_closing_date || '',
        });
      } else {
        // Pre-populate from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', user.id)
          .single();

        if (profileData) {
          const nameParts = profileData.full_name?.split(' ') || [];
          setFormData(prev => ({
            ...prev,
            app1_forenames: nameParts[0] || '',
            app1_surname: nameParts.slice(1).join(' ') || '',
            app1_email: profileData.email || '',
            app1_phone: profileData.phone || '',
          }));
        }

        // Pre-populate from pre-eligibility
        const { data: preElig } = await supabase
          .from('pre_eligibility_data')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (preElig) {
          setFormData(prev => ({
            ...prev,
            app1_gross_salary: preElig.income_1 || 0,
            app2_gross_salary: preElig.income_2 || 0,
            app2_enabled: preElig.applicant_type === 'joint',
            monthly_commitments: preElig.monthly_commitments || 0,
            property_value: preElig.property_value || 0,
            deposit_amount: preElig.deposit_amount || 0,
            loan_amount: (preElig.property_value || 0) - (preElig.deposit_amount || 0),
            mortgage_term: preElig.desired_term || 25,
            first_time_buyer: preElig.first_time_buyer || false,
            credit_history: preElig.credit_history || '',
            app1_phone: preElig.phone || prev.app1_phone,
            app1_email: preElig.email || prev.app1_email,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const dataToSave = {
        user_id: user.id,
        application_id: applicationId || null,
        ...formData,
        app1_date_of_birth: formData.app1_date_of_birth || null,
        app2_date_of_birth: formData.app2_date_of_birth || null,
        estimated_closing_date: formData.estimated_closing_date || null,
      };

      if (formDataId) {
        const { error } = await supabase
          .from('application_form_data')
          .update(dataToSave)
          .eq('id', formDataId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('application_form_data')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        setFormDataId(data.id);
      }

      toast({
        title: "Changes saved",
        description: "Your application details have been updated.",
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    onRefresh?.();
  };

  const handleSubmitForReview = async () => {
    if (!application) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'pending_review',
          current_step: 3
        })
        .eq('id', application.id);

      if (error) throw error;

      onRefresh?.();
      toast({
        title: "Submitted for Review",
        description: "All documents uploaded! Your application is now under broker review.",
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    }
  };

  const canSubmitForReview = () => {
    if (!application) return false;
    // Check if all required documents are uploaded (simplified check)
    return application.status === 'draft' || application.status === 'pending' || application.status === 'needs_documents';
  };

  return (
    <div className="space-y-4">
      {/* Save Button - only show for form tabs */}
      {['personal', 'income', 'financial', 'mortgage', 'property', 'security', 'alternative', 'declarations'].includes(activeTab) && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Tab Navigation - Two Rows */}
      <Card className="overflow-hidden">
        <div className="border-b border-border">
          {/* Row 1 - Documents, AIP, Offers, Signatures */}
          <div className="flex flex-wrap bg-muted/30">
            {row1Tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-r border-b border-border transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Row 2 - Application Form Tabs */}
          <div className="flex flex-wrap bg-background">
            {row2Tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-r border-border transition-colors",
                  activeTab === tab.id
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

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="space-y-8">
          <DocumentUpload onUploadComplete={handleUploadComplete} />
          <DocumentList refreshTrigger={refreshTrigger} />

          {canSubmitForReview() && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Ready for Review</h3>
                    <p className="text-sm text-muted-foreground">
                      All required documents uploaded. Submit to broker for review.
                    </p>
                  </div>
                  <Button onClick={handleSubmitForReview} size="lg">
                    Submit for Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {application?.status === 'pending_review' && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="pt-6">
                <div className="text-center py-4">
                  <h3 className="font-semibold text-lg mb-2">Under Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Your documents are being reviewed by your broker.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {application?.status === 'needs_documents' && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-6">
                <div className="text-center py-4">
                  <h3 className="font-semibold text-lg mb-2 text-destructive">Additional Documents Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Your broker has requested additional documents.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Valuation & Solicitor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Valuation Report</Label>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Valuation Report
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Solicitor Contact</Label>
                <Input placeholder="Solicitor Name" />
                <Input placeholder="Email" type="email" />
                <Input placeholder="Phone" type="tel" />
              </div>
            </CardContent>
          </Card>

          {application?.assigned_broker_id ? (
            <ClientMessaging 
              clientId={application.assigned_broker_id} 
              clientName={brokerProfile?.full_name || brokerProfile?.email || 'Broker'} 
              applicationId={application.id}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-success" />
                  Support Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 border border-border rounded-lg p-4 overflow-y-auto bg-muted/30 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">A broker will be assigned to your application soon</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* AIP Tab */}
      {activeTab === "aip" && (
        <AIPTab
          aipData={application as any}
          brokerProfile={brokerProfile || null}
          onNavigateToDocuments={() => setActiveTab("documents")}
          onOpenMessaging={() => setActiveTab("documents")}
        />
      )}

      {/* AIP Letter Tab */}
      {activeTab === "aip-letter" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Agreement in Principle Letter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {application?.aip_letter_url ? (
                <>
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-success/20 rounded-full">
                        <FileCheck className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-success mb-1">AIP Letter Available</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Your Agreement in Principle has been issued. Download your letter below.
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => window.open(application.aip_letter_url!, '_blank')}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download AIP Letter
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Approved Amount</p>
                      <p className="text-2xl font-bold text-success">
                        €{application.aip_approved_amount?.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Lender</p>
                      <p className="text-lg font-semibold">{application.aip_lender_name || 'N/A'}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Issue Date</p>
                      <p className="text-lg font-semibold">
                        {application.aip_issue_date 
                          ? format(new Date(application.aip_issue_date), 'dd MMM yyyy')
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
                      <p className="text-lg font-semibold">
                        {application.aip_issue_date 
                          ? format(
                              addDays(new Date(application.aip_issue_date), application.aip_validity_period || 90),
                              'dd MMM yyyy'
                            )
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                    <FileCheck className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">AIP Letter Not Yet Issued</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Your Agreement in Principle is being processed. Once approved, your AIP letter will be available here for download.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                AIP Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AIPDocumentsList applicationId={application?.id} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loan Offers Tab */}
      {activeTab === "loan-offers" && (
        <LoanOffersTab applicationId={application?.id || null} />
      )}

      {/* E-Signatures Tab */}
      {activeTab === "signatures" && (
        <ESignaturesTab 
          application={application || null} 
          onSignatureComplete={onRefresh || (() => {})}
        />
      )}

      {/* Form Tabs Content */}
      {activeTab === "personal" && <PersonalTab formData={formData} onChange={handleInputChange} />}
      {activeTab === "income" && <IncomeTab formData={formData} onChange={handleInputChange} />}
      {activeTab === "financial" && <FinancialTab formData={formData} onChange={handleInputChange} />}
      {activeTab === "mortgage" && <MortgageTab formData={formData} onChange={handleInputChange} />}
      {activeTab === "property" && <PropertyTab formData={formData} onChange={handleInputChange} />}
      {activeTab === "security" && <SecurityTab formData={formData} onChange={handleInputChange} />}
      {activeTab === "alternative" && <AlternativeTab formData={formData} onChange={handleInputChange} />}
      {activeTab === "declarations" && <DeclarationsTab formData={formData} onChange={handleInputChange} />}
    </div>
  );
};

// Personal Tab
const PersonalTab = ({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Applicant 1 */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary text-lg">Applicant 1</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Title</Label>
                <Select value={formData.app1_title} onValueChange={(v) => onChange('app1_title', v)}>
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
                <Label className="w-40 text-muted-foreground">Forenames<span className="text-destructive">*</span></Label>
                <Input className="flex-1" value={formData.app1_forenames} onChange={(e) => onChange('app1_forenames', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Surname<span className="text-destructive">*</span></Label>
                <Input className="flex-1" value={formData.app1_surname} onChange={(e) => onChange('app1_surname', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Other/Previous Names</Label>
                <Input className="flex-1" value={formData.app1_other_names} onChange={(e) => onChange('app1_other_names', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Gender</Label>
                <Select value={formData.app1_gender} onValueChange={(v) => onChange('app1_gender', v)}>
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
                <Label className="w-40 text-muted-foreground">Date of Birth</Label>
                <Input className="flex-1" type="date" value={formData.app1_date_of_birth} onChange={(e) => onChange('app1_date_of_birth', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Nationality</Label>
                <Input className="flex-1" value={formData.app1_nationality} onChange={(e) => onChange('app1_nationality', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">PPS Number</Label>
                <Input className="flex-1" value={formData.app1_pps_number} onChange={(e) => onChange('app1_pps_number', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Marital Status</Label>
                <Select value={formData.app1_marital_status} onValueChange={(v) => onChange('app1_marital_status', v)}>
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
                <Input className="w-20" type="number" value={formData.app1_no_of_children || ''} onChange={(e) => onChange('app1_no_of_children', parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Children's Ages</Label>
                <Input className="flex-1" placeholder="e.g., 5, 8, 12" value={formData.app1_children_ages} onChange={(e) => onChange('app1_children_ages', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Phone</Label>
                <Input className="flex-1" value={formData.app1_phone} onChange={(e) => onChange('app1_phone', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Email</Label>
                <Input className="flex-1" type="email" value={formData.app1_email} onChange={(e) => onChange('app1_email', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Address</Label>
                <Textarea className="flex-1" value={formData.app1_address} onChange={(e) => onChange('app1_address', e.target.value)} rows={2} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Years at Address</Label>
                <Input className="w-20" type="number" value={formData.app1_years_at_address || ''} onChange={(e) => onChange('app1_years_at_address', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* Applicant 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-primary text-lg">Applicant 2</h3>
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="enabled" checked={formData.app2_enabled} onCheckedChange={(v) => onChange('app2_enabled', v)} />
                  <Label htmlFor="enabled" className="text-sm">Enabled</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="guarantor" checked={formData.app2_is_guarantor} onCheckedChange={(v) => onChange('app2_is_guarantor', v)} />
                  <Label htmlFor="guarantor" className="text-sm">Guarantor</Label>
                </div>
              </div>
            </div>
            <div className={cn("space-y-3", !formData.app2_enabled && "opacity-50 pointer-events-none")}>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Title</Label>
                <Select value={formData.app2_title} onValueChange={(v) => onChange('app2_title', v)}>
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
                <Label className="w-40 text-muted-foreground">Forenames<span className="text-destructive">*</span></Label>
                <Input className="flex-1" value={formData.app2_forenames} onChange={(e) => onChange('app2_forenames', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Surname<span className="text-destructive">*</span></Label>
                <Input className="flex-1" value={formData.app2_surname} onChange={(e) => onChange('app2_surname', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Other/Previous Names</Label>
                <Input className="flex-1" value={formData.app2_other_names} onChange={(e) => onChange('app2_other_names', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Gender</Label>
                <Select value={formData.app2_gender} onValueChange={(v) => onChange('app2_gender', v)}>
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
                <Label className="w-40 text-muted-foreground">Date of Birth</Label>
                <Input className="flex-1" type="date" value={formData.app2_date_of_birth} onChange={(e) => onChange('app2_date_of_birth', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Nationality</Label>
                <Input className="flex-1" value={formData.app2_nationality} onChange={(e) => onChange('app2_nationality', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">PPS Number</Label>
                <Input className="flex-1" value={formData.app2_pps_number} onChange={(e) => onChange('app2_pps_number', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Marital Status</Label>
                <Select value={formData.app2_marital_status} onValueChange={(v) => onChange('app2_marital_status', v)}>
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
                <Input className="w-20" type="number" value={formData.app2_no_of_children || ''} onChange={(e) => onChange('app2_no_of_children', parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Children's Ages</Label>
                <Input className="flex-1" placeholder="e.g., 5, 8, 12" value={formData.app2_children_ages} onChange={(e) => onChange('app2_children_ages', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Phone</Label>
                <Input className="flex-1" value={formData.app2_phone} onChange={(e) => onChange('app2_phone', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Email</Label>
                <Input className="flex-1" type="email" value={formData.app2_email} onChange={(e) => onChange('app2_email', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Address</Label>
                <Textarea className="flex-1" value={formData.app2_address} onChange={(e) => onChange('app2_address', e.target.value)} rows={2} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-muted-foreground">Years at Address</Label>
                <Input className="w-20" type="number" value={formData.app2_years_at_address || ''} onChange={(e) => onChange('app2_years_at_address', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Income Tab
const IncomeTab = ({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) => {
  const FrequencySelect = ({ value, field }: { value: string; field: keyof FormData }) => (
    <Select value={value} onValueChange={(v) => onChange(field, v)}>
      <SelectTrigger className="w-36">
        <SelectValue placeholder="Frequency" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="annual">Annual</SelectItem>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="weekly">Weekly</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Applicant 1 */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary text-lg">Applicant 1</h3>
            <h4 className="font-semibold bg-primary/10 px-3 py-1">⊿ Current Income</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Gross basic wage/salary per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app1_gross_salary || ''} onChange={(e) => onChange('app1_gross_salary', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app1_salary_frequency} field="app1_salary_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Overtime per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app1_overtime || ''} onChange={(e) => onChange('app1_overtime', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app1_overtime_frequency} field="app1_overtime_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Bonuses per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app1_bonuses || ''} onChange={(e) => onChange('app1_bonuses', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app1_bonuses_frequency} field="app1_bonuses_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Commissions per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app1_commissions || ''} onChange={(e) => onChange('app1_commissions', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app1_commissions_frequency} field="app1_commissions_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Other income (non rental)</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app1_other_income || ''} onChange={(e) => onChange('app1_other_income', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app1_other_income_frequency} field="app1_other_income_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Other Income Details</Label>
                <Input className="flex-1" value={formData.app1_other_income_details} onChange={(e) => onChange('app1_other_income_details', e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Lodger income per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app1_lodger_income || ''} onChange={(e) => onChange('app1_lodger_income', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Residential investment income</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app1_residential_investment_income || ''} onChange={(e) => onChange('app1_residential_investment_income', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Label className="w-56 text-sm text-muted-foreground">Other Household Income</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app1_other_household_income || ''} onChange={(e) => onChange('app1_other_household_income', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* Applicant 2 */}
          <div className={cn("space-y-4", !formData.app2_enabled && "opacity-50 pointer-events-none")}>
            <h3 className="font-bold text-primary text-lg">Applicant 2</h3>
            <h4 className="font-semibold bg-primary/10 px-3 py-1">⊿ Current Income</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Gross basic wage/salary per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app2_gross_salary || ''} onChange={(e) => onChange('app2_gross_salary', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app2_salary_frequency} field="app2_salary_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Overtime per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app2_overtime || ''} onChange={(e) => onChange('app2_overtime', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app2_overtime_frequency} field="app2_overtime_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Bonuses per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app2_bonuses || ''} onChange={(e) => onChange('app2_bonuses', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app2_bonuses_frequency} field="app2_bonuses_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Commissions per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app2_commissions || ''} onChange={(e) => onChange('app2_commissions', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app2_commissions_frequency} field="app2_commissions_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Other income (non rental)</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app2_other_income || ''} onChange={(e) => onChange('app2_other_income', parseFloat(e.target.value) || 0)} />
                <FrequencySelect value={formData.app2_other_income_frequency} field="app2_other_income_frequency" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Other Income Details</Label>
                <Input className="flex-1" value={formData.app2_other_income_details} onChange={(e) => onChange('app2_other_income_details', e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Lodger income per annum</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app2_lodger_income || ''} onChange={(e) => onChange('app2_lodger_income', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-56 text-sm text-muted-foreground">Residential investment income</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="w-28" type="number" value={formData.app2_residential_investment_income || ''} onChange={(e) => onChange('app2_residential_investment_income', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Financial Tab
const FinancialTab = ({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-primary text-lg">Financial & Credit History</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Monthly Commitments</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.monthly_commitments || ''} onChange={(e) => onChange('monthly_commitments', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Existing Loans</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.existing_loans || ''} onChange={(e) => onChange('existing_loans', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Credit Cards Outstanding</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.credit_cards || ''} onChange={(e) => onChange('credit_cards', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Savings</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.savings || ''} onChange={(e) => onChange('savings', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Credit History</Label>
              <Select value={formData.credit_history} onValueChange={(v) => onChange('credit_history', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={formData.has_ccj} onCheckedChange={(v) => onChange('has_ccj', v)} />
                <Label className="text-muted-foreground">Any CCJs or defaults?</Label>
              </div>
              {formData.has_ccj && (
                <Textarea placeholder="Please provide details..." value={formData.ccj_details} onChange={(e) => onChange('ccj_details', e.target.value)} />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={formData.has_arrears} onCheckedChange={(v) => onChange('has_arrears', v)} />
                <Label className="text-muted-foreground">Any arrears on existing loans?</Label>
              </div>
              {formData.has_arrears && (
                <Textarea placeholder="Please provide details..." value={formData.arrears_details} onChange={(e) => onChange('arrears_details', e.target.value)} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Mortgage Tab
const MortgageTab = ({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-primary text-lg">Mortgage Details</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Property Value</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.property_value || ''} onChange={(e) => onChange('property_value', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Deposit Amount</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.deposit_amount || ''} onChange={(e) => onChange('deposit_amount', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Loan Amount Required</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.loan_amount || ''} onChange={(e) => onChange('loan_amount', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Mortgage Term (Years)</Label>
              <Input className="w-24" type="number" value={formData.mortgage_term || ''} onChange={(e) => onChange('mortgage_term', parseInt(e.target.value) || 25)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Mortgage Type</Label>
              <Select value={formData.mortgage_type} onValueChange={(v) => onChange('mortgage_type', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time_buyer">First Time Buyer</SelectItem>
                  <SelectItem value="mover">Mover</SelectItem>
                  <SelectItem value="switcher">Switcher</SelectItem>
                  <SelectItem value="remortgage">Remortgage</SelectItem>
                  <SelectItem value="top_up">Top Up</SelectItem>
                  <SelectItem value="buy_to_let">Buy to Let</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.first_time_buyer} onCheckedChange={(v) => onChange('first_time_buyer', v)} />
              <Label className="text-muted-foreground">First Time Buyer</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.help_to_buy} onCheckedChange={(v) => onChange('help_to_buy', v)} />
              <Label className="text-muted-foreground">Help to Buy Scheme</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Property Tab
const PropertyTab = ({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-primary text-lg">Property Details</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Property Type</Label>
              <Select value={formData.property_type} onValueChange={(v) => onChange('property_type', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="bungalow">Bungalow</SelectItem>
                  <SelectItem value="duplex">Duplex</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Property Address</Label>
              <Textarea className="flex-1" value={formData.property_address} onChange={(e) => onChange('property_address', e.target.value)} rows={2} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">BER Rating</Label>
              <Select value={formData.ber_rating} onValueChange={(v) => onChange('ber_rating', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A2">A2</SelectItem>
                  <SelectItem value="A3">A3</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="B3">B3</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                  <SelectItem value="C3">C3</SelectItem>
                  <SelectItem value="D1">D1</SelectItem>
                  <SelectItem value="D2">D2</SelectItem>
                  <SelectItem value="E1">E1</SelectItem>
                  <SelectItem value="E2">E2</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                  <SelectItem value="G">G</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Year Built</Label>
              <Input className="w-28" type="number" value={formData.year_built || ''} onChange={(e) => onChange('year_built', parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">New or Secondhand</Label>
              <Select value={formData.property_new_or_secondhand} onValueChange={(v) => onChange('property_new_or_secondhand', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="secondhand">Secondhand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-muted-foreground">Estimated Closing Date</Label>
              <Input className="flex-1" type="date" value={formData.estimated_closing_date} onChange={(e) => onChange('estimated_closing_date', e.target.value)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Security Tab
const SecurityTab = ({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-primary text-lg">Additional Security</h3>
        <p className="text-sm text-muted-foreground">Properties to use as security for this mortgage application</p>
        
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Lending Institution</TableHead>
              <TableHead>Market Value</TableHead>
              <TableHead>Current Loan Balance</TableHead>
              <TableHead>Monthly Repayment</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Type of Security</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <Input value={formData.security_lending_institution} onChange={(e) => onChange('security_lending_institution', e.target.value)} />
              </TableCell>
              <TableCell>
                <Input type="number" value={formData.security_market_value || ''} onChange={(e) => onChange('security_market_value', parseFloat(e.target.value) || 0)} />
              </TableCell>
              <TableCell>
                <Input type="number" value={formData.security_current_loan_balance || ''} onChange={(e) => onChange('security_current_loan_balance', parseFloat(e.target.value) || 0)} />
              </TableCell>
              <TableCell>
                <Input type="number" value={formData.security_monthly_repayment || ''} onChange={(e) => onChange('security_monthly_repayment', parseFloat(e.target.value) || 0)} />
              </TableCell>
              <TableCell>
                <Input value={formData.security_address} onChange={(e) => onChange('security_address', e.target.value)} />
              </TableCell>
              <TableCell>
                <Select value={formData.security_type} onValueChange={(v) => onChange('security_type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Alternative Lending Tab
const AlternativeTab = ({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-primary text-lg">Alternative Lending</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.has_other_mortgage} onCheckedChange={(v) => onChange('has_other_mortgage', v)} />
              <Label>Do you have any other mortgage or secured loans?</Label>
            </div>
            {formData.has_other_mortgage && (
              <Textarea placeholder="Please provide details..." value={formData.other_mortgage_details} onChange={(e) => onChange('other_mortgage_details', e.target.value)} />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.has_missed_repayments} onCheckedChange={(v) => onChange('has_missed_repayments', v)} />
              <Label>Have you ever missed any repayments on any loan, mortgage, credit card or HP agreement?</Label>
            </div>
            {formData.has_missed_repayments && (
              <Textarea placeholder="Please provide details..." value={formData.missed_repayments_details} onChange={(e) => onChange('missed_repayments_details', e.target.value)} />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.has_judgements} onCheckedChange={(v) => onChange('has_judgements', v)} />
              <Label>Have you ever had any County Court Judgements, bankruptcies or IVAs?</Label>
            </div>
            {formData.has_judgements && (
              <Textarea placeholder="Please provide details..." value={formData.judgements_details} onChange={(e) => onChange('judgements_details', e.target.value)} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Declarations Tab
const DeclarationsTab = ({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="font-bold text-primary text-lg">Declarations / Notes</h3>
        <p className="text-sm text-muted-foreground">Additional notes or declarations for your application</p>
        
        <div className="space-y-2">
          <Label>Notes (max 5000 characters)</Label>
          <Textarea 
            className="min-h-[200px]" 
            maxLength={5000}
            value={formData.broker_notes} 
            onChange={(e) => onChange('broker_notes', e.target.value)} 
            placeholder="Enter any additional information relevant to your application..."
          />
          <p className="text-xs text-muted-foreground text-right">{formData.broker_notes?.length || 0}/5000</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientApplicationTab;
