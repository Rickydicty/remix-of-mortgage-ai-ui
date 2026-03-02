import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { IRISH_COUNTIES, COUNTRIES } from "@/lib/irishLocations";
import { Plus, Trash2 } from "lucide-react";

interface BankAccount {
  bank_name: string;
  iban: string;
  bic: string;
  account_type: string;
  years_held: number;
  months_held: number;
  bank_line1: string;
  bank_line2: string;
  bank_county: string;
  bank_country: string;
}

const emptyAccount: BankAccount = {
  bank_name: '',
  iban: '',
  bic: '',
  account_type: '',
  years_held: 0,
  months_held: 0,
  bank_line1: '',
  bank_line2: '',
  bank_county: '',
  bank_country: 'Ireland',
};

interface BeforeAIPBankFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const BeforeAIPBankForm = ({ formData, onChange }: BeforeAIPBankFormProps) => {
  // Support multiple accounts stored as JSON array, with backward compat
  const accounts: BankAccount[] = (() => {
    if (formData.bank_accounts && Array.isArray(formData.bank_accounts)) {
      return formData.bank_accounts;
    }
    // Migrate legacy single-account fields
    return [{
      bank_name: formData.bank_name || '',
      iban: formData.bank_sort_code || '', // migrate sort code field to IBAN
      bic: formData.bic || '',
      account_type: formData.bank_account_type || '',
      years_held: formData.bank_years_held || 0,
      months_held: formData.bank_months_held || 0,
      bank_line1: formData.bank_line1 || '',
      bank_line2: formData.bank_line2 || '',
      bank_county: formData.bank_county || '',
      bank_country: formData.bank_country || 'Ireland',
    }];
  })();

  const updateAccount = (index: number, field: keyof BankAccount, value: any) => {
    const updated = [...accounts];
    updated[index] = { ...updated[index], [field]: value };
    onChange('bank_accounts', updated);
    // Keep legacy fields in sync for first account (DB compat)
    if (index === 0) {
      if (field === 'bank_name') onChange('bank_name', value);
      if (field === 'iban') onChange('bank_sort_code', value);
      if (field === 'account_type') onChange('bank_account_type', value);
      if (field === 'years_held') onChange('bank_years_held', value);
      if (field === 'months_held') onChange('bank_months_held', value);
    }
  };

  const addAccount = () => {
    onChange('bank_accounts', [...accounts, { ...emptyAccount }]);
  };

  const removeAccount = (index: number) => {
    if (accounts.length <= 1) return;
    const updated = accounts.filter((_, i) => i !== index);
    onChange('bank_accounts', updated);
  };

  const formatIban = (value: string) => {
    // Remove spaces, uppercase, then add spaces every 4 chars
    const clean = value.replace(/\s/g, '').toUpperCase();
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Bank Details</h3>
          <Button type="button" variant="outline" size="sm" onClick={addAccount} className="gap-1">
            <Plus className="h-4 w-4" /> Add Account
          </Button>
        </div>

        {accounts.map((account, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">
                {accounts.length > 1 ? `Account ${idx + 1}` : 'Current Bank / Building Society'}
              </h4>
              {accounts.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeAccount(idx)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Bank Name<span className="text-destructive">*</span></Label>
                  <Input className="flex-1" value={account.bank_name} onChange={(e) => updateAccount(idx, 'bank_name', e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">IBAN<span className="text-destructive">*</span></Label>
                  <Input
                    className="flex-1 font-mono tracking-wider"
                    value={account.iban}
                    onChange={(e) => updateAccount(idx, 'iban', formatIban(e.target.value))}
                    placeholder="IE29 AIBK 9311 5212 3456 78"
                    maxLength={42}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">BIC / SWIFT</Label>
                  <Input
                    className="flex-1 font-mono"
                    value={account.bic}
                    onChange={(e) => updateAccount(idx, 'bic', e.target.value.toUpperCase())}
                    placeholder="AIBKIE2D"
                    maxLength={11}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Address Line 1</Label>
                  <Input className="flex-1" value={account.bank_line1} onChange={(e) => updateAccount(idx, 'bank_line1', e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Account Type</Label>
                  <Select value={account.account_type} onValueChange={(v) => updateAccount(idx, 'account_type', v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Account Held Since</Label>
                  <Input className="w-16" type="number" min="0" placeholder="Yrs" value={account.years_held || ''} onChange={(e) => updateAccount(idx, 'years_held', parseInt(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground">years</span>
                  <Input className="w-16" type="number" min="0" max="11" placeholder="Mths" value={account.months_held || ''} onChange={(e) => updateAccount(idx, 'months_held', parseInt(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground">months</span>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">County</Label>
                  <Select value={account.bank_county} onValueChange={(v) => updateAccount(idx, 'bank_county', v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select County" /></SelectTrigger>
                    <SelectContent>
                      {IRISH_COUNTIES.map((county) => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Country</Label>
                  <Select value={account.bank_country || 'Ireland'} onValueChange={(v) => updateAccount(idx, 'bank_country', v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {idx < accounts.length - 1 && <Separator className="my-4" />}
          </div>
        ))}

        <Separator className="my-6" />

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
