import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormFieldFlags, validateMortgageDetails } from "@/components/client/FormFieldFlags";
import { Separator } from "@/components/ui/separator";

interface MortgageDetailsFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const MortgageDetailsForm = ({ formData, onChange }: MortgageDetailsFormProps) => {
  const flags = validateMortgageDetails(formData);

  return (
    <div className="space-y-4">
      <FormFieldFlags flags={flags} />
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-4">Section D – Mortgage Details</h3>
          
          {/* Customer Type */}
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Customer Type</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Mortgage Purpose</Label>
                <Select value={formData.mortgage_purpose || ''} onValueChange={(v) => onChange('mortgage_purpose', v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_time_buyer">First Time Buyer</SelectItem>
                    <SelectItem value="remortgage">Remortgage</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="investment_property">Residential Investment Property</SelectItem>
                    <SelectItem value="let_to_buy">Let to Buy</SelectItem>
                    <SelectItem value="top_up">Top-up</SelectItem>
                    <SelectItem value="switcher">Switcher</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={formData.first_time_buyer || false} 
                  onCheckedChange={(v) => onChange('first_time_buyer', v)} 
                />
                <Label className="text-sm">First Time Buyer</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={formData.max_approval_required || false} 
                  onCheckedChange={(v) => onChange('max_approval_required', v)} 
                />
                <Label className="text-sm">Max Approval Required</Label>
              </div>
            </div>
            <div className="space-y-3">
              {formData.app2_enabled && (
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={formData.joint_title !== false} 
                    onCheckedChange={(v) => onChange('joint_title', v)} 
                  />
                  <Label className="text-sm">Title of property to be in joint names</Label>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={formData.help_to_buy || false} 
                  onCheckedChange={(v) => onChange('help_to_buy', v)} 
                />
                <Label className="text-sm">Help to Buy Scheme</Label>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Purchase Section */}
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Section One (Purchase)</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Purchase Price / Property Value</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.property_value || ''} onChange={(e) => onChange('property_value', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Deposit Amount</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.deposit_amount || ''} onChange={(e) => onChange('deposit_amount', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Loan Amount Required</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.loan_amount || ''} onChange={(e) => onChange('loan_amount', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Savings</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.savings || ''} onChange={(e) => onChange('savings', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">LTV Ratio:</span>
                  <span className="font-semibold">
                    {formData.property_value > 0 
                      ? ((formData.loan_amount / formData.property_value) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Mortgage Terms */}
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Mortgage</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Mortgage Term (Years)</Label>
                <Input className="w-24" type="number" min="1" max="40" value={formData.mortgage_term || ''} onChange={(e) => onChange('mortgage_term', parseInt(e.target.value) || 25)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Repayment Method</Label>
                <Select value={formData.repayment_method || 'repayment'} onValueChange={(v) => onChange('repayment_method', v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repayment">Repayment/Annuity</SelectItem>
                    <SelectItem value="interest_only">Interest Only</SelectItem>
                    <SelectItem value="endowment">Endowment Mortgage</SelectItem>
                    <SelectItem value="pension">Pension Backed</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Rate Type</Label>
                <Select value={formData.rate_type || 'fixed'} onValueChange={(v) => onChange('rate_type', v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                    <SelectItem value="tracker">Tracker</SelectItem>
                    <SelectItem value="discount_variable">Discount Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.rate_type === 'fixed' && (
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Fixed for (years)</Label>
                  <Input className="w-24" type="number" min="1" max="10" value={formData.fixed_rate_years || ''} onChange={(e) => onChange('fixed_rate_years', parseInt(e.target.value) || 0)} />
                </div>
              )}
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Solicitor Details */}
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Solicitor</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Solicitor Name</Label>
                <Input className="flex-1" value={formData.solicitor_name || ''} onChange={(e) => onChange('solicitor_name', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Address Line 1</Label>
                <Input className="flex-1" value={formData.solicitor_address_line1 || ''} onChange={(e) => onChange('solicitor_address_line1', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Address Line 2</Label>
                <Input className="flex-1" value={formData.solicitor_address_line2 || ''} onChange={(e) => onChange('solicitor_address_line2', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Address Line 3</Label>
                <Input className="flex-1" value={formData.solicitor_address_line3 || ''} onChange={(e) => onChange('solicitor_address_line3', e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">County</Label>
                <Input className="flex-1" value={formData.solicitor_county || ''} onChange={(e) => onChange('solicitor_county', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Phone</Label>
                <Input className="flex-1" value={formData.solicitor_phone || ''} onChange={(e) => onChange('solicitor_phone', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Email</Label>
                <Input className="flex-1" type="email" value={formData.solicitor_email || ''} onChange={(e) => onChange('solicitor_email', e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
