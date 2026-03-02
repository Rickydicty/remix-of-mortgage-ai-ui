import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApplicationPDFDownloadProps {
  formData: any;
  applicationNumber: string;
}

const formatCurrency = (v: any) => v ? `€${Number(v).toLocaleString()}` : '—';
const formatBool = (v: any) => v ? 'Yes' : 'No';
const val = (v: any) => v || '—';

export const ApplicationPDFDownload = ({ formData, applicationNumber }: ApplicationPDFDownloadProps) => {
  const { toast } = useToast();

  const generatePDF = () => {
    const sections = [
      {
        title: 'APPLICANT 1 – PERSONAL DETAILS',
        rows: [
          ['Title', val(formData.app1_title)],
          ['Forenames', val(formData.app1_forenames)],
          ['Surname', val(formData.app1_surname)],
          ['Date of Birth', val(formData.app1_date_of_birth)],
          ['PPS Number', val(formData.app1_pps_number)],
          ['Gender', val(formData.app1_gender)],
          ['Nationality', val(formData.app1_nationality)],
          ['Marital Status', val(formData.app1_marital_status)],
          ['Phone', val(formData.app1_phone)],
          ['Email', val(formData.app1_email)],
          ['Address', val(formData.app1_address_line1)],
          ['County', val(formData.app1_county)],
          ['Country', val(formData.app1_country)],
          ['Years at Address', val(formData.app1_years_at_address)],
          ['No. of Children', val(formData.app1_no_of_children)],
        ],
      },
      ...(formData.app2_enabled ? [{
        title: 'APPLICANT 2 – PERSONAL DETAILS',
        rows: [
          ['Title', val(formData.app2_title)],
          ['Forenames', val(formData.app2_forenames)],
          ['Surname', val(formData.app2_surname)],
          ['Date of Birth', val(formData.app2_date_of_birth)],
          ['PPS Number', val(formData.app2_pps_number)],
          ['Phone', val(formData.app2_phone)],
          ['Email', val(formData.app2_email)],
        ],
      }] : []),
      {
        title: 'EMPLOYMENT – APPLICANT 1',
        rows: [
          ['Status', val(formData.app1_employment_status)],
          ['Type', val(formData.app1_employment_type)],
          ['Occupation', val(formData.app1_occupation)],
          ['Employer', val(formData.app1_employer_name)],
          ['Gross Salary', formatCurrency(formData.app1_gross_salary)],
          ['Net Monthly Income', formatCurrency(formData.app1_net_monthly_income)],
          ['Years with Employer', val(formData.app1_years_with_employer)],
        ],
      },
      {
        title: 'BANK DETAILS',
        rows: [
          ['Bank Name', val(formData.bank_name)],
          ['IBAN', val(formData.bank_sort_code)],
          ['Account Type', val(formData.bank_account_type)],
          ['Years Held', val(formData.bank_years_held)],
        ],
      },
      {
        title: 'FINANCIAL COMMITMENTS',
        rows: [
          ['Monthly Commitments', formatCurrency(formData.monthly_commitments)],
          ['Existing Loans', formatCurrency(formData.existing_loans)],
          ['Credit Cards', formatCurrency(formData.credit_cards)],
          ['Savings', formatCurrency(formData.savings)],
          ['Credit History', val(formData.credit_history)],
        ],
      },
      {
        title: 'MORTGAGE DETAILS',
        rows: [
          ['Purpose', val(formData.mortgage_purpose)],
          ['Type', val(formData.mortgage_type)],
          ['Property Value', formatCurrency(formData.property_value)],
          ['Loan Amount', formatCurrency(formData.loan_amount)],
          ['Deposit', formatCurrency(formData.deposit_amount)],
          ['Mortgage Term', formData.mortgage_term ? `${formData.mortgage_term} years` : '—'],
          ['Rate Type', val(formData.rate_type)],
          ['First Time Buyer', formatBool(formData.first_time_buyer)],
          ['Help to Buy', formatBool(formData.help_to_buy)],
        ],
      },
      {
        title: 'PROPERTY DETAILS',
        rows: [
          ['Address', val(formData.property_address_line1)],
          ['County', val(formData.property_county)],
          ['Type', val(formData.property_type)],
          ['New/Secondhand', val(formData.property_new_or_secondhand)],
          ['BER Rating', val(formData.ber_rating)],
          ['Year Built', val(formData.year_built)],
          ['Bedrooms', val(formData.property_num_bedrooms)],
          ['Bathrooms', val(formData.property_num_bathrooms)],
        ],
      },
      {
        title: 'SOLICITOR',
        rows: [
          ['Name', val(formData.solicitor_name)],
          ['Address', val(formData.solicitor_address)],
          ['Phone', val(formData.solicitor_phone)],
          ['Email', val(formData.solicitor_email)],
        ],
      },
    ];

    // Build printable HTML
    const html = `
<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Application ${applicationNumber} – Summary</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1a1a1a; font-size: 13px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .subtitle { color: #666; margin-bottom: 24px; font-size: 12px; }
  .section { margin-bottom: 20px; break-inside: avoid; }
  .section-title { background: #f0f4f8; padding: 6px 12px; font-weight: 700; font-size: 13px; margin-bottom: 0; border-left: 3px solid #2563eb; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 12px; border-bottom: 1px solid #eee; }
  td:first-child { width: 200px; color: #666; font-weight: 500; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<h1>Mortgage Application Summary</h1>
<p class="subtitle">Application #${applicationNumber} • Generated ${new Date().toLocaleDateString('en-IE')}</p>
${sections.map(s => `
<div class="section">
  <div class="section-title">${s.title}</div>
  <table>${s.rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('')}</table>
</div>`).join('')}
</body></html>`;

    // Open in new window for print/save as PDF
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      // Auto-trigger print dialog after short delay
      setTimeout(() => win.print(), 500);
      toast({ title: "PDF Ready", description: "Use Print → Save as PDF in the dialog." });
    } else {
      toast({ title: "Popup Blocked", description: "Please allow popups for this site to download the PDF.", variant: "destructive" });
    }
  };

  return (
    <Button variant="outline" onClick={generatePDF} className="gap-2">
      <Download className="h-4 w-4" />
      Download Application PDF
    </Button>
  );
};
