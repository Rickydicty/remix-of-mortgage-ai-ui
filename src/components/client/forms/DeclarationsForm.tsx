import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FormFieldFlags, validateDeclarationsDetails } from "@/components/client/FormFieldFlags";

interface DeclarationsFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const DeclarationsForm = ({ formData, onChange }: DeclarationsFormProps) => {
  const flags = validateDeclarationsDetails(formData);

  return (
    <div className="space-y-4">
      <FormFieldFlags flags={flags} />
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-4">Section G – Declarations</h3>
        
        {/* Comments & Declarations */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Comments & Declarations</h4>
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.declarations_signed || false} 
              onCheckedChange={(v) => onChange('declarations_signed', v)} 
            />
            <Label className="text-sm">Declarations have been signed</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_consumer_credit || false} 
              onCheckedChange={(v) => onChange('consent_consumer_credit', v)} 
            />
            <Label className="text-sm">Customer has consented to Consumer Credit Act</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.consent_data_protection || false} 
              onCheckedChange={(v) => onChange('consent_data_protection', v)} 
            />
            <Label className="text-sm">Customer has consented to Data Protection Act</Label>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Consents */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Consents – Contact Preferences</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        </div>
        
        <Separator className="my-6" />
        
        {/* Broker Notes */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Additional Notes</h4>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Broker Notes / Additional Comments</Label>
            <Textarea 
              rows={4}
              placeholder="Any additional information relevant to the application..."
              value={formData.broker_notes || ''} 
              onChange={(e) => onChange('broker_notes', e.target.value)} 
            />
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
