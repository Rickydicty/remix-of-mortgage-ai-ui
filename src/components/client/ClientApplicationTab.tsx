import { useState, useEffect, useRef, useCallback } from "react";
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
import { Save, Upload, FileText, FileCheck, Download, Home, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { ApplicationPDFDownload } from "@/components/client/ApplicationPDFDownload";
import { PropertyValuationSubmit } from "@/components/client/PropertyValuationSubmit";
import { cn } from "@/lib/utils";
import { DocumentUpload } from "@/components/DocumentUpload";
import { BatchDocumentUpload } from "@/components/BatchDocumentUpload";
import { SmartDocumentUpload } from "@/components/SmartDocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { AIPDocumentsList } from "@/components/client/AIPDocumentsList";
import { ESignaturesTab } from "@/components/client/ESignaturesTab";
import BrokerMessagesTab from "@/components/client/BrokerMessagesTab";
import { LoanOffersTab } from "@/components/client/LoanOffersTab";
import { format, addDays } from "date-fns";
import { emailTemplates } from "@/lib/emailTemplates";
import { 
  FormFieldFlags, 
  validateSecurityDetails,
  validateAlternativeDetails
} from "@/components/client/FormFieldFlags";
import NDICalculator from "@/components/broker/NDICalculator";

// Import staged form components
import { 
  BeforeAIPPersonalForm,
  BeforeAIPEmploymentForm,
  BeforeAIPBankForm,
  BeforeAIPMortgageForm,
  BeforeAIPPropertyForm
} from "@/components/client/forms/before-aip";

import {
  AfterAIPMortgageForm,
  AfterAIPPropertyForm
} from "@/components/client/forms/after-aip";

import {
  AfterOfferBankForm,
  AfterOfferDeclarationsForm
} from "@/components/client/forms/after-offer";

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
  app1_months_at_address: 0,
  app1_address_line1: '',
  app1_address_line2: '',
  app1_address_line3: '',
  app1_county: '',
  app1_country: 'Ireland',
  app1_residence_status: 'owner',
  app1_rent_amount: 0,
  app1_correspondence_same: true,
  app1_correspondence_address: '',
  app1_correspondence_line1: '',
  app1_correspondence_line2: '',
  app1_correspondence_line3: '',
  app1_correspondence_county: '',
  app1_correspondence_country: 'Ireland',
  app1_previous_address: '',
  app1_previous_line1: '',
  app1_previous_line2: '',
  app1_previous_line3: '',
  app1_previous_county: '',
  app1_previous_country: 'Ireland',
  app1_previous_years: 0,
  app1_previous_months: 0,
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
  app2_months_at_address: 0,
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
  app2_previous_months: 0,
  app2_home_phone: '',
  app2_work_phone: '',
  
  // Income & Employment - App 1
  app1_employment_status: 'employed',
  app1_employment_type: 'permanent',
  app1_gross_salary: 0,
  app1_overtime: 0,
  app1_bonuses: 0,
  app1_commissions: 0,
  app1_other_income: 0,
  app1_other_income_details: '',
  app1_lodger_income: 0,
  app1_residential_investment_income: 0,
  app1_net_monthly_income: 0,
  app1_occupation: '',
  app1_employer_name: '',
  app1_employer_line1: '',
  app1_employer_line2: '',
  app1_employer_line3: '',
  app1_employer_county: '',
  app1_employer_country: 'Ireland',
  app1_employer_phone: '',
  app1_nature_of_business: '',
  app1_years_with_employer: 0,
  app1_months_with_employer: 0,
  // Previous employment App 1
  app1_prev_employer_name: '',
  app1_prev_employer_line1: '',
  app1_prev_employer_county: '',
  app1_prev_occupation: '',
  app1_prev_years: 0,
  app1_prev_months: 0,
  // Self-employed App 1
  app1_se_company_name: '',
  app1_se_company_line1: '',
  app1_se_company_line2: '',
  app1_se_company_county: '',
  app1_se_company_country: 'Ireland',
  app1_se_nature_of_business: '',
  app1_se_years_established: 0,
  app1_se_time_involved_years: 0,
  app1_se_time_involved_months: 0,
  app1_se_average_profit: 0,
  app1_se_shareholding_percent: 0,
  app1_se_accountant_name: '',
  app1_se_accountant_firm: '',
  app1_se_accountant_line1: '',
  app1_se_accountant_county: '',
  app1_se_accountant_phone: '',
  app1_se_accountant_fax: '',
  app1_se_audited_accounts: false,
  app1_se_tax_affairs_uptodate: true,
  
  // Income & Employment - App 2 (similar fields)
  app2_employment_status: 'employed',
  app2_employment_type: 'permanent',
  app2_gross_salary: 0,
  app2_overtime: 0,
  app2_bonuses: 0,
  app2_commissions: 0,
  app2_other_income: 0,
  app2_other_income_details: '',
  app2_lodger_income: 0,
  app2_residential_investment_income: 0,
  app2_net_monthly_income: 0,
  app2_occupation: '',
  app2_employer_name: '',
  app2_employer_line1: '',
  app2_employer_county: '',
  app2_employer_phone: '',
  app2_nature_of_business: '',
  app2_years_with_employer: 0,
  app2_months_with_employer: 0,
  app2_se_company_name: '',
  app2_se_nature_of_business: '',
  app2_se_years_established: 0,
  app2_se_average_profit: 0,
  app2_se_shareholding_percent: 0,
  app2_se_accountant_name: '',
  app2_se_accountant_firm: '',
  app2_se_audited_accounts: false,
  app2_se_tax_affairs_uptodate: true,
  
  // Bank Details (Before AIP)
  bank_name: '',
  bank_line1: '',
  bank_line2: '',
  bank_line3: '',
  bank_county: '',
  bank_country: 'Ireland',
  bank_account_type: '',
  bank_account_number: '',
  bank_sort_code: '',
  bank_years_held: 0,
  bank_months_held: 0,
  
  // Savings Accounts
  savings_accounts: [],
  
  // Mortgage (Before AIP - Basic)
  customer_type: '',
  mortgage_purpose: '',
  first_time_buyer: false,
  max_approval_required: false,
  joint_title: true,
  property_value: 0,
  savings: 0,
  deposit_amount: 0,
  loan_amount: 0,
  repayment_method: 'repayment',
  mortgage_term: 25,
  rate_type: 'fixed',
  fixed_rate_years: 0,
  
  // Mortgage (After AIP - Additional)
  site_price: 0,
  grant_amount: 0,
  legal_stamp_duty: 0,
  gifts: 0,
  repairs_renovations: 0,
  other_funds: 0,
  other_costs: 0,
  is_scheme: '',
  remortgage_amount: 0,
  remortgage_property_value: 0,
  remortgage_ltv: 0,
  year_original_purchase: 0,
  current_mortgage_outstanding: 0,
  new_mortgage_required: 0,
  purpose_additional_borrowing: '',
  commencement_date: '',
  split_loan: false,
  split_first_amount: 0,
  split_second_amount: 0,
  split_first_term: 0,
  split_second_term: 0,
  split_first_rate_type: '',
  split_second_rate_type: '',
  interest_only_period: 0,
  
  // Property (Before AIP - Basic)
  property_address_line1: '',
  property_address_line2: '',
  property_address_line3: '',
  property_county: '',
  property_country: 'Ireland',
  property_type: '',
  property_estimated_value: 0,
  estimated_closing_date: '',
  property_num_living_rooms: 0,
  property_num_dining_rooms: 0,
  property_num_bedrooms: 0,
  property_num_bathrooms: 0,
  property_num_kitchens: 0,
  property_num_utility_rooms: 0,
  property_tenure: 'freehold',
  property_lease_years: 0,
  property_vacant_possession: true,
  year_built: 0,
  property_construction_type: '',
  property_private_owner_occupation: true,
  property_purpose: '',
  
  // Property (After AIP - Additional)
  property_new: false,
  property_floors: 0,
  homebuilders_bond: false,
  direct_labour: false,
  part_of_development: false,
  stage_payments_required: false,
  num_stage_payments: 0,
  fixed_price_contract: false,
  architect_supervision: false,
  hb47_available: false,
  people_over_18: [],
  selling_agent_name: '',
  selling_agent_phone: '',
  selling_agent_address: '',
  valuer_name: '',
  valuer_company: '',
  valuer_phone: '',
  valuer_address: '',
  valuation_contact_name: '',
  valuation_contact_phone: '',
  valuation_contact_address: '',
  architect_name: '',
  architect_phone: '',
  builder_name: '',
  builder_phone: '',
  
  // Bank (After Offer - Direct Debit)
  dd_bank_name: '',
  dd_account_names: '',
  dd_sort_code: '',
  dd_account_number: '',
  dd_debit_day: 1,
  dd_bank_line1: '',
  dd_bank_county: '',
  dd_bank_country: 'Ireland',
  
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
  consented_to_be_contacted: true,
  customer_address: '',
  date_signed: '',
  
  // Solicitor
  solicitor_name: '',
  solicitor_address: '',
  solicitor_phone: '',
  solicitor_email: '',
  
  // Notes
  broker_notes: '',
};

