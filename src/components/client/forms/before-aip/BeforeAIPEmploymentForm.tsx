import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface BeforeAIPEmploymentFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const BeforeAIPEmploymentForm = ({ formData, onChange }: BeforeAIPEmploymentFormProps) => {
  const ApplicantEmployment = ({ prefix, title }: { prefix: 'app1' | 'app2'; title: string }) => {
    const status = formData[`${prefix}_employment_status`] || 'employed';
    const isEmployed = status === 'employed' || status === 'employed_and_self_employed';
    const isSelfEmployed = status === 'self_employed' || status === 'employed_and_self_employed';

    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">{title}</h4>
        
        {/* Employment Status */}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Employment Status<span className="text-destructive">*</span></Label>
          <Select value={status} onValueChange={(v) => onChange(`${prefix}_employment_status`, v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employed">Employed</SelectItem>
              <SelectItem value="employed_and_self_employed">Employed & Self-Employed</SelectItem>
              <SelectItem value="homemaker">Homemaker</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="self_employed">Self-Employed</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isEmployed && (
          <div className="flex items-center gap-4">
            <Label className="w-40 text-sm text-muted-foreground">Contract Type</Label>
            <Select value={formData[`${prefix}_employment_type`] || 'permanent'} onValueChange={(v) => onChange(`${prefix}_employment_type`, v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Income Fields */}
        <h5 className="font-medium text-sm border-b pb-1">Income (per annum)</h5>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Gross Basic Salary</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData[`${prefix}_gross_salary`] || ''} onChange={(e) => onChange(`${prefix}_gross_salary`, parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Overtime</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData[`${prefix}_overtime`] || ''} onChange={(e) => onChange(`${prefix}_overtime`, parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Bonus</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData[`${prefix}_bonuses`] || ''} onChange={(e) => onChange(`${prefix}_bonuses`, parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Commission</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData[`${prefix}_commissions`] || ''} onChange={(e) => onChange(`${prefix}_commissions`, parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Other Income (non-rental)</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData[`${prefix}_other_income`] || ''} onChange={(e) => onChange(`${prefix}_other_income`, parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Lodger Income</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData[`${prefix}_lodger_income`] || ''} onChange={(e) => onChange(`${prefix}_lodger_income`, parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Residential Investment Income</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData[`${prefix}_residential_investment_income`] || ''} onChange={(e) => onChange(`${prefix}_residential_investment_income`, parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-48 text-sm text-muted-foreground">Net Monthly Income</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData[`${prefix}_net_monthly_income`] || ''} onChange={(e) => onChange(`${prefix}_net_monthly_income`, parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
        
        {/* Employment Details (if employed) */}
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
                  <Label className="w-40 text-sm text-muted-foreground">Employer Name</Label>
                  <Input className="flex-1" value={formData[`${prefix}_employer_name`] || ''} onChange={(e) => onChange(`${prefix}_employer_name`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Employer Line 1</Label>
                  <Input className="flex-1" value={formData[`${prefix}_employer_line1`] || ''} onChange={(e) => onChange(`${prefix}_employer_line1`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Employer Line 2</Label>
                  <Input className="flex-1" value={formData[`${prefix}_employer_line2`] || ''} onChange={(e) => onChange(`${prefix}_employer_line2`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Employer Line 3</Label>
                  <Input className="flex-1" value={formData[`${prefix}_employer_line3`] || ''} onChange={(e) => onChange(`${prefix}_employer_line3`, e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">County</Label>
                  <Input className="flex-1" value={formData[`${prefix}_employer_county`] || ''} onChange={(e) => onChange(`${prefix}_employer_county`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Country</Label>
                  <Input className="flex-1" value={formData[`${prefix}_employer_country`] || 'Ireland'} onChange={(e) => onChange(`${prefix}_employer_country`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Telephone</Label>
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
            
            {/* Previous Employment (if < 1 year) */}
            {((formData[`${prefix}_years_with_employer`] || 0) < 1) && (
              <>
                <h5 className="font-medium text-sm border-b pb-1 mt-6">Previous Employment (if less than 1 year with current)</h5>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Label className="w-40 text-sm text-muted-foreground">Employer Name</Label>
                      <Input className="flex-1" value={formData[`${prefix}_prev_employer_name`] || ''} onChange={(e) => onChange(`${prefix}_prev_employer_name`, e.target.value)} />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-40 text-sm text-muted-foreground">Address Line 1</Label>
                      <Input className="flex-1" value={formData[`${prefix}_prev_employer_line1`] || ''} onChange={(e) => onChange(`${prefix}_prev_employer_line1`, e.target.value)} />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-40 text-sm text-muted-foreground">County</Label>
                      <Input className="flex-1" value={formData[`${prefix}_prev_employer_county`] || ''} onChange={(e) => onChange(`${prefix}_prev_employer_county`, e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Label className="w-40 text-sm text-muted-foreground">Occupation</Label>
                      <Input className="flex-1" value={formData[`${prefix}_prev_occupation`] || ''} onChange={(e) => onChange(`${prefix}_prev_occupation`, e.target.value)} />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-40 text-sm text-muted-foreground">Length of Service</Label>
                      <Input className="w-16" type="number" min="0" placeholder="Yrs" value={formData[`${prefix}_prev_years`] || ''} onChange={(e) => onChange(`${prefix}_prev_years`, parseInt(e.target.value) || 0)} />
                      <span className="text-xs text-muted-foreground">years</span>
                      <Input className="w-16" type="number" min="0" max="11" placeholder="Mths" value={formData[`${prefix}_prev_months`] || ''} onChange={(e) => onChange(`${prefix}_prev_months`, parseInt(e.target.value) || 0)} />
                      <span className="text-xs text-muted-foreground">months</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
        
        {/* Self-Employed Details */}
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
                  <Label className="w-40 text-sm text-muted-foreground">Business Line 1</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_company_line1`] || ''} onChange={(e) => onChange(`${prefix}_se_company_line1`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Business Line 2</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_company_line2`] || ''} onChange={(e) => onChange(`${prefix}_se_company_line2`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">County</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_company_county`] || ''} onChange={(e) => onChange(`${prefix}_se_company_county`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Country</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_company_country`] || 'Ireland'} onChange={(e) => onChange(`${prefix}_se_company_country`, e.target.value)} />
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
                  <Label className="w-40 text-sm text-muted-foreground">Time Involved</Label>
                  <Input className="w-16" type="number" min="0" placeholder="Yrs" value={formData[`${prefix}_se_time_involved_years`] || ''} onChange={(e) => onChange(`${prefix}_se_time_involved_years`, parseInt(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground">years</span>
                  <Input className="w-16" type="number" min="0" max="11" placeholder="Mths" value={formData[`${prefix}_se_time_involved_months`] || ''} onChange={(e) => onChange(`${prefix}_se_time_involved_months`, parseInt(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground">months</span>
                </div>
              </div>
              <div className="space-y-3">
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
                  <Input className="flex-1" value={formData[`${prefix}_se_accountant_line1`] || ''} onChange={(e) => onChange(`${prefix}_se_accountant_line1`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Telephone</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_accountant_phone`] || ''} onChange={(e) => onChange(`${prefix}_se_accountant_phone`, e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Fax</Label>
                  <Input className="flex-1" value={formData[`${prefix}_se_accountant_fax`] || ''} onChange={(e) => onChange(`${prefix}_se_accountant_fax`, e.target.value)} />
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
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-lg">Employment & Income</h3>
        
        <ApplicantEmployment prefix="app1" title="Applicant One" />
        
        {formData.app2_enabled && (
          <>
            <Separator className="my-6" />
            <ApplicantEmployment prefix="app2" title="Applicant Two" />
          </>
        )}
      </CardContent>
    </Card>
  );
};
