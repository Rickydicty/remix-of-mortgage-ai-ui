// Document to Application Form Field Mapping
// Maps extracted data from approved documents to application_form_data fields

export interface ExtractedData {
  // Payslip/Employment fields - multiple field name variations
  income?: number;
  employer?: string;
  employerName?: string;
  employmentType?: string;
  grossPay?: number;
  netPay?: number;
  payPeriod?: string;
  startDate?: string;
  ppsNumber?: string;
  taxDeducted?: number;
  basicAnnualSalary?: number;
  declaredGrossSalary?: number;
  mostRecentGrossPay?: number;
  // Additional AI extraction variations
  annualSalaryGBP_estimated_at_40hr_week?: number;
  annualSalaryGBP_estimated_at_30hr_week?: number;
  monthlySalaryGBP?: number;
  hourlyRateGBP?: number;
  jobTitle?: string;
  employmentStartDate?: string;
  
  // Bank statement fields - with AI variations
  bankName?: string;
  bank?: string;
  avgBalance?: number;
  endingBalance?: number;
  currentBalance?: number;
  closingBalance?: number;
  accountType?: string;
  totalDeposits?: number;
  totalWithdrawals?: number;
  
  // ID fields - matching edge function extraction schema
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  dob?: string;
  nationality?: string;
  documentNumber?: string;
  idNumber?: string;
  idType?: string;
  expiryDate?: string;
  issueDate?: string;
  issuingAuthority?: string;
  isExpired?: boolean;
  gender?: string;
  sex?: string;
  
  // Address fields
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  eircode?: string;
  documentDate?: string;
  utilityProvider?: string;
  isRecent?: boolean;
  clientAddress?: string;
  clientName?: string;
  
  // Tax/Self-employed fields
  taxYear?: string;
  totalIncome?: number;
  taxPaid?: number;
  netProfit?: number;
  grossRevenue?: number;
  accountantSigned?: boolean;
  
  // Gift letter fields
  giftAmount?: number;
  donorName?: string;
  donorRelationship?: string;
  isSigned?: boolean;
  
  // Quality/Risk fields from AI analysis
  qualityIssues?: string[];
  riskFlags?: string[];
  flagSeverity?: 'high' | 'medium' | 'low';
  agentComment?: string;
  missingPages?: boolean;
  inconsistencies?: string[];
  
  // Allow any other fields AI might extract
  [key: string]: any;
}

export interface FormFieldMapping {
  formField: string;
  extractedField: string; // Changed to string to allow dynamic field access
  transform?: (value: any) => any;
  label: string;
}

