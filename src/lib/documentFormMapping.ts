// Document to Application Form Field Mapping
// Maps extracted data from approved documents to application_form_data fields

export interface ExtractedData {
  // Payslip/Employment fields
  income?: number;
  employer?: string;
  employerName?: string;
  employmentType?: string;
  grossPay?: number;
  netPay?: number;
  payPeriod?: string;
  startDate?: string;
  ppsNumber?: string;
  
  // Bank statement fields
  bankName?: string;
  avgBalance?: number;
  accountType?: string;
  
  // ID fields
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  
  // Address fields
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  eircode?: string;
  
  // Tax/Self-employed fields
  taxYear?: string;
  totalIncome?: number;
  netProfit?: number;
  grossRevenue?: number;
}

export interface FormFieldMapping {
  formField: string;
  extractedField: keyof ExtractedData;
  transform?: (value: any) => any;
  label: string;
}

// Mapping configuration for each document type
export const documentFieldMappings: Record<string, FormFieldMapping[]> = {
  payslips: [
    { formField: 'app1_gross_salary', extractedField: 'income', label: 'Gross Annual Salary' },
    { formField: 'app1_gross_salary', extractedField: 'grossPay', transform: (v) => v * 12, label: 'Gross Salary (monthly × 12)' },
    { formField: 'app1_employer_name', extractedField: 'employer', label: 'Employer Name' },
    { formField: 'app1_employer_name', extractedField: 'employerName', label: 'Employer Name' },
    { formField: 'app1_employment_type', extractedField: 'employmentType', label: 'Employment Type' },
    { formField: 'app1_net_monthly_income', extractedField: 'netPay', label: 'Net Monthly Income' },
    { formField: 'app1_pps_number', extractedField: 'ppsNumber', label: 'PPS Number' },
  ],
  salary_cert: [
    { formField: 'app1_gross_salary', extractedField: 'income', label: 'Gross Annual Salary' },
    { formField: 'app1_employer_name', extractedField: 'employer', label: 'Employer Name' },
    { formField: 'app1_employer_name', extractedField: 'employerName', label: 'Employer Name' },
    { formField: 'app1_employment_type', extractedField: 'employmentType', label: 'Employment Type' },
  ],
  employment_summary: [
    { formField: 'app1_gross_salary', extractedField: 'income', label: 'Gross Annual Income' },
    { formField: 'app1_gross_salary', extractedField: 'totalIncome', label: 'Total Income' },
    { formField: 'app1_employer_name', extractedField: 'employer', label: 'Employer Name' },
    { formField: 'app1_pps_number', extractedField: 'ppsNumber', label: 'PPS Number' },
  ],
  certified_id: [
    { formField: 'app1_forenames', extractedField: 'fullName', transform: (v) => v?.split(' ').slice(0, -1).join(' '), label: 'First Name(s)' },
    { formField: 'app1_surname', extractedField: 'fullName', transform: (v) => v?.split(' ').slice(-1)[0], label: 'Surname' },
    { formField: 'app1_date_of_birth', extractedField: 'dateOfBirth', label: 'Date of Birth' },
    { formField: 'app1_nationality', extractedField: 'nationality', label: 'Nationality' },
  ],
  proof_of_address: [
    { formField: 'app1_address_line1', extractedField: 'addressLine1', label: 'Address Line 1' },
    { formField: 'app1_address_line2', extractedField: 'addressLine2', label: 'Address Line 2' },
    { formField: 'app1_address', extractedField: 'address', label: 'Full Address' },
    { formField: 'app1_county', extractedField: 'county', label: 'County' },
  ],
  current_account_statements: [
    { formField: 'bank_name', extractedField: 'bankName', label: 'Bank Name' },
  ],
  savings_account_statements: [
    { formField: 'savings', extractedField: 'avgBalance', label: 'Savings Balance' },
  ],
  form_11: [
    { formField: 'app1_se_average_profit', extractedField: 'netProfit', label: 'Net Profit' },
    { formField: 'app1_gross_salary', extractedField: 'totalIncome', label: 'Total Income' },
  ],
  self_employed_docs: [
    { formField: 'app1_se_average_profit', extractedField: 'netProfit', label: 'Net Profit' },
    { formField: 'app1_gross_salary', extractedField: 'grossRevenue', label: 'Gross Revenue' },
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
