import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Upload, FileText, MessageSquare, FileCheck, Download, Home } from "lucide-react";
import { PropertyValuationSubmit } from "@/components/client/PropertyValuationSubmit";
import { cn } from "@/lib/utils";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import ClientMessaging from "@/components/broker/ClientMessaging";
import AIAssistantChat from "@/components/client/AIAssistantChat";
import AgentChat from "@/components/client/AgentChat";
import { AIPDocumentsList } from "@/components/client/AIPDocumentsList";
import { ESignaturesTab } from "@/components/client/ESignaturesTab";
import { LoanOffersTab } from "@/components/client/LoanOffersTab";
import { format, addDays } from "date-fns";
import { 
  FormFieldFlags, 
  validateSecurityDetails,
  validateAlternativeDetails
} from "@/components/client/FormFieldFlags";
import {
  PersonalDetailsForm,
  IncomeEmploymentForm,
  FinancialCreditForm,
  MortgageDetailsForm,
  PropertyDetailsForm,
  DeclarationsForm
} from "@/components/client/forms";

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

// Extended FormData interface to include all BI form fields
interface FormData {
  [key: string]: any;
}

const defaultFormData: FormData = {
  // Personal - App 1
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
  app1_address_line1: '',
  app1_address_line2: '',
  app1_address_line3: '',
  app1_county: '',
  app1_country: 'Ireland',
  app1_residence_status: 'owner',
  app1_rent_amount: 0,
  app1_correspondence_same: true,
  app1_correspondence_address: '',
  app1_previous_address: '',
  app1_previous_years: 0,
  app1_home_phone: '',
  app1_work_phone: '',
  
  // Personal - App 2
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
  app2_address_line1: '',
  app2_address_line2: '',
  app2_address_line3: '',
  app2_county: '',
  app2_country: 'Ireland',
  app2_residence_status: 'owner',
  app2_rent_amount: 0,
  app2_correspondence_same: true,
  app2_correspondence_address: '',
  app2_previous_address: '',
  app2_previous_years: 0,
  app2_home_phone: '',
  app2_work_phone: '',
  
  // Income & Employment - App 1
  app1_employment_status: 'employed',
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
  app1_net_monthly_income: 0,
  app1_occupation: '',
  app1_employer_name: '',
  app1_employer_address: '',
  app1_employer_phone: '',
  app1_nature_of_business: '',
  app1_employment_type: 'permanent',
  app1_years_with_employer: 0,
  app1_months_with_employer: 0,
  // Self-employed App 1
  app1_se_company_name: '',
  app1_se_company_address: '',
  app1_se_nature_of_business: '',
  app1_se_years_established: 0,
  app1_se_average_profit: 0,
  app1_se_shareholding_percent: 0,
  app1_se_accountant_name: '',
  app1_se_accountant_firm: '',
  app1_se_accountant_address: '',
  app1_se_accountant_phone: '',
  app1_se_audited_accounts: false,
  app1_se_tax_affairs_uptodate: true,
  
  // Income & Employment - App 2
  app2_employment_status: 'employed',
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
  app2_net_monthly_income: 0,
  app2_occupation: '',
  app2_employer_name: '',
  app2_employer_address: '',
  app2_employer_phone: '',
  app2_nature_of_business: '',
  app2_employment_type: 'permanent',
  app2_years_with_employer: 0,
  app2_months_with_employer: 0,
  // Self-employed App 2
  app2_se_company_name: '',
  app2_se_company_address: '',
  app2_se_nature_of_business: '',
  app2_se_years_established: 0,
  app2_se_average_profit: 0,
  app2_se_shareholding_percent: 0,
  app2_se_accountant_name: '',
  app2_se_accountant_firm: '',
  app2_se_accountant_address: '',
  app2_se_accountant_phone: '',
  app2_se_audited_accounts: false,
  app2_se_tax_affairs_uptodate: true,
  
  // Bank Details
  bank_name: '',
  bank_address: '',
  bank_address_line1: '',
  bank_address_line2: '',
  bank_county: '',
  bank_country: 'Ireland',
  bank_account_type: '',
  bank_account_number: '',
  bank_sort_code: '',
  bank_years_held: 0,
  
  // Financial
  monthly_commitments: 0,
  existing_loans: 0,
  credit_cards: 0,
  savings: 0,
  credit_history: '',
  has_ccj: false,
  ccj_details: '',
  has_arrears: false,
  arrears_details: '',
  
  // Credit History Questions
  app1_refused_mortgage: false,
  app1_refused_mortgage_details: '',
  app1_court_order: false,
  app1_court_order_details: '',
  app1_bankruptcy: false,
  app1_bankruptcy_details: '',
  app1_mortgage_arrears_24m: false,
  app1_mortgage_arrears_details: '',
  app2_refused_mortgage: false,
  app2_refused_mortgage_details: '',
  app2_court_order: false,
  app2_court_order_details: '',
  app2_bankruptcy: false,
  app2_bankruptcy_details: '',
  app2_mortgage_arrears_24m: false,
  app2_mortgage_arrears_details: '',
  
  // Mortgage
  mortgage_purpose: '',
  property_value: 0,
  deposit_amount: 0,
  loan_amount: 0,
  mortgage_term: 25,
  mortgage_type: '',
  repayment_method: 'repayment',
  rate_type: 'fixed',
  fixed_rate_years: 0,
  first_time_buyer: false,
  help_to_buy: false,
  max_approval_required: false,
  joint_title: true,
  
  // Solicitor
  solicitor_name: '',
  solicitor_address: '',
  solicitor_address_line1: '',
  solicitor_address_line2: '',
  solicitor_address_line3: '',
  solicitor_county: '',
  solicitor_phone: '',
  solicitor_email: '',
  
  // Property
  property_type: '',
  property_address: '',
  property_address_line1: '',
  property_address_line2: '',
  property_address_line3: '',
  property_county: '',
  property_country: 'Ireland',
  ber_rating: '',
  year_built: 0,
  property_new_or_secondhand: '',
  estimated_closing_date: '',
  property_estimated_value: 0,
  property_num_living_rooms: 0,
  property_num_dining_rooms: 0,
  property_num_bedrooms: 0,
  property_num_bathrooms: 0,
  property_num_kitchens: 0,
  property_tenure: 'freehold',
  property_lease_years: 0,
  property_vacant_possession: true,
  property_construction_type: '',
  
  // Alternative Lending
  has_other_mortgage: false,
  other_mortgage_details: '',
  has_missed_repayments: false,
  missed_repayments_details: '',
  has_judgements: false,
  judgements_details: '',
  
  // Additional Security
  security_lending_institution: '',
  security_market_value: 0,
  security_current_loan_balance: 0,
  security_monthly_repayment: 0,
  security_address: '',
  security_type: '',
  
  // Declarations
  declarations_signed: false,
  consent_consumer_credit: false,
  consent_data_protection: false,
  consent_contact_home: true,
  consent_contact_work: false,
  consent_leave_message: true,
  consent_contact_employer: false,
  consent_email: true,
  consent_sms: true,
  
  // Notes
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
  const [eligibilityData, setEligibilityData] = useState<{
    score: number | null;
    employmentType: string | null;
  }>({ score: null, employmentType: null });

  // All tabs now in a single row - stacked evenly
  const allTabs = [
    { id: "documents", label: "Documents" },
    { id: "personal", label: "Personal Details" },
    { id: "income", label: "Income & Employment" },
    { id: "financial", label: "Financial & Credit" },
    { id: "mortgage", label: "Mortgage Details" },
    { id: "property", label: "Property Details" },
    { id: "valuation", label: "Property Valuation" },
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
          setEligibilityData({
            score: preElig.eligibility_score,
            employmentType: preElig.employment_type,
          });
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
            // Set employment status based on pre-eligibility
            app1_employment_status: preElig.employment_type === 'self_employed' ? 'self_employed' : 'employed',
          }));
        }
      }

      // Always fetch eligibility data for display purposes
      if (!eligibilityData.employmentType) {
        const { data: preEligCheck } = await supabase
          .from('pre_eligibility_data')
          .select('eligibility_score, employment_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (preEligCheck) {
          setEligibilityData({
            score: preEligCheck.eligibility_score,
            employmentType: preEligCheck.employment_type,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
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

      {/* Tab Navigation - Single Row with Even Spacing */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
          {allTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2 py-3 text-xs font-medium border-r border-b border-border transition-colors text-center",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 hover:bg-muted text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="space-y-8">
          <DocumentUpload onUploadComplete={handleUploadComplete} />
          <DocumentList refreshTrigger={refreshTrigger} employmentType={eligibilityData.employmentType} />

          {/* AIP Letter Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Agreement in Principle (AIP) Letter
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
                <div className="text-center py-8">
                  <div className="inline-flex p-3 bg-muted rounded-full mb-3">
                    <FileCheck className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">AIP Letter Not Yet Issued</h3>
                  <p className="text-sm text-muted-foreground">
                    Once approved, your AIP letter will be available here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AIP Documents Section */}
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

          {/* Loan Offers Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Loan Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LoanOffersTab applicationId={application?.id || null} />
            </CardContent>
          </Card>

          {/* E-Signatures Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                E-Signatures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ESignaturesTab 
                application={application || null} 
                onSignatureComplete={onRefresh || (() => {})}
              />
            </CardContent>
          </Card>

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

          {/* AI Broker Agent Chat */}
          {application?.id && (
            <AgentChat applicationId={application.id} />
          )}

          {/* AI Assistant Chat */}
          <AIAssistantChat 
            onEscalate={() => {
              const messagingSection = document.querySelector('[data-broker-messaging]');
              messagingSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Messages with Broker */}
          {application?.assigned_broker_id ? (
            <div data-broker-messaging>
              <ClientMessaging 
                clientId={application.assigned_broker_id} 
                clientName={brokerProfile?.full_name || brokerProfile?.email || 'Broker'} 
                applicationId={application.id}
              />
            </div>
          ) : (
            <Card data-broker-messaging>
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

      {/* Form Tabs Content - Using new form components */}
      {activeTab === "personal" && <PersonalDetailsForm formData={formData} onChange={handleInputChange} />}
      {activeTab === "income" && <IncomeEmploymentForm formData={formData} onChange={handleInputChange} />}
      {activeTab === "financial" && <FinancialCreditForm formData={formData} onChange={handleInputChange} />}
      {activeTab === "mortgage" && <MortgageDetailsForm formData={formData} onChange={handleInputChange} />}
      {activeTab === "property" && <PropertyDetailsForm formData={formData} onChange={handleInputChange} />}
      {activeTab === "valuation" && applicationId && (
        <PropertyValuationSubmit applicationId={applicationId} onSubmit={onRefresh} />
      )}
      {activeTab === "valuation" && !applicationId && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No application found. Please complete your application details first.</p>
              {eligibilityData.score && (
                <p className="mt-2 text-sm">Your eligibility score: <span className="font-semibold text-primary">{eligibilityData.score}%</span></p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {activeTab === "security" && <SecurityTab formData={formData} onChange={handleInputChange} />}
      {activeTab === "alternative" && <AlternativeTab formData={formData} onChange={handleInputChange} />}
      {activeTab === "declarations" && <DeclarationsForm formData={formData} onChange={handleInputChange} />}
    </div>
  );
};

// Security Tab
const SecurityTab = ({ formData, onChange }: { formData: FormData; onChange: (field: string, value: any) => void }) => {
  const flags = validateSecurityDetails(formData);
  
  return (
    <div className="space-y-4">
      <FormFieldFlags flags={flags} />
      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="font-bold text-lg">Additional Security</h3>
          <p className="text-sm text-muted-foreground">Complete this section if you are offering additional security for the mortgage.</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Security Type</Label>
                <Select value={formData.security_type || ''} onValueChange={(v) => onChange('security_type', v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="investments">Investments</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Lending Institution</Label>
                <Input className="flex-1" value={formData.security_lending_institution || ''} onChange={(e) => onChange('security_lending_institution', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Market Value</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.security_market_value || ''} onChange={(e) => onChange('security_market_value', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Current Loan Balance</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.security_current_loan_balance || ''} onChange={(e) => onChange('security_current_loan_balance', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Monthly Repayment</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.security_monthly_repayment || ''} onChange={(e) => onChange('security_monthly_repayment', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-muted-foreground">Security Address</Label>
                <Textarea className="flex-1" value={formData.security_address || ''} onChange={(e) => onChange('security_address', e.target.value)} rows={2} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Alternative Lending Tab
const AlternativeTab = ({ formData, onChange }: { formData: FormData; onChange: (field: string, value: any) => void }) => {
  const flags = validateAlternativeDetails(formData);
  
  return (
    <div className="space-y-4">
      <FormFieldFlags flags={flags} />
      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="font-bold text-lg">Section F – Alternative Lending</h3>
          <p className="text-sm text-muted-foreground">Complete this section if alternative lending is sought.</p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox checked={formData.has_other_mortgage || false} onCheckedChange={(v) => onChange('has_other_mortgage', v)} />
              <div className="flex-1">
                <Label className="text-sm">Have you had a mortgage on any other property other than previously detailed?</Label>
                {formData.has_other_mortgage && (
                  <Textarea className="mt-2" placeholder="Please give details..." value={formData.other_mortgage_details || ''} onChange={(e) => onChange('other_mortgage_details', e.target.value)} />
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox checked={formData.has_missed_repayments || false} onCheckedChange={(v) => onChange('has_missed_repayments', v)} />
              <div className="flex-1">
                <Label className="text-sm">Have there ever been any missed repayments or revoked credit cards or judgements?</Label>
                {formData.has_missed_repayments && (
                  <Textarea className="mt-2" placeholder="Please specify..." value={formData.missed_repayments_details || ''} onChange={(e) => onChange('missed_repayments_details', e.target.value)} />
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox checked={formData.has_judgements || false} onCheckedChange={(v) => onChange('has_judgements', v)} />
              <div className="flex-1">
                <Label className="text-sm">Have any judgement proceedings relating to debt ever been brought against you or any judgements made against you?</Label>
                {formData.has_judgements && (
                  <Textarea className="mt-2" placeholder="Please provide details..." value={formData.judgements_details || ''} onChange={(e) => onChange('judgements_details', e.target.value)} />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientApplicationTab;
