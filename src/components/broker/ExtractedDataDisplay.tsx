import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  DollarSign, 
  Building2, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  User,
  FileCheck,
  TrendingUp
} from "lucide-react";

interface ExtractedData {
  // Payslip fields
  grossPay?: number;
  netPay?: number;
  employerName?: string;
  payPeriod?: string;
  payDate?: string;
  taxDeductions?: number;
  prsiDeductions?: number;
  uscDeductions?: number;
  pensionContributions?: number;
  yearToDateGross?: number;
  yearToDateTax?: number;
  
  // Bank statement fields
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  statementPeriodStart?: string;
  statementPeriodEnd?: string;
  openingBalance?: number;
  closingBalance?: number;
  averageBalance?: number;
  totalCredits?: number;
  totalDebits?: number;
  regularIncome?: number;
  overdraftUsage?: boolean;
  bouncedTransactions?: number;
  gamblingTransactions?: boolean;
  
  // ID fields - matching edge function extraction schema
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  documentNumber?: string;
  idNumber?: string; // Legacy field name
  expiryDate?: string;
  issueDate?: string;
  issuingAuthority?: string;
  idType?: string;
  isExpired?: boolean;
  gender?: string;
  address?: string;
  
  // Address proof fields
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  eircode?: string;
  documentDate?: string;
  utilityProvider?: string;
  
  // Tax return fields
  totalIncome?: number;
  taxableIncome?: number;
  taxPaid?: number;
  taxYear?: string;
  selfEmployedIncome?: number;
  rentalIncome?: number;
  
  // Common fields
  inconsistencies?: string[];
  missingPages?: boolean;
}

interface ExtractedDataDisplayProps {
  documentType: string;
  extractedData: ExtractedData;
  riskLevel?: string;
  completenessScore?: number;
}

