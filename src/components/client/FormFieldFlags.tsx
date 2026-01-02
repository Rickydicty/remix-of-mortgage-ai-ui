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
        <span className="text-sm font-medium">AI Form Validation</span>
        {criticalFlags.length > 0 && (
          <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">
            {criticalFlags.length} Required
          </Badge>
        )}
        {warningFlags.length > 0 && (
          <Badge variant="outline" className="bg-warning/10 text-warning text-xs">
            {warningFlags.length} Warnings
          </Badge>
        )}
        {criticalFlags.length === 0 && warningFlags.length === 0 && (
          <Badge variant="outline" className="bg-success/10 text-success text-xs">
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

  // Critical - Income required
  if (!formData.app1_gross_salary || formData.app1_gross_salary <= 0) {
    flags.push({ id: "app1_salary", type: "critical", field: "Gross Salary", message: "Primary income is required for affordability" });
  }

  // Warnings - Validation checks
  if (formData.app1_gross_salary > 0 && formData.app1_gross_salary < 30000) {
    flags.push({ id: "app1_salary_low", type: "warning", field: "Gross Salary", message: "Income may limit borrowing capacity (€30k+ typical)" });
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
    if (!formData.app2_gross_salary || formData.app2_gross_salary <= 0) {
      flags.push({ id: "app2_salary", type: "critical", field: "Applicant 2 Salary", message: "Joint applicant income required" });
    }
  }

  return flags;
};

export const validateFinancialDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];

  // Credit history required
  if (!formData.credit_history) {
    flags.push({ id: "credit_history", type: "critical", field: "Credit History", message: "Credit rating assessment is required" });
  }

  // Warnings based on financial situation
  if (formData.credit_history === "poor") {
    flags.push({ id: "credit_poor", type: "warning", field: "Credit History", message: "Poor credit may require specialist lenders" });
  }
  if (formData.has_ccj && !formData.ccj_details?.trim()) {
    flags.push({ id: "ccj_details", type: "critical", field: "CCJ Details", message: "Please provide CCJ/default details" });
  }
  if (formData.has_arrears && !formData.arrears_details?.trim()) {
    flags.push({ id: "arrears_details", type: "critical", field: "Arrears Details", message: "Please provide arrears details" });
  }

  // High debt warnings
  const totalDebt = (formData.existing_loans || 0) + (formData.credit_cards || 0);
  if (totalDebt > 10000) {
    flags.push({ id: "high_debt", type: "warning", field: "Total Debt", message: `€${totalDebt.toLocaleString()} debt may affect affordability` });
  }

  // Low savings warning
  if (formData.savings !== undefined && formData.savings < 5000) {
    flags.push({ id: "low_savings", type: "warning", field: "Savings", message: "Low savings - closing costs typically €3-5k" });
  }

  return flags;
};

export const validateMortgageDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];

  // Critical fields
  if (!formData.property_value || formData.property_value <= 0) {
    flags.push({ id: "property_value", type: "critical", field: "Property Value", message: "Estimated property value is required" });
  }
  if (!formData.loan_amount || formData.loan_amount <= 0) {
    flags.push({ id: "loan_amount", type: "critical", field: "Loan Amount", message: "Required loan amount must be specified" });
  }
  if (!formData.mortgage_type) {
    flags.push({ id: "mortgage_type", type: "critical", field: "Mortgage Type", message: "Please select mortgage type" });
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

  return flags;
};

export const validatePropertyDetails = (formData: any): FormFlag[] => {
  const flags: FormFlag[] = [];

  // Critical
  if (!formData.property_type) {
    flags.push({ id: "property_type", type: "critical", field: "Property Type", message: "Required for lender assessment" });
  }
  if (!formData.property_address?.trim()) {
    flags.push({ id: "property_address", type: "critical", field: "Property Address", message: "Full property address is required" });
  }

  // Warnings
  if (!formData.ber_rating) {
    flags.push({ id: "ber_rating", type: "warning", field: "BER Rating", message: "Required for green mortgage rates" });
  }
  if (!formData.property_new_or_secondhand) {
    flags.push({ id: "property_new", type: "warning", field: "New/Secondhand", message: "Affects Help to Buy eligibility" });
  }
  if (formData.year_built && formData.year_built < 1950) {
    flags.push({ id: "year_old", type: "warning", field: "Year Built", message: "Pre-1950 properties may need structural survey" });
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
