import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface BeforeAIPMortgageFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const BeforeAIPMortgageForm = ({ formData, onChange }: BeforeAIPMortgageFormProps) => {
  const ltv = formData.property_value > 0 
    ? ((formData.loan_amount / formData.property_value) * 100).toFixed(1) 
    : 0;

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-lg">Mortgage Details (AIP Level)</h3>
        
        {/* Customer Type */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Customer Type</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Customer Type</Label>
              <Select value={formData.customer_type || ''} onValueChange={(v) => onChange('customer_type', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time_buyer">First Time Buyer</SelectItem>
                  <SelectItem value="remortgage_house">Remortgage House</SelectItem>
                  <SelectItem value="second_property">Second Property</SelectItem>
                  <SelectItem value="residential_property">Residential Property (RP)</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Purpose of Loan</Label>
              <Select value={formData.mortgage_purpose || ''} onValueChange={(v) => onChange('mortgage_purpose', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time_buyer">First Time Buyer</SelectItem>
                  <SelectItem value="remortgage">Re-Mortgage</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="investment_property">Residential Investment Property</SelectItem>
                  <SelectItem value="let_to_buy">Let to Buy</SelectItem>
                  <SelectItem value="top_up">Top-up</SelectItem>
                  <SelectItem value="switcher">Switcher</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.app2_enabled && (
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={formData.joint_title !== false} 
                  onCheckedChange={(v) => onChange('joint_title', v)} 
                />
                <Label className="text-sm">Property in Joint Names</Label>
              </div>
            )}
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Purchase Section */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Purchase</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Purchase Price<span className="text-destructive">*</span></Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.property_value || ''} onChange={(e) => onChange('property_value', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Savings</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.savings || ''} onChange={(e) => onChange('savings', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Deposit Amount</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.deposit_amount || ''} onChange={(e) => onChange('deposit_amount', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Finance:</span>
                <span className="font-semibold">€{((formData.property_value || 0) - (formData.deposit_amount || 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Mortgage Terms */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Mortgage</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Repayment Method</Label>
              <Select value={formData.repayment_method || 'repayment'} onValueChange={(v) => onChange('repayment_method', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="repayment">Repayment/Annuity</SelectItem>
                  <SelectItem value="interest_only">Interest Only</SelectItem>
                  <SelectItem value="endowment">Endowment</SelectItem>
                  <SelectItem value="pension">Pension</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Mortgage Term (Years)<span className="text-destructive">*</span></Label>
              <Input className="w-24" type="number" min="1" max="40" value={formData.mortgage_term || ''} onChange={(e) => onChange('mortgage_term', parseInt(e.target.value) || 25)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Loan Amount<span className="text-destructive">*</span></Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.loan_amount || ''} onChange={(e) => onChange('loan_amount', parseFloat(e.target.value) || 0)} />
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
                  <SelectItem value="tracker">Tracker</SelectItem>
                  <SelectItem value="discount_variable">Discount Variable</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.rate_type === 'fixed' && (
              <div className="flex items-center gap-4">
                <Label className="w-48 text-sm text-muted-foreground">Fixed Period (Years)</Label>
                <Input className="w-24" type="number" min="1" max="10" value={formData.fixed_rate_years || ''} onChange={(e) => onChange('fixed_rate_years', parseInt(e.target.value) || 0)} />
              </div>
            )}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">LTV Ratio:</span>
                <span className="font-semibold">{ltv}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