const ExtractedDataDisplay = ({ 
  documentType, 
  extractedData, 
  riskLevel,
  completenessScore 
}: ExtractedDataDisplayProps) => {
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    return value;
  };

  const getRiskBadge = (risk?: string) => {
    if (!risk) return null;
    const colors: Record<string, string> = {
      low: 'bg-success/10 text-success border-success/20',
      medium: 'bg-warning/10 text-warning border-warning/20',
      high: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return (
      <Badge className={colors[risk] || colors.medium}>
        {risk.toUpperCase()} Risk
      </Badge>
    );
  };

  const renderPayslipData = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <DataItem icon={Building2} label="Employer" value={extractedData.employerName} />
      <DataItem icon={DollarSign} label="Gross Pay" value={formatCurrency(extractedData.grossPay)} highlight />
      <DataItem icon={DollarSign} label="Net Pay" value={formatCurrency(extractedData.netPay)} />
      <DataItem icon={Calendar} label="Pay Period" value={extractedData.payPeriod} />
      <DataItem icon={Calendar} label="Pay Date" value={formatDate(extractedData.payDate)} />
      <DataItem icon={CreditCard} label="Tax" value={formatCurrency(extractedData.taxDeductions)} />
      <DataItem icon={CreditCard} label="PRSI" value={formatCurrency(extractedData.prsiDeductions)} />
      <DataItem icon={CreditCard} label="USC" value={formatCurrency(extractedData.uscDeductions)} />
      <DataItem icon={TrendingUp} label="YTD Gross" value={formatCurrency(extractedData.yearToDateGross)} />
    </div>
  );

  const renderBankStatementData = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <DataItem icon={User} label="Account Holder" value={extractedData.accountHolderName} />
      <DataItem icon={Building2} label="Bank" value={extractedData.bankName} />
      <DataItem icon={DollarSign} label="Opening Balance" value={formatCurrency(extractedData.openingBalance)} />
      <DataItem icon={DollarSign} label="Closing Balance" value={formatCurrency(extractedData.closingBalance)} highlight />
      <DataItem icon={TrendingUp} label="Avg Balance" value={formatCurrency(extractedData.averageBalance)} />
      <DataItem icon={DollarSign} label="Regular Income" value={formatCurrency(extractedData.regularIncome)} highlight />
      <DataItem icon={DollarSign} label="Total Credits" value={formatCurrency(extractedData.totalCredits)} />
      <DataItem icon={DollarSign} label="Total Debits" value={formatCurrency(extractedData.totalDebits)} />
      <DataItem icon={Calendar} label="Period" value={`${formatDate(extractedData.statementPeriodStart)} - ${formatDate(extractedData.statementPeriodEnd)}`} />
      {extractedData.overdraftUsage && (
        <DataItem icon={AlertTriangle} label="Overdraft" value="Used" warning />
      )}
      {extractedData.gamblingTransactions && (
        <DataItem icon={AlertTriangle} label="Gambling" value="Detected" warning />
      )}
      {(extractedData.bouncedTransactions ?? 0) > 0 && (
        <DataItem icon={AlertTriangle} label="Bounced" value={`${extractedData.bouncedTransactions} transactions`} warning />
      )}
    </div>
  );

  const renderIdData = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <DataItem icon={User} label="Full Name" value={extractedData.fullName} highlight />
      <DataItem icon={Calendar} label="Date of Birth" value={formatDate(extractedData.dateOfBirth)} />
      <DataItem icon={FileCheck} label="Nationality" value={extractedData.nationality} />
      <DataItem icon={Database} label="Document No." value={extractedData.documentNumber || extractedData.idNumber} />
      <DataItem icon={Calendar} label="Expiry Date" value={formatDate(extractedData.expiryDate)} />
      <DataItem icon={Building2} label="Issuing Authority" value={extractedData.issuingAuthority} />
      {extractedData.idType && (
        <DataItem icon={FileCheck} label="ID Type" value={extractedData.idType} />
      )}
      {extractedData.gender && (
        <DataItem icon={User} label="Gender" value={extractedData.gender} />
      )}
      {extractedData.issueDate && (
        <DataItem icon={Calendar} label="Issue Date" value={formatDate(extractedData.issueDate)} />
      )}
      {extractedData.isExpired && (
        <DataItem icon={AlertTriangle} label="Status" value="EXPIRED" warning />
      )}
    </div>
  );

  const renderAddressData = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <DataItem icon={Building2} label="Address" value={[extractedData.addressLine1, extractedData.addressLine2].filter(Boolean).join(', ')} />
      <DataItem icon={Building2} label="City" value={extractedData.city} />
      <DataItem icon={Building2} label="County" value={extractedData.county} />
      <DataItem icon={Database} label="Eircode" value={extractedData.eircode} />
      <DataItem icon={Calendar} label="Document Date" value={formatDate(extractedData.documentDate)} />
      <DataItem icon={Building2} label="Provider" value={extractedData.utilityProvider} />
    </div>
  );

  const renderTaxReturnData = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <DataItem icon={Calendar} label="Tax Year" value={extractedData.taxYear} />
      <DataItem icon={DollarSign} label="Total Income" value={formatCurrency(extractedData.totalIncome)} highlight />
      <DataItem icon={DollarSign} label="Taxable Income" value={formatCurrency(extractedData.taxableIncome)} />
      <DataItem icon={CreditCard} label="Tax Paid" value={formatCurrency(extractedData.taxPaid)} />
      <DataItem icon={DollarSign} label="Self-Employed" value={formatCurrency(extractedData.selfEmployedIncome)} />
      <DataItem icon={DollarSign} label="Rental Income" value={formatCurrency(extractedData.rentalIncome)} />
    </div>
  );

  const renderGenericData = () => {
    const entries = Object.entries(extractedData).filter(
      ([key, value]) => value !== undefined && value !== null && key !== 'inconsistencies' && key !== 'missingPages'
    );
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {entries.map(([key, value]) => (
          <DataItem 
            key={key} 
            icon={Database} 
            label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
            value={typeof value === 'number' ? formatCurrency(value) : String(value)} 
          />
        ))}
      </div>
    );
  };

  const getDataRenderer = () => {
    switch (documentType) {
      case 'payslips':
      case 'salary_cert':
        return renderPayslipData();
      case 'current_account_statements':
      case 'bank_statements':
        return renderBankStatementData();
      case 'certified_id':
      case 'passport':
      case 'driving_license':
        return renderIdData();
      case 'proof_of_address':
      case 'utility_bill':
        return renderAddressData();
      case 'tax_return':
      case 'form_11':
      case 'p60':
        return renderTaxReturnData();
      default:
        return renderGenericData();
    }
  };

  const hasData = Object.keys(extractedData).some(
    key => extractedData[key as keyof ExtractedData] !== undefined && 
           extractedData[key as keyof ExtractedData] !== null &&
           key !== 'inconsistencies' && 
           key !== 'missingPages'
  );

  if (!hasData) {
    return null;
  }

  return (
    <Card className="border-secondary/30 bg-secondary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4 text-secondary" />
            Extracted Data
          </CardTitle>
          <div className="flex items-center gap-2">
            {completenessScore !== undefined && (
              <Badge variant="outline" className="text-xs">
                {completenessScore}% Complete
              </Badge>
            )}
            {getRiskBadge(riskLevel)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {getDataRenderer()}
        
        {/* Inconsistencies Warning */}
        {extractedData.inconsistencies && extractedData.inconsistencies.length > 0 && (
          <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded">
            <p className="text-xs font-semibold text-warning flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3" />
              Inconsistencies Detected
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {extractedData.inconsistencies.map((issue, idx) => {
                const issueText =
                  typeof issue === "string"
                    ? issue
                    : (issue as any)?.description ?? (issue as any)?.flag ?? JSON.stringify(issue);
                return <li key={idx}>• {issueText}</li>;
              })}
            </ul>
          </div>
        )}
        
        {/* Missing Pages Warning */}
        {extractedData.missingPages && (
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded">
            <p className="text-xs font-semibold text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Missing pages detected in document
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface DataItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  highlight?: boolean;
  warning?: boolean;
}

const DataItem = ({ icon: Icon, label, value, highlight, warning }: DataItemProps) => (
  <div className={`p-2 rounded ${highlight ? 'bg-primary/10' : warning ? 'bg-warning/10' : 'bg-background/50'}`}>
    <div className="flex items-center gap-1 mb-1">
      <Icon className={`h-3 w-3 ${warning ? 'text-warning' : 'text-muted-foreground'}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className={`text-sm font-medium truncate ${highlight ? 'text-primary' : warning ? 'text-warning' : ''}`}>
      {value || 'N/A'}
    </p>
  </div>
);

export default ExtractedDataDisplay;
