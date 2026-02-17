import { useEffect, useState } from "react";
import { DocumentSection } from "./DocumentSection";
import { supabase } from "@/integrations/supabase/client";
import CoverLetterForm from "./client/CoverLetterForm";

interface Document {
  id: string;
  filename: string;
  document_type: string;
  status: string;
  score: number | null;
  analysis_text: string | null;
  created_at: string;
  file_path: string;
}

interface DocumentListProps {
  refreshTrigger?: number;
  employmentType?: string | null;
}

// Documents required for all applicants
const BASE_DOCUMENT_SECTIONS = [
  {
    type: "certified_id",
    title: "Certified ID",
    description: "Valid government-issued ID (passport, driver's license, or national ID card)",
    required: true,
    forEmploymentType: "all",
  },
  {
    type: "proof_of_address",
    title: "Proof of Address",
    description: "Recent utility bill, bank statement, or official document showing your current address",
    required: true,
    forEmploymentType: "all",
  },
  {
    type: "application_form",
    title: "BI Application Form",
    description: "BI Application Form or lender-specific application form",
    required: true,
    forEmploymentType: "all",
  },
  {
    type: "current_account_statements",
    title: "6 Months Current Account Statements",
    description: "Complete bank statements for the last 6 months from your current account",
    required: true,
    forEmploymentType: "all",
  },
  {
    type: "savings_account_statements",
    title: "6 Months Savings Account Statements",
    description: "Complete statements for the last 6 months from your savings accounts",
    required: true,
    forEmploymentType: "all",
  },
  {
    type: "marriage_certificate",
    title: "Marriage Certificate",
    description: "Official marriage certificate (required for married applicants)",
    required: false,
    forEmploymentType: "all",
  },
  {
    type: "gift_letter",
    title: "Gift Letter",
    description: "Letter confirming gift for BOF (lender-specific gift letters)",
    required: false,
    forEmploymentType: "all",
  },
  {
    type: "loan_account_statements",
    title: "6 Months Loan Account Statements",
    description: "Complete statements for the last 6 months from any loan accounts",
    required: false,
    forEmploymentType: "all",
  },
  {
    type: "mortgage_statements",
    title: "12 Months Mortgage Statements",
    description: "Complete mortgage statements for the last 12 months (if applicable)",
    required: false,
    forEmploymentType: "all",
  },
  {
    type: "other",
    title: "Other Documents",
    description: "Any additional supporting documents",
    required: false,
    forEmploymentType: "all",
  },
];

// Documents required only for employees (PAYE)
const EMPLOYEE_DOCUMENT_SECTIONS = [
  {
    type: "payslips",
    title: "3 Months Payslips",
    description: "Your last 3 months of payslips showing income details",
    required: true,
    forEmploymentType: "employee",
  },
  {
    type: "employment_summary",
    title: "Employment Detail Summary",
    description: "2024 Employment Detail Summary from Revenue (EDS)",
    required: true,
    forEmploymentType: "employee",
  },
  {
    type: "salary_cert",
    title: "Salary Certificate",
    description: "BPFI salary certificate or employer confirmation letter",
    required: true,
    forEmploymentType: "employee",
  },
];

// Documents required only for self-employed
const SELF_EMPLOYED_DOCUMENT_SECTIONS = [
  {
    type: "self_employed_docs",
    title: "Business Accounts (2 Years)",
    description: "2 years of business accounts signed by both client and accountant",
    required: true,
    forEmploymentType: "self_employed",
  },
  {
    type: "form_11",
    title: "Form 11 Tax Returns (2 Years)",
    description: "Last 2 years of Form 11 tax returns filed with Revenue",
    required: true,
    forEmploymentType: "self_employed",
  },
  {
    type: "chapter_4",
    title: "Chapter 4 Notices (2 Years)",
    description: "Last 2 years of Chapter 4 notices from Revenue",
    required: true,
    forEmploymentType: "self_employed",
  },
  {
    type: "business_bank_statements",
    title: "12 Months Business Bank Statements",
    description: "Complete business bank statements for the last 12 months",
    required: true,
    forEmploymentType: "self_employed",
  },
  {
    type: "ros_payment_charges",
    title: "ROS Payment & Charges Form",
    description: "Payment and charges form from Revenue Online Service (ROS)",
    required: true,
    forEmploymentType: "self_employed",
  },
  {
    type: "tax_clearance",
    title: "Tax Clearance Certificate",
    description: "Current tax clearance certificate from Revenue",
    required: true,
    forEmploymentType: "self_employed",
  },
];

const getDocumentSections = (employmentType: string | null | undefined) => {
  const isSelfEmployed = employmentType === 'self_employed' || employmentType === 'Self Employed' || employmentType === 'self-employed';
  
  if (isSelfEmployed) {
    return [...BASE_DOCUMENT_SECTIONS, ...SELF_EMPLOYED_DOCUMENT_SECTIONS];
  }
  // Default to employee documents
  return [...BASE_DOCUMENT_SECTIONS, ...EMPLOYEE_DOCUMENT_SECTIONS];
};

export const DocumentList = ({ refreshTrigger, employmentType }: DocumentListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data as Document[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const documentSections = getDocumentSections(employmentType);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Verification</h2>
          {employmentType && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing documents for: <span className="font-medium capitalize">{employmentType === 'self_employed' ? 'Self-Employed' : 'Employee (PAYE)'}</span>
            </p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {documents.filter(d => d.status === 'approved').length} of {documentSections.filter(s => s.required).length} required documents approved
        </p>
      </div>

      {/* Cover Letter Form - First Section */}
      <CoverLetterForm />
      
      {documentSections.map((section) => (
        <DocumentSection
          key={section.type}
          title={section.title}
          description={section.description}
          documentType={section.type}
          documents={documents}
          required={section.required}
        />
      ))}
    </div>
  );
};
