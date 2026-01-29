import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface AfterOfferDeclarationsFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const AfterOfferDeclarationsForm = ({ formData, onChange }: AfterOfferDeclarationsFormProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-lg">Declarations & Consents</h3>
        <p className="text-sm text-muted-foreground">Complete these declarations and consents as part of the final compliance stage.</p>
        
        {/* Declarations */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Declarations</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.declarations_signed || false} 
              onCheckedChange={(v) => onChange('declarations_signed', v)} 
            />
            <Label className="text-sm">Declarations Signed</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_consumer_credit || false} 
              onCheckedChange={(v) => onChange('consent_consumer_credit', v)} 
            />
            <Label className="text-sm">Consent – Consumer Credit Act</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_data_protection || false} 
              onCheckedChange={(v) => onChange('consent_data_protection', v)} 
            />
            <Label className="text-sm">Consent – Data Protection Act</Label>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Contact Permissions */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Contact Permissions</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_contact_home !== false} 
              onCheckedChange={(v) => onChange('consent_contact_home', v)} 
            />
            <Label className="text-sm">At Home</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_contact_work || false} 
              onCheckedChange={(v) => onChange('consent_contact_work', v)} 
            />
            <Label className="text-sm">At Work</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_leave_message !== false} 
              onCheckedChange={(v) => onChange('consent_leave_message', v)} 
            />
            <Label className="text-sm">Leave Message at Home</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_contact_employer || false} 
              onCheckedChange={(v) => onChange('consent_contact_employer', v)} 
            />
            <Label className="text-sm">Contact Employer</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_email !== false} 
              onCheckedChange={(v) => onChange('consent_email', v)} 
            />
            <Label className="text-sm">Email</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_sms !== false} 
              onCheckedChange={(v) => onChange('consent_sms', v)} 
            />
            <Label className="text-sm">SMS</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consented_to_be_contacted !== false} 
              onCheckedChange={(v) => onChange('consented_to_be_contacted', v)} 
            />
            <Label className="text-sm">Consented to be Contacted</Label>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Signature Details */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Signature Details</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Customer Address</Label>
              <Textarea className="flex-1" rows={2} value={formData.customer_address || ''} onChange={(e) => onChange('customer_address', e.target.value)} placeholder="Address for signature verification" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Date Signed</Label>
              <Input className="flex-1" type="date" value={formData.date_signed || ''} onChange={(e) => onChange('date_signed', e.target.value)} />
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Broker Notes */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Additional Notes</h4>
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Broker Notes / Additional Comments</Label>
          <Textarea 
            rows={4}
            placeholder="Any additional information relevant to the application..."
            value={formData.broker_notes || ''} 
            onChange={(e) => onChange('broker_notes', e.target.value)} 
          />
        </div>
      </CardContent>
    </Card>
  );
};
