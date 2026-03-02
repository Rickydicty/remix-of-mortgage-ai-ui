import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IRISH_COUNTIES, COUNTRIES } from "@/lib/irishLocations";

interface AfterOfferBankFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const AfterOfferBankForm = ({ formData, onChange }: AfterOfferBankFormProps) => {
  const formatIban = (value: string) => {
    const clean = value.replace(/\s/g, '').toUpperCase();
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-lg">Direct Debit Details (After Loan Offer)</h3>
        <p className="text-sm text-muted-foreground">Complete these details after receiving your formal loan offer for setting up the direct debit.</p>
        
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Bank Account for Direct Debit</h4>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Bank Name<span className="text-destructive">*</span></Label>
              <Input className="flex-1" value={formData.dd_bank_name || ''} onChange={(e) => onChange('dd_bank_name', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Account Name(s)<span className="text-destructive">*</span></Label>
              <Input className="flex-1" value={formData.dd_account_names || ''} onChange={(e) => onChange('dd_account_names', e.target.value)} placeholder="Name(s) on account" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">IBAN<span className="text-destructive">*</span></Label>
              <Input
                className="flex-1 font-mono tracking-wider"
                value={formData.dd_iban || formData.dd_sort_code || ''}
                onChange={(e) => onChange('dd_iban', formatIban(e.target.value))}
                placeholder="IE29 AIBK 9311 5212 3456 78"
                maxLength={42}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">BIC / SWIFT</Label>
              <Input
                className="flex-1 font-mono"
                value={formData.dd_bic || ''}
                onChange={(e) => onChange('dd_bic', e.target.value.toUpperCase())}
                placeholder="AIBKIE2D"
                maxLength={11}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Debit Day of Month</Label>
              <Input className="w-24" type="number" min="1" max="28" value={formData.dd_debit_day || ''} onChange={(e) => onChange('dd_debit_day', parseInt(e.target.value) || 1)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Bank Address Line 1</Label>
              <Input className="flex-1" value={formData.dd_bank_line1 || ''} onChange={(e) => onChange('dd_bank_line1', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">County</Label>
              <Select value={formData.dd_bank_county || ''} onValueChange={(v) => onChange('dd_bank_county', v)}>
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
              <Select value={formData.dd_bank_country || 'Ireland'} onValueChange={(v) => onChange('dd_bank_country', v)}>
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
        </div>
      </CardContent>
    </Card>
  );
};
