import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FormFlag {
  id: string;
  type: "critical" | "warning" | "info";
  field: string;
  message: string;
}

interface FormFieldFlagsProps {
  flags: FormFlag[];
  className?: string;
}

export const FormFieldFlags = ({ flags, className }: FormFieldFlagsProps) => {
  if (flags.length === 0) return null;

  const getIcon = (type: FormFlag["type"]) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-primary" />;
    }
  };

  const getBadgeClass = (type: FormFlag["type"]) => {
    switch (type) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "warning":
        return "bg-warning/10 text-warning border-warning/20";
      case "info":
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const criticalFlags = flags.filter(f => f.type === "critical");
  const warningFlags = flags.filter(f => f.type === "warning");
  const infoFlags = flags.filter(f => f.type === "info");

  return (
    <div className={`rounded-lg border border-border bg-muted/30 p-4 space-y-2 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Form Validation</span>
        {criticalFlags.length > 0 && (
          <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">
            {criticalFlags.length} Required
          </Badge>
        )}
        {warningFlags.length > 0 && (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 text-xs">
            {warningFlags.length} Warnings
          </Badge>
        )}
        {criticalFlags.length === 0 && warningFlags.length === 0 && (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-xs">
            Complete
          </Badge>
        )}
      </div>
      
      {flags.map((flag) => (
        <div
          key={flag.id}
          className={`flex items-start gap-2 p-2 rounded-md border ${getBadgeClass(flag.type)}`}
        >
          {getIcon(flag.type)}
          <div className="flex-1 text-xs">
            <span className="font-medium">{flag.field}:</span>{" "}
            <span className="text-muted-foreground">{flag.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Validation functions for each section
export const validatePersonalDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];
  
  // Critical - Required fields
  if (!formData.app1_forenames?.trim()) {
    flags.push({ id: "app1_forenames", type: "critical", field: "Forenames", message: "Required for mortgage application" });
  }
  if (!formData.app1_surname?.trim()) {
    flags.push({ id: "app1_surname", type: "critical", field: "Surname", message: "Required for mortgage application" });
  }
  if (!formData.app1_date_of_birth) {
    flags.push({ id: "app1_dob", type: "critical", field: "Date of Birth", message: "Required for age verification" });
  }
  if (!formData.app1_pps_number?.trim()) {
    flags.push({ id: "app1_pps", type: "critical", field: "PPS Number", message: "Required for Irish mortgage applications" });
  }
  if (!formData.app1_address?.trim()) {
    flags.push({ id: "app1_address", type: "critical", field: "Address", message: "Current address is required" });
  }
  if (!formData.app1_phone?.trim()) {
    flags.push({ id: "app1_phone", type: "critical", field: "Phone", message: "Contact number is required" });
  }
  if (!formData.app1_email?.trim()) {
    flags.push({ id: "app1_email", type: "critical", field: "Email", message: "Email address is required" });
  }

  // Warnings - Recommended fields
  if (!formData.app1_title) {
    flags.push({ id: "app1_title", type: "warning", field: "Title", message: "Recommended for formal documents" });
  }
  if (!formData.app1_gender) {
    flags.push({ id: "app1_gender", type: "warning", field: "Gender", message: "May be required by some lenders" });
  }
  if (!formData.app1_marital_status) {
    flags.push({ id: "app1_marital", type: "warning", field: "Marital Status", message: "Affects application assessment" });
  }
  if (!formData.app1_nationality?.trim()) {
    flags.push({ id: "app1_nationality", type: "warning", field: "Nationality", message: "Required for residency verification" });
  }
  if (formData.app1_years_at_address !== undefined && formData.app1_years_at_address < 3) {
    flags.push({ id: "app1_years", type: "warning", field: "Years at Address", message: "Less than 3 years - previous address may be needed" });
  }

  // App2 validation if enabled
  if (formData.app2_enabled) {
    if (!formData.app2_forenames?.trim()) {
      flags.push({ id: "app2_forenames", type: "critical", field: "Applicant 2 Forenames", message: "Required when joint application" });
    }
    if (!formData.app2_surname?.trim()) {
      flags.push({ id: "app2_surname", type: "critical", field: "Applicant 2 Surname", message: "Required when joint application" });
    }
    if (!formData.app2_date_of_birth) {
      flags.push({ id: "app2_dob", type: "critical", field: "Applicant 2 Date of Birth", message: "Required for age verification" });
    }
    if (!formData.app2_pps_number?.trim()) {
      flags.push({ id: "app2_pps", type: "critical", field: "Applicant 2 PPS Number", message: "Required for Irish mortgage applications" });
    }
  }

  return flags;
};

export const validateIncomeDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];
  const status = formData.app1_employment_status || 'employed';
  const isEmployed = status === 'employed' || status === 'employed_and_self_employed';
  const isSelfEmployed = status === 'self_employed' || status === 'employed_and_self_employed';

  // Critical - Income required
  if (!formData.app1_gross_salary || formData.app1_gross_salary <= 0) {
    flags.push({ id: "app1_salary", type: "critical", field: "Gross Salary", message: "Primary income is required for affordability" });
  }

  // Employment details for employed
  if (isEmployed) {
    if (!formData.app1_occupation?.trim()) {
      flags.push({ id: "app1_occupation", type: "critical", field: "Occupation", message: "Job title/occupation is required" });
    }
    if (!formData.app1_employer_name?.trim()) {
      flags.push({ id: "app1_employer", type: "critical", field: "Employer Name", message: "Current employer name is required" });
    }
    if (!formData.app1_employer_address?.trim()) {
      flags.push({ id: "app1_employer_addr", type: "warning", field: "Employer Address", message: "Employer address recommended for verification" });
    }
    if (!formData.app1_years_with_employer && formData.app1_years_with_employer !== 0) {
      flags.push({ id: "app1_tenure", type: "warning", field: "Length of Service", message: "Employment tenure helps with assessment" });
    }
    if (formData.app1_years_with_employer !== undefined && formData.app1_years_with_employer < 1) {
      flags.push({ id: "app1_tenure_short", type: "warning", field: "Length of Service", message: "Less than 1 year - probation may affect approval" });
    }
  }

  // Self-employed details
  if (isSelfEmployed) {
    if (!formData.app1_se_company_name?.trim()) {
      flags.push({ id: "app1_se_company", type: "critical", field: "Company Name", message: "Business/company name is required" });
    }
    if (!formData.app1_se_nature_of_business?.trim()) {
      flags.push({ id: "app1_se_business", type: "critical", field: "Nature of Business", message: "Type of business activity is required" });
    }
    if (!formData.app1_se_years_established || formData.app1_se_years_established < 2) {
      flags.push({ id: "app1_se_years", type: "warning", field: "Years Established", message: "Most lenders require 2+ years trading history" });
    }
    if (!formData.app1_se_average_profit || formData.app1_se_average_profit <= 0) {
      flags.push({ id: "app1_se_profit", type: "critical", field: "Average Profit", message: "3-year average profit is required" });
    }
    if (!formData.app1_se_accountant_name?.trim()) {
      flags.push({ id: "app1_se_accountant", type: "warning", field: "Accountant Name", message: "Accountant details needed for verification" });
    }
    if (!formData.app1_se_audited_accounts) {
      flags.push({ id: "app1_se_audited", type: "warning", field: "Audited Accounts", message: "Audited accounts strengthen your application" });
    }
  }

  // Net income check
  if (!formData.app1_net_monthly_income || formData.app1_net_monthly_income <= 0) {
    flags.push({ id: "app1_net_income", type: "warning", field: "Net Monthly Income", message: "Net income helps with affordability calculation" });
  }

  // Variable income warnings
  if (formData.app1_overtime > formData.app1_gross_salary * 0.5) {
    flags.push({ id: "app1_overtime_high", type: "warning", field: "Overtime", message: "High overtime ratio - lenders may discount this" });
  }
  if (formData.app1_bonuses > formData.app1_gross_salary * 0.3) {
    flags.push({ id: "app1_bonus_high", type: "warning", field: "Bonuses", message: "High bonus ratio - 3 year average may be used" });
  }
  if (formData.app1_commissions > formData.app1_gross_salary * 0.5) {
    flags.push({ id: "app1_comm_high", type: "warning", field: "Commissions", message: "Commission-heavy income - additional docs needed" });
  }

  // App2 income if enabled
  if (formData.app2_enabled && !formData.app2_is_guarantor) {
    const status2 = formData.app2_employment_status || 'employed';
    const isEmployed2 = status2 === 'employed' || status2 === 'employed_and_self_employed';
    const isSelfEmployed2 = status2 === 'self_employed' || status2 === 'employed_and_self_employed';

    if (!formData.app2_gross_salary || formData.app2_gross_salary <= 0) {
      flags.push({ id: "app2_salary", type: "critical", field: "Applicant 2 Salary", message: "Joint applicant income required" });
    }
    if (isEmployed2 && !formData.app2_occupation?.trim()) {
      flags.push({ id: "app2_occupation", type: "critical", field: "Applicant 2 Occupation", message: "Joint applicant occupation required" });
    }
    if (isEmployed2 && !formData.app2_employer_name?.trim()) {
      flags.push({ id: "app2_employer", type: "critical", field: "Applicant 2 Employer", message: "Joint applicant employer required" });
    }
    if (isSelfEmployed2 && !formData.app2_se_company_name?.trim()) {
      flags.push({ id: "app2_se_company", type: "critical", field: "Applicant 2 Company", message: "Joint applicant business name required" });
    }
  }

  return flags;
};

export const validateFinancialDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];

  // Bank details - required
  if (!formData.bank_name?.trim()) {
    flags.push({ id: "bank_name", type: "critical", field: "Bank Name", message: "Primary bank account details required" });
  }
  if (!formData.bank_account_type) {
    flags.push({ id: "bank_type", type: "warning", field: "Account Type", message: "Account type helps with verification" });
  }

  // Credit history required
  if (!formData.credit_history) {
    flags.push({ id: "credit_history", type: "critical", field: "Credit History", message: "Credit rating assessment is required" });
  }

  // Warnings based on financial situation
  if (formData.credit_history === "poor") {
    flags.push({ id: "credit_poor", type: "warning", field: "Credit History", message: "Poor credit may require specialist lenders" });
  }
  if (formData.credit_history === "fair") {
    flags.push({ id: "credit_fair", type: "warning", field: "Credit History", message: "Fair credit - some lenders may require explanation" });
  }

  // CCJ and arrears checks
  if (formData.has_ccj && !formData.ccj_details?.trim()) {
    flags.push({ id: "ccj_details", type: "critical", field: "CCJ Details", message: "Please provide CCJ/default details" });
  }
  if (formData.has_arrears && !formData.arrears_details?.trim()) {
    flags.push({ id: "arrears_details", type: "critical", field: "Arrears Details", message: "Please provide arrears details" });
  }

  // Credit history questions - App1
  if (formData.app1_refused_mortgage && !formData.app1_refused_mortgage_details?.trim()) {
    flags.push({ id: "app1_refused", type: "critical", field: "Refused Mortgage Details", message: "Please explain previous mortgage refusal" });
  }
  if (formData.app1_court_order && !formData.app1_court_order_details?.trim()) {
    flags.push({ id: "app1_court", type: "critical", field: "Court Order Details", message: "Please provide court order details" });
  }
  if (formData.app1_bankruptcy && !formData.app1_bankruptcy_details?.trim()) {
    flags.push({ id: "app1_bankruptcy", type: "critical", field: "Bankruptcy Details", message: "Please provide bankruptcy/insolvency details" });
  }
  if (formData.app1_mortgage_arrears_24m && !formData.app1_mortgage_arrears_details?.trim()) {
    flags.push({ id: "app1_arrears_24m", type: "critical", field: "Mortgage Arrears Details", message: "Please explain mortgage arrears in last 24 months" });
  }

  // App2 credit history if enabled
  if (formData.app2_enabled) {
    if (formData.app2_refused_mortgage && !formData.app2_refused_mortgage_details?.trim()) {
      flags.push({ id: "app2_refused", type: "critical", field: "App 2 Refused Mortgage", message: "Please explain joint applicant mortgage refusal" });
    }
    if (formData.app2_bankruptcy && !formData.app2_bankruptcy_details?.trim()) {
      flags.push({ id: "app2_bankruptcy", type: "critical", field: "App 2 Bankruptcy", message: "Please provide joint applicant bankruptcy details" });
    }
  }

  // High debt warnings
  const totalDebt = (formData.existing_loans || 0) + (formData.credit_cards || 0);
  if (totalDebt > 10000) {
    flags.push({ id: "high_debt", type: "warning", field: "Total Debt", message: `€${totalDebt.toLocaleString()} debt may affect affordability` });
  }

  // Monthly commitments check
  if (formData.monthly_commitments > 0 && formData.app1_net_monthly_income > 0) {
    const commitmentRatio = formData.monthly_commitments / formData.app1_net_monthly_income;
    if (commitmentRatio > 0.4) {
      flags.push({ id: "high_commitments", type: "warning", field: "Monthly Commitments", message: "High commitment ratio may affect borrowing capacity" });
    }
  }

  // Low savings warning
  if (formData.savings !== undefined && formData.savings < 5000) {
    flags.push({ id: "low_savings", type: "warning", field: "Savings", message: "Low savings - closing costs typically €3-5k" });
  }

  return flags;
};

export const validateMortgageDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];

  // Mortgage purpose required
  if (!formData.mortgage_purpose) {
    flags.push({ id: "mortgage_purpose", type: "critical", field: "Mortgage Purpose", message: "Please select the purpose of this mortgage" });
  }

  // Critical fields
  if (!formData.property_value || formData.property_value <= 0) {
    flags.push({ id: "property_value", type: "critical", field: "Property Value", message: "Estimated property value is required" });
  }
  if (!formData.loan_amount || formData.loan_amount <= 0) {
    flags.push({ id: "loan_amount", type: "critical", field: "Loan Amount", message: "Required loan amount must be specified" });
  }
  if (!formData.deposit_amount || formData.deposit_amount <= 0) {
    flags.push({ id: "deposit_amount", type: "critical", field: "Deposit Amount", message: "Deposit amount is required" });
  }
  if (!formData.mortgage_term || formData.mortgage_term <= 0) {
    flags.push({ id: "mortgage_term", type: "critical", field: "Mortgage Term", message: "Please specify the mortgage term in years" });
  }

  // LTV calculation and warnings
  if (formData.property_value > 0 && formData.loan_amount > 0) {
    const ltv = (formData.loan_amount / formData.property_value) * 100;
    
    if (formData.first_time_buyer && ltv > 90) {
      flags.push({ id: "ltv_ftb", type: "warning", field: "LTV Ratio", message: `${ltv.toFixed(0)}% LTV exceeds FTB max of 90%` });
    } else if (!formData.first_time_buyer && ltv > 80) {
      flags.push({ id: "ltv_mover", type: "warning", field: "LTV Ratio", message: `${ltv.toFixed(0)}% LTV exceeds mover max of 80%` });
    }

    // Deposit check
    const requiredDeposit = formData.property_value - formData.loan_amount;
    if (formData.deposit_amount < requiredDeposit * 0.9) {
      flags.push({ id: "deposit_low", type: "warning", field: "Deposit", message: `Deposit may be insufficient (need ~€${requiredDeposit.toLocaleString()})` });
    }
  }

  // Term warnings
  if (formData.mortgage_term > 35) {
    flags.push({ id: "term_long", type: "warning", field: "Mortgage Term", message: "35 years is typical max term" });
  }
  if (formData.mortgage_term < 5) {
    flags.push({ id: "term_short", type: "warning", field: "Mortgage Term", message: "Very short term - consider affordability of higher repayments" });
  }

  // Rate type
  if (!formData.rate_type) {
    flags.push({ id: "rate_type", type: "warning", field: "Rate Type", message: "Please select preferred rate type" });
  }
  if (formData.rate_type === 'fixed' && !formData.fixed_rate_years) {
    flags.push({ id: "fixed_years", type: "warning", field: "Fixed Period", message: "Please specify fixed rate period" });
  }

  // Solicitor details
  if (!formData.solicitor_name?.trim()) {
    flags.push({ id: "solicitor_name", type: "warning", field: "Solicitor Name", message: "Solicitor details will be needed for conveyancing" });
  }

  return flags;
};

export const validatePropertyDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];

  // Critical - Address
  if (!formData.property_address_line1?.trim()) {
    flags.push({ id: "property_addr1", type: "critical", field: "Property Address", message: "Property address line 1 is required" });
  }
  if (!formData.property_county?.trim()) {
    flags.push({ id: "property_county", type: "critical", field: "Property County", message: "Property county is required" });
  }
  if (!formData.property_type) {
    flags.push({ id: "property_type", type: "critical", field: "Property Type", message: "Required for lender assessment" });
  }
  if (!formData.property_new_or_secondhand) {
    flags.push({ id: "property_new", type: "critical", field: "New/Secondhand", message: "Please specify if property is new or secondhand" });
  }

  // Property value
  if (!formData.property_estimated_value || formData.property_estimated_value <= 0) {
    flags.push({ id: "property_value", type: "warning", field: "Estimated Value", message: "Property valuation helps with assessment" });
  }

  // Room counts
  if (!formData.property_num_bedrooms || formData.property_num_bedrooms <= 0) {
    flags.push({ id: "property_beds", type: "warning", field: "Bedrooms", message: "Number of bedrooms helps with valuation" });
  }

  // BER Rating
  if (!formData.ber_rating) {
    flags.push({ id: "ber_rating", type: "warning", field: "BER Rating", message: "Required for green mortgage rates - can save you money" });
  }
  if (formData.ber_rating && ['F', 'G'].includes(formData.ber_rating)) {
    flags.push({ id: "ber_low", type: "warning", field: "BER Rating", message: "Low BER rating - consider energy upgrade options" });
  }

  // Year built warnings
  if (!formData.year_built) {
    flags.push({ id: "year_built", type: "warning", field: "Year Built", message: "Property age affects lender assessment" });
  }
  if (formData.year_built && formData.year_built < 1950) {
    flags.push({ id: "year_old", type: "warning", field: "Year Built", message: "Pre-1950 properties may need structural survey" });
  }

  // Tenure
  if (!formData.property_tenure) {
    flags.push({ id: "property_tenure", type: "warning", field: "Tenure", message: "Please specify freehold or leasehold" });
  }
  if (formData.property_tenure === 'leasehold' && (!formData.property_lease_years || formData.property_lease_years < 70)) {
    flags.push({ id: "lease_short", type: "warning", field: "Lease Years", message: "Short lease may affect mortgage options" });
  }

  return flags;
};

export const validateSecurityDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];

  // Only validate if security fields are being used
  if (formData.security_market_value > 0 || formData.security_address?.trim()) {
    if (!formData.security_type) {
      flags.push({ id: "security_type", type: "critical", field: "Security Type", message: "Please specify security type" });
    }
    if (!formData.security_address?.trim()) {
      flags.push({ id: "security_address", type: "critical", field: "Security Address", message: "Address of additional security required" });
    }
    if (!formData.security_market_value || formData.security_market_value <= 0) {
      flags.push({ id: "security_value", type: "critical", field: "Market Value", message: "Current market value required" });
    }
  }

  return flags;
};

export const validateAlternativeDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];

  if (formData.has_other_mortgage && !formData.other_mortgage_details?.trim()) {
    flags.push({ id: "other_mortgage", type: "critical", field: "Other Mortgage", message: "Please provide details of existing mortgage" });
  }
  if (formData.has_missed_repayments && !formData.missed_repayments_details?.trim()) {
    flags.push({ id: "missed_repay", type: "critical", field: "Missed Repayments", message: "Please explain missed repayment circumstances" });
  }
  if (formData.has_judgements && !formData.judgements_details?.trim()) {
    flags.push({ id: "judgements", type: "critical", field: "Judgements", message: "Please provide judgement details" });
  }

  // Warnings for alternative lending triggers
  if (formData.has_missed_repayments) {
    flags.push({ id: "alt_missed", type: "warning", field: "Credit History", message: "May require alternative/specialist lender" });
  }
  if (formData.has_judgements) {
    flags.push({ id: "alt_judge", type: "warning", field: "Credit History", message: "Judgements may limit lender options" });
  }

  return flags;
};

export const validateDeclarationsDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];

  // Critical - Required declarations
  if (!formData.declarations_signed) {
    flags.push({ id: "declarations_signed", type: "critical", field: "Declarations", message: "Declarations must be signed to proceed" });
  }
  if (!formData.consent_consumer_credit) {
    flags.push({ id: "consent_credit", type: "critical", field: "Consumer Credit Consent", message: "Consumer Credit Act consent is required" });
  }
  if (!formData.consent_data_protection) {
    flags.push({ id: "consent_data", type: "critical", field: "Data Protection Consent", message: "Data Protection consent is required" });
  }

  // Contact preferences - at least one method should be allowed
  const hasContactMethod = formData.consent_contact_home !== false || 
                           formData.consent_contact_work || 
                           formData.consent_email !== false || 
                           formData.consent_sms !== false;
  
  if (!hasContactMethod) {
    flags.push({ id: "no_contact", type: "warning", field: "Contact Preferences", message: "Please enable at least one contact method" });
  }

  return flags;
};
