import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormFieldFlags, validateIncomeDetails } from "@/components/client/FormFieldFlags";
import { Separator } from "@/components/ui/separator";

interface IncomeEmploymentFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const IncomeEmploymentForm = ({ formData, onChange }: IncomeEmploymentFormProps) => {
  const flags = validateIncomeDetails(formData);

  const FrequencySelect = ({ value, field }: { value: string; field: string }) => (
    <Select value={value || 'annual'} onValueChange={(v) => onChange(field, v)}>
      <SelectTrigger className="w-28">
        <SelectValue placeholder="Freq" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="annual">Annual</SelectItem>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="weekly">Weekly</SelectItem>
      </SelectContent>
    </Select>
  );

  const EmploymentStatusSelect = ({ prefix }: { prefix: 'app1' | 'app2' }) => (
    <div className="flex items-center gap-4 mb-4">
      <Label className="w-40 text-sm text-muted-foreground">Employment Status</Label>
      <Select value={formData[`${prefix}_employment_status`] || 'employed'} onValueChange={(v) => onChange(`${prefix}_employment_status`, v)}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="employed">Employed</SelectItem>
          <SelectItem value="self_employed">Self Employed</SelectItem>
          <SelectItem value="employed_and_self_employed">Employed & Self Employed</SelectItem>
          <SelectItem value="homemaker">Homemaker</SelectItem>
          <SelectItem value="retired">Retired</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const IncomeFields = ({ prefix, title }: { prefix: 'app1' | 'app2'; title: string }) => {
    const status = formData[`${prefix}_employment_status`] || 'employed';
    const isEmployed = status === 'employed' || status === 'employed_and_self_employed';
    const isSelfEmployed = status === 'self_employed' || status === 'employed_and_self_employed';

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">{title}</h4>
        
        <EmploymentStatusSelect prefix={prefix} />
        
        {/* Current Income */}
        <h5 className="font-medium text-sm border-b pb-1">Current Income</h5>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Gross basic wage/salary pa</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="w-28" type="number" value={formData[`${prefix}_gross_salary`] || ''} onChange={(e) => onChange(`${prefix}_gross_salary`, parseFloat(e.target.value) || 0)} />
              <FrequencySelect value={formData[`${prefix}_salary_frequency`]} field={`${prefix}_salary_frequency`} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Overtime per annum</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="w-28" type="number" value={formData[`${prefix}_overtime`] || ''} onChange={(e) => onChange(`${prefix}_overtime`, parseFloat(e.target.value) || 0)} />
              <FrequencySelect value={formData[`${prefix}_overtime_frequency`]} field={`${prefix}_overtime_frequency`} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Bonuses per annum</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="w-28" type="number" value={formData[`${prefix}_bonuses`] || ''} onChange={(e) => onChange(`${prefix}_bonuses`, parseFloat(e.target.value) || 0)} />
              <FrequencySelect value={formData[`${prefix}_bonuses_frequency`]} field={`${prefix}_bonuses_frequency`} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Commissions per annum</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="w-28" type="number" value={formData[`${prefix}_commissions`] || ''} onChange={(e) => onChange(`${prefix}_commissions`, parseFloat(e.target.value) || 0)} />
              <FrequencySelect value={formData[`${prefix}_commissions_frequency`]} field={`${prefix}_commissions_frequency`} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Other income (non rental)</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="w-28" type="number" value={formData[`${prefix}_other_income`] || ''} onChange={(e) => onChange(`${prefix}_other_income`, parseFloat(e.target.value) || 0)} />
              <FrequencySelect value={formData[`${prefix}_other_income_frequency`]} field={`${prefix}_other_income_frequency`} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Other Income Details</Label>
              <Input className="flex-1" value={formData[`${prefix}_other_income_details`] || ''} onChange={(e) => onChange(`${prefix}_other_income_details`, e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Lodger income pa</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="w-28" type="number" value={formData[`${prefix}_lodger_income`] || ''} onChange={(e) => onChange(`${prefix}_lodger_income`, parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Residential investment income</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="w-28" type="number" value={formData[`${prefix}_residential_investment_income`] || ''} onChange={(e) => onChange(`${prefix}_residential_investment_income`, parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Net Monthly Income</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="w-28" type="number" value={formData[`${prefix}_net_monthly_income`] || ''} onChange={(e) => onChange(`${prefix}_net_monthly_income`, parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
        
        {/* Employment Details - only show if employed */}
        {isEmployed && (
          <>
            <h5 className="font-medium text-sm border-b pb-1 mt-6">Employment Details</h5>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Occupation</Label>
                  <Input className="flex-1" value={formData[`${prefix}_occupation`] || ''} onChange={(e) => onChange(`${prefix}_occupation`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Employment Type</Label>
                  <Select value={formData[`${prefix}_employment_type`] || 'permanent'} onValueChange={(v) => onChange(`${prefix}_employment_type`, v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Employer's Name</Label>
                  <Input className="flex-1" value={formData[`${prefix}_employer_name`] || ''} onChange={(e) => onChange(`${prefix}_employer_name`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Employer's Address</Label>
                  <Input className="flex-1" value={formData[`${prefix}_employer_address`] || ''} onChange={(e) => onChange(`${prefix}_employer_address`, e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Employer Phone</Label>
                  <Input className="flex-1" value={formData[`${prefix}_employer_phone`] || ''} onChange={(e) => onChange(`${prefix}_employer_phone`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Nature of Business</Label>
                  <Input className="flex-1" value={formData[`${prefix}_nature_of_business`] || ''} onChange={(e) => onChange(`${prefix}_nature_of_business`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Length of Service</Label>
                  <Input className="w-16" type="number" min="0" placeholder="Yrs" value={formData[`${prefix}_years_with_employer`] || ''} onChange={(e) => onChange(`${prefix}_years_with_employer`, parseInt(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground">years</span>
                  <Input className="w-16" type="number" min="0" max="11" placeholder="Mths" value={formData[`${prefix}_months_with_employer`] || ''} onChange={(e) => onChange(`${prefix}_months_with_employer`, parseInt(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground">months</span>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Self-Employed Details - only show if self-employed */}
        {isSelfEmployed && (
          <>
            <h5 className="font-medium text-sm border-b pb-1 mt-6">Self-Employed Details</h5>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Company Name</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_company_name`] || ''} onChange={(e) => onChange(`${prefix}_se_company_name`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Company Address</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_company_address`] || ''} onChange={(e) => onChange(`${prefix}_se_company_address`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Nature of Business</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_nature_of_business`] || ''} onChange={(e) => onChange(`${prefix}_se_nature_of_business`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Years Established</Label>
                  <Input className="w-24" type="number" min="0" value={formData[`${prefix}_se_years_established`] || ''} onChange={(e) => onChange(`${prefix}_se_years_established`, parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Avg. Profit (3 yrs)</Label>
                  <span className="text-muted-foreground">€</span>
                  <Input className="flex-1" type="number" value={formData[`${prefix}_se_average_profit`] || ''} onChange={(e) => onChange(`${prefix}_se_average_profit`, parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Shareholding %</Label>
                  <Input className="w-24" type="number" min="0" max="100" value={formData[`${prefix}_se_shareholding_percent`] || ''} onChange={(e) => onChange(`${prefix}_se_shareholding_percent`, parseFloat(e.target.value) || 0)} />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Accountant Name</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_accountant_name`] || ''} onChange={(e) => onChange(`${prefix}_se_accountant_name`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Accounting Firm</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_accountant_firm`] || ''} onChange={(e) => onChange(`${prefix}_se_accountant_firm`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Accountant Address</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_accountant_address`] || ''} onChange={(e) => onChange(`${prefix}_se_accountant_address`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Accountant Phone</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_accountant_phone`] || ''} onChange={(e) => onChange(`${prefix}_se_accountant_phone`, e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData[`${prefix}_se_audited_accounts`] || false} onCheckedChange={(v) => onChange(`${prefix}_se_audited_accounts`, v)} />
                  <Label className="text-sm text-muted-foreground">3 years audited accounts available</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData[`${prefix}_se_tax_affairs_uptodate`] !== false} onCheckedChange={(v) => onChange(`${prefix}_se_tax_affairs_uptodate`, v)} />
                  <Label className="text-sm text-muted-foreground">Tax affairs up to date</Label>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <FormFieldFlags flags={flags} />
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-4">Section B – Income & Employment</h3>
          
          <IncomeFields prefix="app1" title="Applicant One" />
          
          {formData.app2_enabled && (
            <>
              <Separator className="my-6" />
              <IncomeFields prefix="app2" title="Applicant Two" />
            </>
          )}
          
          {/* Other Household Income - only for App 1 */}
          <Separator className="my-6" />
          <div className="flex items-center gap-2">
            <Label className="w-48 text-sm text-muted-foreground">Other Household Income</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="w-32" type="number" value={formData.app1_other_household_income || ''} onChange={(e) => onChange('app1_other_household_income', parseFloat(e.target.value) || 0)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