// Mapping configuration for each document type - includes AI field variations
export const documentFieldMappings: Record<string, FormFieldMapping[]> = {
  payslips: [
    { formField: 'app1_gross_salary', extractedField: 'income', label: 'Gross Annual Salary' },
    { formField: 'app1_gross_salary', extractedField: 'basicAnnualSalary', label: 'Basic Annual Salary' },
    { formField: 'app1_gross_salary', extractedField: 'declaredGrossSalary', label: 'Declared Gross Salary' },
    { formField: 'app1_gross_salary', extractedField: 'grossPay', transform: (v) => v ? v * 12 : null, label: 'Gross Salary (monthly × 12)' },
    { formField: 'app1_gross_salary', extractedField: 'annualSalaryGBP_estimated_at_40hr_week', label: 'Annual Salary (40hr/week)' },
    { formField: 'app1_gross_salary', extractedField: 'annualSalaryGBP_estimated_at_30hr_week', label: 'Annual Salary (30hr/week)' },
    { formField: 'app1_gross_salary', extractedField: 'monthlySalaryGBP', transform: (v) => v ? v * 12 : null, label: 'Monthly Salary × 12' },
    { formField: 'app1_employer_name', extractedField: 'employer', label: 'Employer Name' },
    { formField: 'app1_employer_name', extractedField: 'employerName', label: 'Employer Name' },
    { formField: 'app1_employment_type', extractedField: 'employmentType', label: 'Employment Type' },
    { formField: 'app1_occupation', extractedField: 'jobTitle', label: 'Job Title/Occupation' },
    { formField: 'app1_net_monthly_income', extractedField: 'netPay', label: 'Net Monthly Income' },
    { formField: 'app1_pps_number', extractedField: 'ppsNumber', label: 'PPS Number' },
  ],
  salary_cert: [
    { formField: 'app1_gross_salary', extractedField: 'income', label: 'Gross Annual Salary' },
    { formField: 'app1_gross_salary', extractedField: 'basicAnnualSalary', label: 'Basic Annual Salary' },
    { formField: 'app1_gross_salary', extractedField: 'annualSalaryGBP_estimated_at_40hr_week', label: 'Annual Salary (40hr/week)' },
    { formField: 'app1_gross_salary', extractedField: 'monthlySalaryGBP', transform: (v) => v ? v * 12 : null, label: 'Monthly Salary × 12' },
    { formField: 'app1_employer_name', extractedField: 'employer', label: 'Employer Name' },
    { formField: 'app1_employer_name', extractedField: 'employerName', label: 'Employer Name' },
    { formField: 'app1_employment_type', extractedField: 'employmentType', label: 'Employment Type' },
    { formField: 'app1_occupation', extractedField: 'jobTitle', label: 'Job Title/Occupation' },
  ],
  employment_summary: [
    { formField: 'app1_gross_salary', extractedField: 'income', label: 'Gross Annual Income' },
    { formField: 'app1_gross_salary', extractedField: 'totalIncome', label: 'Total Income' },
    { formField: 'app1_gross_salary', extractedField: 'basicAnnualSalary', label: 'Basic Annual Salary' },
    { formField: 'app1_gross_salary', extractedField: 'annualSalaryGBP_estimated_at_40hr_week', label: 'Annual Salary (40hr/week)' },
    { formField: 'app1_gross_salary', extractedField: 'monthlySalaryGBP', transform: (v) => v ? v * 12 : null, label: 'Monthly Salary × 12' },
    { formField: 'app1_employer_name', extractedField: 'employer', label: 'Employer Name' },
    { formField: 'app1_employer_name', extractedField: 'employerName', label: 'Employer Name' },
    { formField: 'app1_occupation', extractedField: 'jobTitle', label: 'Job Title/Occupation' },
    { formField: 'app1_pps_number', extractedField: 'ppsNumber', label: 'PPS Number' },
  ],
  certified_id: [
    { formField: 'app1_forenames', extractedField: 'fullName', transform: (v) => v?.split(' ').slice(0, -1).join(' ') || v, label: 'First Name(s)' },
    { formField: 'app1_forenames', extractedField: 'name', transform: (v) => v?.split(' ').slice(0, -1).join(' ') || v, label: 'First Name(s)' },
    { formField: 'app1_forenames', extractedField: 'firstName', label: 'First Name' },
    { formField: 'app1_surname', extractedField: 'fullName', transform: (v) => v?.split(' ').slice(-1)[0], label: 'Surname' },
    { formField: 'app1_surname', extractedField: 'name', transform: (v) => v?.split(' ').slice(-1)[0], label: 'Surname' },
    { formField: 'app1_surname', extractedField: 'lastName', label: 'Surname' },
    { formField: 'app1_date_of_birth', extractedField: 'dateOfBirth', label: 'Date of Birth' },
    { formField: 'app1_date_of_birth', extractedField: 'dob', label: 'Date of Birth' },
    { formField: 'app1_nationality', extractedField: 'nationality', label: 'Nationality' },
    { formField: 'app1_gender', extractedField: 'gender', label: 'Gender' },
    { formField: 'app1_gender', extractedField: 'sex', label: 'Gender' },
  ],
  proof_of_address: [
    { formField: 'app1_address_line1', extractedField: 'addressLine1', label: 'Address Line 1' },
    { formField: 'app1_address_line2', extractedField: 'addressLine2', label: 'Address Line 2' },
    { formField: 'app1_address', extractedField: 'address', label: 'Full Address' },
    { formField: 'app1_address', extractedField: 'clientAddress', label: 'Client Address' },
    { formField: 'app1_county', extractedField: 'county', label: 'County' },
    { formField: 'app1_address_line3', extractedField: 'city', label: 'City' },
  ],
  current_account_statements: [
    { formField: 'bank_name', extractedField: 'bankName', label: 'Bank Name' },
    { formField: 'bank_name', extractedField: 'bank', label: 'Bank Name' },
    { formField: 'savings', extractedField: 'endingBalance', label: 'Account Balance' },
    { formField: 'savings', extractedField: 'closingBalance', label: 'Closing Balance' },
  ],
  savings_account_statements: [
    { formField: 'savings', extractedField: 'avgBalance', label: 'Savings Balance' },
    { formField: 'savings', extractedField: 'endingBalance', label: 'Savings Balance' },
    { formField: 'savings', extractedField: 'currentBalance', label: 'Current Balance' },
    { formField: 'bank_name', extractedField: 'bankName', label: 'Bank Name' },
    { formField: 'bank_name', extractedField: 'bank', label: 'Bank Name' },
  ],
  form_11: [
    { formField: 'app1_se_average_profit', extractedField: 'netProfit', label: 'Net Profit' },
    { formField: 'app1_gross_salary', extractedField: 'totalIncome', label: 'Total Income' },
    { formField: 'app1_pps_number', extractedField: 'ppsNumber', label: 'PPS Number' },
  ],
  self_employed_docs: [
    { formField: 'app1_se_average_profit', extractedField: 'netProfit', label: 'Net Profit' },
    { formField: 'app1_gross_salary', extractedField: 'grossRevenue', label: 'Gross Revenue' },
  ],
  tax_clearance: [
    { formField: 'app1_pps_number', extractedField: 'ppsNumber', label: 'PPS Number' },
  ],
  gift_letter: [
    { formField: 'deposit_amount', extractedField: 'giftAmount', label: 'Gift Amount' },
  ],
};

