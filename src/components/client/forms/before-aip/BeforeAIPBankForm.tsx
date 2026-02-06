import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { IRISH_COUNTIES, COUNTRIES } from "@/lib/irishLocations";

interface BeforeAIPBankFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const BeforeAIPBankForm = ({ formData, onChange }: BeforeAIPBankFormProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-lg">Bank Details</h3>
        
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Current Bank / Building Society</h4>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Bank Name<span className="text-destructive">*</span></Label>
              <Input className="flex-1" value={formData.bank_name || ''} onChange={(e) => onChange('bank_name', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Address Line 1</Label>
              <Input className="flex-1" value={formData.bank_line1 || ''} onChange={(e) => onChange('bank_line1', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Address Line 2</Label>
              <Input className="flex-1" value={formData.bank_line2 || ''} onChange={(e) => onChange('bank_line2', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Address Line 3</Label>
              <Input className="flex-1" value={formData.bank_line3 || ''} onChange={(e) => onChange('bank_line3', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">County</Label>
              <Select value={formData.bank_county || ''} onValueChange={(v) => onChange('bank_county', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select County" />
                </SelectTrigger>
                <SelectContent>
                  {IRISH_COUNTIES.map((county) => (
                    <SelectItem key={county} value={county}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Country</Label>
              <Select value={formData.bank_country || 'Ireland'} onValueChange={(v) => onChange('bank_country', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Account Type</Label>
              <Select value={formData.bank_account_type || ''} onValueChange={(v) => onChange('bank_account_type', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
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
              <Label className="w-40 text-sm text-muted-foreground">Sort Code</Label>
              <Input className="flex-1" value={formData.bank_sort_code || ''} onChange={(e) => onChange('bank_sort_code', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Account Held Since</Label>
              <Input className="w-16" type="number" min="0" placeholder="Yrs" value={formData.bank_years_held || ''} onChange={(e) => onChange('bank_years_held', parseInt(e.target.value) || 0)} />
              <span className="text-xs text-muted-foreground">years</span>
              <Input className="w-16" type="number" min="0" max="11" placeholder="Mths" value={formData.bank_months_held || ''} onChange={(e) => onChange('bank_months_held', parseInt(e.target.value) || 0)} />
              <span className="text-xs text-muted-foreground">months</span>
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Savings Accounts - simplified for now */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Savings</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4">
            <Label className="w-48 text-sm text-muted-foreground">Total Savings</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="flex-1" type="number" value={formData.savings || ''} onChange={(e) => onChange('savings', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