const ClientApplicationTab = ({ applicationId, application, brokerProfile, onRefresh }: ClientApplicationTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeStage, setActiveStage] = useState<'before_aip' | 'after_aip' | 'after_offer'>('before_aip');
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formDataId, setFormDataId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [eligibilityData, setEligibilityData] = useState<{
    score: number | null;
    employmentType: string | null;
  }>({ score: null, employmentType: null });

  // Stages with their tabs
  const stages = {
    before_aip: {
      label: "Before AIP",
      description: "Approval in Principle",
      tabs: [
        { id: "documents", label: "Documents" },
        { id: "personal", label: "Personal" },
        { id: "employment", label: "Employment & Income" },
        { id: "bank", label: "Bank" },
        { id: "mortgage", label: "Mortgage" },
        { id: "property", label: "Property" },
        { id: "calculator", label: "Calculator" },
        { id: "messages", label: "Broker Messages" },
      ]
    },
    after_aip: {
      label: "After AIP",
      description: "Offer Preparation",
      tabs: [
        { id: "mortgage_additional", label: "Mortgage (Additional)" },
        { id: "property_additional", label: "Property (Additional)" },
        { id: "valuation", label: "Valuation" },
      ]
    },
    after_offer: {
      label: "After Loan Offer",
      description: "Final Compliance",
      tabs: [
        { id: "direct_debit", label: "Direct Debit" },
        { id: "declarations", label: "Declarations & Consents" },
        { id: "signatures", label: "E-Signatures" },
      ]
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, applicationId]);

  // Auto-save: debounce 3 seconds after changes
  useEffect(() => {
    if (!hasUnsavedChanges || !user) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave().then(() => {
        setHasUnsavedChanges(false);
      });
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, hasUnsavedChanges]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Save before tab/stage switch
  const handleTabSwitch = (tabId: string) => {
    if (hasUnsavedChanges) {
      handleSave().then(() => setHasUnsavedChanges(false));
    }
    setActiveTab(tabId);
  };

  const handleStageSwitch = (stageKey: keyof typeof stages) => {
    if (hasUnsavedChanges) {
      handleSave().then(() => setHasUnsavedChanges(false));
    }
    setActiveStage(stageKey);
    setActiveTab(stages[stageKey].tabs[0].id);
  };

  const fetchData = async () => {
    if (!user) return;

    try {
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
            property_value: preElig.property_value || 0,
            deposit_amount: preElig.deposit_amount || 0,
            loan_amount: (preElig.property_value || 0) - (preElig.deposit_amount || 0),
            mortgage_term: preElig.desired_term || 25,
            first_time_buyer: preElig.first_time_buyer || false,
            app1_phone: preElig.phone || prev.app1_phone,
            app1_email: preElig.email || prev.app1_email,
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
    setHasUnsavedChanges(true);
  };

  // Calculate form completion percentage
  const calculateFormCompletion = (data: FormData): number => {
    const requiredFields = [
      // Personal - App 1
      'app1_forenames', 'app1_surname', 'app1_date_of_birth', 'app1_pps_number',
      'app1_phone', 'app1_email', 'app1_address_line1', 'app1_county',
      // Employment
      'app1_employment_status', 'app1_gross_salary', 'app1_employer_name',
      // Bank
      'bank_name', 'bank_account_number',
      // Mortgage
      'mortgage_purpose', 'property_value', 'loan_amount', 'mortgage_term',
      // Property
      'property_address_line1', 'property_type', 'property_county',
    ];

    let filledCount = 0;
    for (const field of requiredFields) {
      const value = data[field];
      if (value !== null && value !== undefined && value !== '' && value !== 0) {
        filledCount++;
      }
    }

    return Math.round((filledCount / requiredFields.length) * 100);
  };

  // Check and send progress email if needed (only once at ~50% threshold)
  const checkAndSendProgressEmail = async (completionPercent: number, savedFormDataId: string | null) => {
    // Only send if at 50% or more and we have a formDataId
    if (completionPercent >= 50 && savedFormDataId) {
      // Check if email already sent
      const { data: formRecord } = await supabase
        .from('application_form_data')
        .select('progress_email_sent')
        .eq('id', savedFormDataId)
        .single();

      if (formRecord?.progress_email_sent) {
        console.log('Progress email already sent, skipping');
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', user?.id)
          .single();

        if (profile?.email) {
          console.log('Sending form progress email to:', profile.email);
          await supabase.functions.invoke('send-notification', {
            body: {
              notification_type: 'form_progress',
              recipient_email: profile.email,
              subject: 'Great Progress on Your Mortgage Application!',
              html_content: emailTemplates.formProgress({
                clientName: profile.full_name || 'Valued Client',
                clientEmail: profile.email,
                completionPercent,
                dashboardUrl: `${window.location.origin}/login`,
              }),
            },
          });

          // Mark email as sent
          await supabase
            .from('application_form_data')
            .update({ progress_email_sent: true })
            .eq('id', savedFormDataId);

          console.log('Form progress email sent successfully');
        }
      } catch (error) {
        console.error('Failed to send progress email:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Fields that exist only in the UI form but NOT in the database table
      const uiOnlyFields = new Set([
        'app1_months_at_address',
        'app1_correspondence_line1', 'app1_correspondence_line2', 'app1_correspondence_line3',
        'app1_correspondence_county', 'app1_correspondence_country',
        'app1_previous_line1', 'app1_previous_line2', 'app1_previous_line3',
        'app1_previous_county', 'app1_previous_country', 'app1_previous_months',
        'app2_months_at_address', 'app2_previous_months',
        'app1_employer_line1', 'app1_employer_line2', 'app1_employer_line3',
        'app1_employer_county', 'app1_employer_country',
        'app1_prev_employer_name', 'app1_prev_employer_line1', 'app1_prev_employer_county',
        'app1_prev_occupation', 'app1_prev_years', 'app1_prev_months',
        'app1_se_company_line1', 'app1_se_company_line2', 'app1_se_company_county', 'app1_se_company_country',
        'app1_se_time_involved_years', 'app1_se_time_involved_months',
        'app1_se_accountant_line1', 'app1_se_accountant_county', 'app1_se_accountant_fax',
        'app2_employer_line1', 'app2_employer_county',
        'bank_line1', 'bank_line2', 'bank_line3', 'bank_county', 'bank_country', 'bank_months_held',
        'bank_accounts', 'bank_iban', 'bank_bic',
        'savings_accounts',
        'customer_type',
        'site_price', 'grant_amount', 'legal_stamp_duty', 'gifts', 'repairs_renovations',
        'other_funds', 'other_costs', 'is_scheme',
        'remortgage_amount', 'remortgage_property_value', 'remortgage_ltv',
        'year_original_purchase', 'current_mortgage_outstanding', 'new_mortgage_required',
        'purpose_additional_borrowing', 'commencement_date',
        'split_loan', 'split_first_amount', 'split_second_amount',
        'split_first_term', 'split_second_term', 'split_first_rate_type', 'split_second_rate_type',
        'interest_only_period',
        'property_num_utility_rooms', 'property_private_owner_occupation', 'property_purpose',
        'property_new', 'property_floors', 'homebuilders_bond', 'direct_labour',
        'part_of_development', 'stage_payments_required', 'num_stage_payments',
        'fixed_price_contract', 'architect_supervision', 'hb47_available',
        'people_over_18',
        'selling_agent_name', 'selling_agent_phone', 'selling_agent_address',
        'valuer_name', 'valuer_company', 'valuer_phone', 'valuer_address',
        'valuation_contact_name', 'valuation_contact_phone', 'valuation_contact_address',
        'architect_name', 'architect_phone', 'builder_name', 'builder_phone',
        'dd_bank_name', 'dd_account_names', 'dd_sort_code', 'dd_account_number',
        'dd_debit_day', 'dd_bank_line1', 'dd_bank_county', 'dd_bank_country',
        'consented_to_be_contacted', 'customer_address', 'date_signed',
      ]);

      // Filter out UI-only fields before saving to database
      const filteredFormData: Record<string, any> = {};
      for (const [key, value] of Object.entries(formData)) {
        if (!uiOnlyFields.has(key)) {
          filteredFormData[key] = value;
        }
      }

      const dataToSave = {
        user_id: user.id,
        application_id: applicationId || null,
        ...filteredFormData,
        app1_date_of_birth: formData.app1_date_of_birth || null,
        app2_date_of_birth: formData.app2_date_of_birth || null,
        estimated_closing_date: formData.estimated_closing_date || null,
      };

      let savedId = formDataId;

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
        savedId = data.id;
      }

      // Calculate completion and check for progress email
      const completionPercent = calculateFormCompletion(formData);
      await checkAndSendProgressEmail(completionPercent, savedId);

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

  // Navigation helpers
  const currentStageTabs = stages[activeStage].tabs;
  const currentTabIndex = currentStageTabs.findIndex(t => t.id === activeTab);

  const goToNextTab = () => {
    if (hasUnsavedChanges) {
      handleSave().then(() => setHasUnsavedChanges(false));
    }
    if (currentTabIndex < currentStageTabs.length - 1) {
      setActiveTab(currentStageTabs[currentTabIndex + 1].id);
    } else {
      const stageKeys = Object.keys(stages) as Array<keyof typeof stages>;
      const stageIndex = stageKeys.indexOf(activeStage);
      if (stageIndex < stageKeys.length - 1) {
        const nextStage = stageKeys[stageIndex + 1];
        setActiveStage(nextStage);
        setActiveTab(stages[nextStage].tabs[0].id);
      }
    }
  };

  const goToPrevTab = () => {
    if (hasUnsavedChanges) {
      handleSave().then(() => setHasUnsavedChanges(false));
    }
    if (currentTabIndex > 0) {
      setActiveTab(currentStageTabs[currentTabIndex - 1].id);
    } else {
      const stageKeys = Object.keys(stages) as Array<keyof typeof stages>;
      const stageIndex = stageKeys.indexOf(activeStage);
      if (stageIndex > 0) {
        const prevStage = stageKeys[stageIndex - 1];
        setActiveStage(prevStage);
        const prevStageTabs = stages[prevStage].tabs;
        setActiveTab(prevStageTabs[prevStageTabs.length - 1].id);
      }
    }
  };

  // Determine next step label
  const getNextLabel = () => {
    if (currentTabIndex < currentStageTabs.length - 1) {
      return `Next: ${currentStageTabs[currentTabIndex + 1].label}`;
    }
    const stageKeys = Object.keys(stages) as Array<keyof typeof stages>;
    const stageIndex = stageKeys.indexOf(activeStage);
    if (stageIndex < stageKeys.length - 1) {
      const nextStage = stageKeys[stageIndex + 1];
      return `Next: ${stages[nextStage].label}`;
    }
    return 'Complete';
  };

  const canSubmitForReview = () => {
    if (!application) return false;
    if (!(application.status === 'draft' || application.status === 'pending' || application.status === 'needs_documents')) return false;
    // Only show submit button if user has actually uploaded documents
    const hasFormData = formData && Object.keys(formData).some(key => {
      const val = formData[key as keyof typeof formData];
      return val !== null && val !== undefined && val !== '' && val !== false && val !== 0;
    });
    return hasFormData;
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

  const isFormTab = !['documents', 'valuation', 'signatures', 'messages', 'calculator'].includes(activeTab);

  return (
    <div className="space-y-4">
      {/* Stage Navigation */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(stages) as Array<keyof typeof stages>).map((stageKey) => (
          <button
            key={stageKey}
            onClick={() => handleStageSwitch(stageKey)}
            className={cn(
              "p-3 rounded-lg border text-center transition-all",
              activeStage === stageKey
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted border-border"
            )}
          >
            <div className="font-semibold text-sm">{stages[stageKey].label}</div>
            <div className={cn(
              "text-xs",
              activeStage === stageKey ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              {stages[stageKey].description}
            </div>
          </button>
        ))}
      </div>

      {/* Tab Navigation for Current Stage */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap">
          {currentStageTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-r border-b border-border transition-colors",
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

      {/* Save Button - only show for form tabs */}
      {isFormTab && (
        <div className="flex justify-between items-center bg-card border border-border rounded-lg p-3">
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={goToPrevTab} disabled={activeStage === 'before_aip' && currentTabIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button variant="outline" onClick={goToNextTab}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            {hasUnsavedChanges && (
              <span className="text-xs text-muted-foreground ml-2">Auto-saving in a moment...</span>
            )}
            {!hasUnsavedChanges && formDataId && (
              <span className="text-xs text-success ml-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                All changes saved
              </span>
            )}
          </div>
          <Button 
            onClick={() => { handleSave().then(() => setHasUnsavedChanges(false)); }} 
            disabled={saving}
            size="lg"
            className={cn(
              "shadow-lg font-semibold px-6",
              hasUnsavedChanges && "animate-pulse ring-2 ring-primary/50"
            )}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Now' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* ===== BEFORE AIP TABS ===== */}
      {activeStage === 'before_aip' && (
        <>
          {activeTab === "documents" && (
            <DocumentsTabContent 
              handleUploadComplete={handleUploadComplete}
              eligibilityData={eligibilityData}
              refreshTrigger={refreshTrigger}
              application={application}
              canSubmitForReview={canSubmitForReview}
              handleSubmitForReview={handleSubmitForReview}
              formData={formData}
            />
          )}
          {activeTab === "personal" && (
            <BeforeAIPPersonalForm formData={formData} onChange={handleInputChange} />
          )}
          {activeTab === "employment" && (
            <BeforeAIPEmploymentForm formData={formData} onChange={handleInputChange} />
          )}
          {activeTab === "bank" && (
            <BeforeAIPBankForm formData={formData} onChange={handleInputChange} />
          )}
          {activeTab === "mortgage" && (
            <BeforeAIPMortgageForm formData={formData} onChange={handleInputChange} />
          )}
          {activeTab === "property" && (
            <BeforeAIPPropertyForm formData={formData} onChange={handleInputChange} />
          )}
          {activeTab === "calculator" && (
            <NDICalculator />
          )}
          {activeTab === "messages" && (
            <BrokerMessagesTab 
              applicationId={applicationId}
              brokerId={application?.assigned_broker_id || null}
              brokerName={brokerProfile?.full_name}
            />
          )}
        </>
      )}

      {/* ===== AFTER AIP TABS ===== */}
      {activeStage === 'after_aip' && (
        <>
          {activeTab === "mortgage_additional" && (
            <AfterAIPMortgageForm formData={formData} onChange={handleInputChange} />
          )}
          {activeTab === "property_additional" && (
            <AfterAIPPropertyForm formData={formData} onChange={handleInputChange} />
          )}
          {activeTab === "valuation" && applicationId && (
            <PropertyValuationSubmit applicationId={applicationId} onSubmit={onRefresh} />
          )}
          {activeTab === "valuation" && !applicationId && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No application found. Please complete your application details first.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ===== AFTER OFFER TABS ===== */}
      {activeStage === 'after_offer' && (
        <>
          {activeTab === "direct_debit" && (
            <AfterOfferBankForm formData={formData} onChange={handleInputChange} />
          )}
          {activeTab === "declarations" && (
            <AfterOfferDeclarationsForm formData={formData} onChange={handleInputChange} />
          )}
          {activeTab === "signatures" && (
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
          )}
        </>
      )}

      {/* Navigation Footer - show on ALL tabs */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={goToPrevTab} disabled={activeStage === 'before_aip' && currentTabIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button onClick={goToNextTab} size="lg" className="shadow-md font-semibold px-6">
          {getNextLabel()}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

// Documents Tab Content Component
const DocumentsTabContent = ({ 
  handleUploadComplete, 
  eligibilityData, 
  refreshTrigger, 
  application, 
  canSubmitForReview, 
  handleSubmitForReview,
  formData,
}: {
  handleUploadComplete: () => void;
  eligibilityData: { score: number | null; employmentType: string | null };
  refreshTrigger: number;
  application: Application | null | undefined;
  canSubmitForReview: () => boolean;
  handleSubmitForReview: () => void;
  formData: FormData;
}) => (
  <div className="space-y-8">
    {/* Smart Upload - AI auto-detect */}
    <SmartDocumentUpload 
      onUploadComplete={handleUploadComplete} 
      employmentType={eligibilityData.employmentType}
    />
    
    {/* Manual Upload Options - always visible */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DocumentUpload onUploadComplete={handleUploadComplete} />
      <BatchDocumentUpload onUploadComplete={handleUploadComplete} />
    </div>
    
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

    {/* PDF Download */}
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Application Summary</h3>
            <p className="text-sm text-muted-foreground">Download a full PDF summary of your submitted application data.</p>
          </div>
          <ApplicationPDFDownload formData={formData} applicationNumber={application?.application_number || 'DRAFT'} />
        </div>
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
  </div>
);

export default ClientApplicationTab;
