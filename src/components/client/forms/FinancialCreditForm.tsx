import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldFlags, validateFinancialDetails } from "@/components/client/FormFieldFlags";
import { Separator } from "@/components/ui/separator";

interface FinancialCreditFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const CreditHistoryQuestions = ({ 
  prefix, 
  title,
  formData,
  onChange
}: { 
  prefix: 'app1' | 'app2'; 
  title: string;
  formData: any;
  onChange: (field: string, value: any) => void;
}) => (
  <div className="space-y-4">
    <h5 className="font-medium text-sm">{title}</h5>
    <div className="space-y-3">
      {[
        { field: 'refused_mortgage', label: 'Been refused a mortgage on this or any other property?' },
        { field: 'court_order', label: 'Had a court order registered against you?' },
        { field: 'bankruptcy', label: 'Been insolvent, declared bankrupt or made any arrangements with creditors?' },
        { field: 'mortgage_arrears_24m', label: 'Had arrears on your existing mortgage within the last 24 months?' },
      ].map(({ field, label }) => (
        <div key={field} className="flex items-start gap-3">
          <Checkbox 
            checked={formData[`${prefix}_${field}`] || false} 
            onCheckedChange={(v) => onChange(`${prefix}_${field}`, v)} 
          />
          <div className="flex-1">
            <Label className="text-sm">{label}</Label>
            {formData[`${prefix}_${field}`] && (
              <Textarea 
                className="mt-2" 
                placeholder="Please provide details..." 
                value={formData[`${prefix}_${field}_details`] || ''} 
                onChange={(e) => onChange(`${prefix}_${field}_details`, e.target.value)} 
              />
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const formatIban = (value: string) => {
  const clean = value.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
};

export const FinancialCreditForm = ({ formData, onChange }: FinancialCreditFormProps) => {
  const flags = validateFinancialDetails(formData);

  return (
    <div className="space-y-4">
      <FormFieldFlags flags={flags} />
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-4">Section C – Financial & Credit History</h3>
          
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Current Bank/Building Society</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Bank Name</Label>
                <Input className="flex-1" value={formData.bank_name || ''} onChange={(e) => onChange('bank_name', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">IBAN</Label>
                <Input
                  className="flex-1 font-mono tracking-wider"
                  value={formData.bank_sort_code || ''}
                  onChange={(e) => onChange('bank_sort_code', formatIban(e.target.value))}
                  placeholder="IE29 AIBK 9311 5212 3456 78"
                  maxLength={42}
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Address</Label>
                <Input className="flex-1" value={formData.bank_address || ''} onChange={(e) => onChange('bank_address', e.target.value)} placeholder="Full address" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Account Type</Label>
                <Select value={formData.bank_account_type || ''} onValueChange={(v) => onChange('bank_account_type', v)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Account</SelectItem>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Account Number</Label>
                <Input className="flex-1" value={formData.bank_account_number || ''} onChange={(e) => onChange('bank_account_number', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Years Held</Label>
                <Input className="w-24" type="number" min="0" value={formData.bank_years_held || ''} onChange={(e) => onChange('bank_years_held', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Financial Commitments</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Monthly Commitments</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.monthly_commitments || ''} onChange={(e) => onChange('monthly_commitments', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Existing Loans</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.existing_loans || ''} onChange={(e) => onChange('existing_loans', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Credit Cards Outstanding</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.credit_cards || ''} onChange={(e) => onChange('credit_cards', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Savings</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.savings || ''} onChange={(e) => onChange('savings', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Credit History</h4>
          
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-4">
              <Label className="w-40 text-sm text-muted-foreground">Credit History</Label>
              <Select value={formData.credit_history || ''} onValueChange={(v) => onChange('credit_history', v)}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">Have you ever:</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <CreditHistoryQuestions prefix="app1" title="Applicant One" formData={formData} onChange={onChange} />
            {formData.app2_enabled && (
              <CreditHistoryQuestions prefix="app2" title="Applicant Two" formData={formData} onChange={onChange} />
            )}
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox checked={formData.has_ccj || false} onCheckedChange={(v) => onChange('has_ccj', v)} />
              <div className="flex-1">
                <Label className="text-sm">Any CCJs or defaults?</Label>
                {formData.has_ccj && (
                  <Textarea className="mt-2" placeholder="Please provide details..." value={formData.ccj_details || ''} onChange={(e) => onChange('ccj_details', e.target.value)} />
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox checked={formData.has_arrears || false} onCheckedChange={(v) => onChange('has_arrears', v)} />
              <div className="flex-1">
                <Label className="text-sm">Any arrears on existing loans?</Label>
                {formData.has_arrears && (
                  <Textarea className="mt-2" placeholder="Please provide details..." value={formData.arrears_details || ''} onChange={(e) => onChange('arrears_details', e.target.value)} />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
