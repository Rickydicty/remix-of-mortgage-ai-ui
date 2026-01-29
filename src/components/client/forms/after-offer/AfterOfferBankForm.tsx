import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AfterOfferBankFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const AfterOfferBankForm = ({ formData, onChange }: AfterOfferBankFormProps) => {
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
              <Label className="w-40 text-sm text-muted-foreground">Sort Code<span className="text-destructive">*</span></Label>
              <Input className="flex-1" value={formData.dd_sort_code || ''} onChange={(e) => onChange('dd_sort_code', e.target.value)} placeholder="XX-XX-XX" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Account Number<span className="text-destructive">*</span></Label>
              <Input className="flex-1" value={formData.dd_account_number || ''} onChange={(e) => onChange('dd_account_number', e.target.value)} />
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
              <Input className="flex-1" value={formData.dd_bank_county || ''} onChange={(e) => onChange('dd_bank_county', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Country</Label>
              <Input className="flex-1" value={formData.dd_bank_country || 'Ireland'} onChange={(e) => onChange('dd_bank_country', e.target.value)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