export interface MappedField {
  formField: string;
  value: any;
  label: string;
  currentValue?: any;
  hasConflict: boolean;
}

/**
 * Get mappable fields from extracted document data
 */
export function getMappableFields(
  documentType: string, 
  extractedData: ExtractedData,
  currentFormData?: Record<string, any>
): MappedField[] {
  const mappings = documentFieldMappings[documentType] || [];
  const result: MappedField[] = [];
  const seenFields = new Set<string>();

  for (const mapping of mappings) {
    // Skip if we've already mapped this form field
    if (seenFields.has(mapping.formField)) continue;

    const rawValue = extractedData[mapping.extractedField];
    if (rawValue === undefined || rawValue === null) continue;

    const value = mapping.transform ? mapping.transform(rawValue) : rawValue;
    if (value === undefined || value === null || value === '') continue;

    const currentValue = currentFormData?.[mapping.formField];
    const hasConflict = currentValue !== undefined && 
                        currentValue !== null && 
                        currentValue !== '' && 
                        currentValue !== 0 &&
                        currentValue !== value;

    result.push({
      formField: mapping.formField,
      value,
      label: mapping.label,
      currentValue,
      hasConflict,
    });

    seenFields.add(mapping.formField);
  }

  return result;
}

/**
 * Apply mapped fields to form data
 */
export function applyMappedFields(
  currentFormData: Record<string, any>,
  mappedFields: MappedField[],
  overwriteConflicts: boolean = false
): Record<string, any> {
  const updatedData = { ...currentFormData };

  for (const field of mappedFields) {
    if (!field.hasConflict || overwriteConflicts) {
      updatedData[field.formField] = field.value;
    }
  }

  return updatedData;
}

/**
 * Format field value for display
 */
export function formatFieldValue(value: any): string {
  if (value === undefined || value === null) return 'N/A';
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-IE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  }
  return String(value);
}
