import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface AfterAIPMortgageFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const AfterAIPMortgageForm = ({ formData, onChange }: AfterAIPMortgageFormProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-lg">Mortgage Details (Additional - After AIP)</h3>
        <p className="text-sm text-muted-foreground">Complete these fields after receiving AIP, when preparing for the formal offer.</p>
        
        {/* Expenditure */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Expenditure</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Site Price</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.site_price || ''} onChange={(e) => onChange('site_price', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Grant</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.grant_amount || ''} onChange={(e) => onChange('grant_amount', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Legal & Stamp Duty</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.legal_stamp_duty || ''} onChange={(e) => onChange('legal_stamp_duty', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Gifts</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.gifts || ''} onChange={(e) => onChange('gifts', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Repairs / Renovations</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.repairs_renovations || ''} onChange={(e) => onChange('repairs_renovations', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Other Funds</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.other_funds || ''} onChange={(e) => onChange('other_funds', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Other Costs</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.other_costs || ''} onChange={(e) => onChange('other_costs', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Scheme */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Scheme</h4>
        <div className="flex items-center gap-4">
          <Label className="w-48 text-sm text-muted-foreground">Is Purchase a Scheme?</Label>
          <Select value={formData.is_scheme || ''} onValueChange={(v) => onChange('is_scheme', v)}>
            <SelectTrigger className="flex-1 max-w-md">
              <SelectValue placeholder="Select if applicable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="local_authority">Local Authority</SelectItem>
              <SelectItem value="affordable_housing">Affordable Housing</SelectItem>
              <SelectItem value="shared_ownership">Shared Ownership</SelectItem>
              <SelectItem value="tenant_purchase">Tenant Purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator className="my-6" />
        
        {/* Remortgage Fields */}
        {(formData.mortgage_purpose === 'remortgage' || formData.mortgage_purpose === 'switcher') && (
          <>
            <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Remortgage Details</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Remortgage Amount</Label>
                  <span className="text-muted-foreground">€</span>
                  <Input className="flex-1" type="number" value={formData.remortgage_amount || ''} onChange={(e) => onChange('remortgage_amount', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Property Value</Label>
                  <span className="text-muted-foreground">€</span>
                  <Input className="flex-1" type="number" value={formData.remortgage_property_value || ''} onChange={(e) => onChange('remortgage_property_value', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Year of Original Purchase</Label>
                  <Input className="w-24" type="number" value={formData.year_original_purchase || ''} onChange={(e) => onChange('year_original_purchase', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Current Mortgage Outstanding</Label>
                  <span className="text-muted-foreground">€</span>
                  <Input className="flex-1" type="number" value={formData.current_mortgage_outstanding || ''} onChange={(e) => onChange('current_mortgage_outstanding', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">New Mortgage Required</Label>
                  <span className="text-muted-foreground">€</span>
                  <Input className="flex-1" type="number" value={formData.new_mortgage_required || ''} onChange={(e) => onChange('new_mortgage_required', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Purpose of Additional</Label>
                  <Input className="flex-1" value={formData.purpose_additional_borrowing || ''} onChange={(e) => onChange('purpose_additional_borrowing', e.target.value)} />
                </div>
              </div>
            </div>
            <Separator className="my-6" />
          </>
        )}
        
        {/* Commencement & Split Loan */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Additional Terms</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Commencement Date</Label>
              <Input className="flex-1" type="date" value={formData.commencement_date || ''} onChange={(e) => onChange('commencement_date', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Interest Only Period</Label>
              <Input className="w-24" type="number" min="0" value={formData.interest_only_period || ''} onChange={(e) => onChange('interest_only_period', parseInt(e.target.value) || 0)} />
              <span className="text-sm text-muted-foreground">months</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={formData.split_loan || false} 
                onCheckedChange={(v) => onChange('split_loan', v)} 
              />
              <Label className="text-sm">Split Loan</Label>
            </div>
          </div>
        </div>
        
        {formData.split_loan && (
          <>
            <Separator className="my-4" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h5 className="font-medium text-sm">First Loan</h5>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Amount</Label>
                  <span className="text-muted-foreground">€</span>
                  <Input className="flex-1" type="number" value={formData.split_first_amount || ''} onChange={(e) => onChange('split_first_amount', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Term (Years)</Label>
                  <Input className="w-24" type="number" value={formData.split_first_term || ''} onChange={(e) => onChange('split_first_term', parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Rate Type</Label>
                  <Select value={formData.split_first_rate_type || ''} onValueChange={(v) => onChange('split_first_rate_type', v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                      <SelectItem value="tracker">Tracker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-medium text-sm">Second Loan</h5>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Amount</Label>
                  <span className="text-muted-foreground">€</span>
                  <Input className="flex-1" type="number" value={formData.split_second_amount || ''} onChange={(e) => onChange('split_second_amount', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Term (Years)</Label>
                  <Input className="w-24" type="number" value={formData.split_second_term || ''} onChange={(e) => onChange('split_second_term', parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-48 text-sm text-muted-foreground">Rate Type</Label>
                  <Select value={formData.split_second_rate_type || ''} onValueChange={(v) => onChange('split_second_rate_type', v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                      <SelectItem value="tracker">Tracker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
