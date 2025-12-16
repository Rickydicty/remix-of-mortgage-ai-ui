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
}

const DOCUMENT_SECTIONS = [
  {
    type: "certified_id",
    title: "Certified ID",
    description: "Valid government-issued ID (passport, driver's license, or national ID card)",
    required: true,
  },
  {
    type: "proof_of_address",
    title: "Proof of Address",
    description: "Recent utility bill, bank statement, or official document showing your current address",
    required: true,
  },
  {
    type: "application_form",
    title: "BI Application Form",
    description: "BI Application Form or lender-specific application form",
    required: true,
  },
  {
    type: "payslips",
    title: "3 Months Payslips",
    description: "Your last 3 months of payslips showing income details",
    required: true,
  },
  {
    type: "current_account_statements",
    title: "6 Months Current Account Statements",
    description: "Complete bank statements for the last 6 months from your current account",
    required: true,
  },
  {
    type: "savings_account_statements",
    title: "6 Months Savings Account Statements",
    description: "Complete statements for the last 6 months from your savings accounts",
    required: true,
  },
  {
    type: "employment_summary",
    title: "Employment Detail Summary",
    description: "2024 Employment Detail Summary from Revenue (EDS)",
    required: true,
  },
  {
    type: "salary_cert",
    title: "Salary Certificate",
    description: "BPFI salary certificate or employer confirmation letter",
    required: true,
  },
  {
    type: "marriage_certificate",
    title: "Marriage Certificate",
    description: "Official marriage certificate (required for married applicants)",
    required: true,
  },
  {
    type: "self_employed_docs",
    title: "Self-Employed Documents",
    description: "For farming/self-employed: 12 months statements, 2 years Form 11s & Chapter 4s, 2 years business accounts signed by client and accountant",
    required: true,
  },
  {
    type: "ros_payment_charges",
    title: "ROS Payment & Charges Form",
    description: "Payment and charges form from Revenue Online Service (ROS)",
    required: true,
  },
  {
    type: "tax_clearance",
    title: "Tax Clearance Certificate",
    description: "Current tax clearance certificate from Revenue",
    required: true,
  },
  {
    type: "gift_letter",
    title: "Gift Letter",
    description: "Letter confirming gift for BOF (lender-specific gift letters)",
    required: true,
  },
  {
    type: "loan_account_statements",
    title: "6 Months Loan Account Statements",
    description: "Complete statements for the last 6 months from any loan accounts",
    required: true,
  },
  {
    type: "mortgage_statements",
    title: "12 Months Mortgage Statements",
    description: "Complete mortgage statements for the last 12 months",
    required: true,
  },
  {
    type: "other",
    title: "Other Documents",
    description: "Any additional supporting documents",
    required: true,
  },
];

export const DocumentList = ({ refreshTrigger }: DocumentListProps) => {
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
        <h2 className="text-2xl font-bold">Document Verification</h2>
        <p className="text-sm text-muted-foreground">
          {documents.filter(d => d.status === 'approved').length} of {DOCUMENT_SECTIONS.filter(s => s.required).length} required documents approved
        </p>
      </div>

      {/* Cover Letter Form - First Section */}
      <CoverLetterForm />
      
      {DOCUMENT_SECTIONS.map((section) => (
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
