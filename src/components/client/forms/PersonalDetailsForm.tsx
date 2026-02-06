import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldFlags, validatePersonalDetails } from "@/components/client/FormFieldFlags";
import { Separator } from "@/components/ui/separator";
import { IRISH_COUNTIES, COUNTRIES } from "@/lib/irishLocations";

interface PersonalDetailsFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

// Extracted outside to prevent re-creation on every render
const ApplicantPersonalFields = ({ 
  prefix, 
  title,
  formData,
  onChange
}: { 
  prefix: 'app1' | 'app2'; 
  title: string;
  formData: any;
  onChange: (field: string, value: any) => void;
}) => (
  <div className="space-y-4">
    <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">{title}</h4>
    
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Title</Label>
          <Select value={formData[`${prefix}_title`] || ''} onValueChange={(v) => onChange(`${prefix}_title`, v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mr">Mr</SelectItem>
              <SelectItem value="mrs">Mrs</SelectItem>
              <SelectItem value="ms">Ms</SelectItem>
              <SelectItem value="miss">Miss</SelectItem>
              <SelectItem value="dr">Dr</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Forenames<span className="text-destructive">*</span></Label>
          <Input className="flex-1" value={formData[`${prefix}_forenames`] || ''} onChange={(e) => onChange(`${prefix}_forenames`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Surname<span className="text-destructive">*</span></Label>
          <Input className="flex-1" value={formData[`${prefix}_surname`] || ''} onChange={(e) => onChange(`${prefix}_surname`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Other/Previous Names</Label>
          <Input className="flex-1" value={formData[`${prefix}_other_names`] || ''} onChange={(e) => onChange(`${prefix}_other_names`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Gender</Label>
          <Select value={formData[`${prefix}_gender`] || ''} onValueChange={(v) => onChange(`${prefix}_gender`, v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Date of Birth<span className="text-destructive">*</span></Label>
          <Input className="flex-1" type="date" value={formData[`${prefix}_date_of_birth`] || ''} onChange={(e) => onChange(`${prefix}_date_of_birth`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Nationality</Label>
          <Input className="flex-1" value={formData[`${prefix}_nationality`] || 'Irish'} onChange={(e) => onChange(`${prefix}_nationality`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">PPS Number<span className="text-destructive">*</span></Label>
          <Input className="flex-1" value={formData[`${prefix}_pps_number`] || ''} onChange={(e) => onChange(`${prefix}_pps_number`, e.target.value)} />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Marital Status</Label>
          <Select value={formData[`${prefix}_marital_status`] || ''} onValueChange={(v) => onChange(`${prefix}_marital_status`, v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
              <SelectItem value="separated">Separated</SelectItem>
              <SelectItem value="cohabiting">Cohabiting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">No. of Children</Label>
          <Input className="w-24" type="number" min="0" value={formData[`${prefix}_no_of_children`] || ''} onChange={(e) => onChange(`${prefix}_no_of_children`, parseInt(e.target.value) || 0)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Children's Ages</Label>
          <Input className="flex-1" placeholder="e.g., 5, 8, 12" value={formData[`${prefix}_children_ages`] || ''} onChange={(e) => onChange(`${prefix}_children_ages`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Home Phone</Label>
          <Input className="flex-1" value={formData[`${prefix}_home_phone`] || ''} onChange={(e) => onChange(`${prefix}_home_phone`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Work Phone</Label>
          <Input className="flex-1" value={formData[`${prefix}_work_phone`] || ''} onChange={(e) => onChange(`${prefix}_work_phone`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Mobile<span className="text-destructive">*</span></Label>
          <Input className="flex-1" value={formData[`${prefix}_phone`] || ''} onChange={(e) => onChange(`${prefix}_phone`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Email<span className="text-destructive">*</span></Label>
          <Input className="flex-1" type="email" value={formData[`${prefix}_email`] || ''} onChange={(e) => onChange(`${prefix}_email`, e.target.value)} />
        </div>
      </div>
    </div>
    
    {/* Current Address */}
    <h5 className="font-medium text-sm mt-4 pt-4 border-t">Current Address</h5>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Residence Status</Label>
          <Select value={formData[`${prefix}_residence_status`] || 'owner'} onValueChange={(v) => onChange(`${prefix}_residence_status`, v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
              <SelectItem value="parents">With Parents/Relatives</SelectItem>
              <SelectItem value="friends">With Friends</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData[`${prefix}_residence_status`] === 'tenant' && (
          <div className="flex items-center gap-4">
            <Label className="w-40 text-sm text-muted-foreground">Rent per Month</Label>
            <span className="text-muted-foreground">€</span>
            <Input className="flex-1" type="number" value={formData[`${prefix}_rent_amount`] || ''} onChange={(e) => onChange(`${prefix}_rent_amount`, parseFloat(e.target.value) || 0)} />
          </div>
        )}
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Address Line 1</Label>
          <Input className="flex-1" value={formData[`${prefix}_address_line1`] || ''} onChange={(e) => onChange(`${prefix}_address_line1`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Address Line 2</Label>
          <Input className="flex-1" value={formData[`${prefix}_address_line2`] || ''} onChange={(e) => onChange(`${prefix}_address_line2`, e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Address Line 3</Label>
          <Input className="flex-1" value={formData[`${prefix}_address_line3`] || ''} onChange={(e) => onChange(`${prefix}_address_line3`, e.target.value)} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">County</Label>
          <Select value={formData[`${prefix}_county`] || ''} onValueChange={(v) => onChange(`${prefix}_county`, v)}>
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
          <Select value={formData[`${prefix}_country`] || 'Ireland'} onValueChange={(v) => onChange(`${prefix}_country`, v)}>
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
        <div className="flex items-center gap-4">
          <Label className="w-40 text-sm text-muted-foreground">Years at Address</Label>
          <Input className="w-20" type="number" min="0" value={formData[`${prefix}_years_at_address`] || ''} onChange={(e) => onChange(`${prefix}_years_at_address`, parseInt(e.target.value) || 0)} />
        </div>
      </div>
    </div>
    
    {/* Previous Address if less than 3 years */}
    {(formData[`${prefix}_years_at_address`] || 0) < 3 && (
      <>
        <h5 className="font-medium text-sm mt-4 pt-4 border-t">Previous Address (required if less than 3 years at current)</h5>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Previous Address</Label>
              <Textarea className="flex-1" rows={2} value={formData[`${prefix}_previous_address`] || ''} onChange={(e) => onChange(`${prefix}_previous_address`, e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Years at Previous</Label>
              <Input className="w-20" type="number" min="0" value={formData[`${prefix}_previous_years`] || ''} onChange={(e) => onChange(`${prefix}_previous_years`, parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);

export const PersonalDetailsForm = ({ formData, onChange }: PersonalDetailsFormProps) => {
  const flags = validatePersonalDetails(formData);

  return (
    <div className="space-y-4">
      <FormFieldFlags flags={flags} />
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-4">Section A – Personal Details</h3>
          
          <ApplicantPersonalFields prefix="app1" title="Applicant One" formData={formData} onChange={onChange} />
          
          <Separator className="my-6" />
          
          {/* Applicant 2 Toggle */}
          <div className="flex items-center gap-3 mb-4">
            <Checkbox 
              checked={formData.app2_enabled || false} 
              onCheckedChange={(v) => onChange('app2_enabled', v)} 
            />
            <Label className="font-medium">Add Second Applicant</Label>
          </div>
          
          {formData.app2_enabled && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Checkbox 
                  checked={formData.app2_is_guarantor || false} 
                  onCheckedChange={(v) => onChange('app2_is_guarantor', v)} 
                />
                <Label className="text-sm text-muted-foreground">Applicant 2 is a Guarantor only</Label>
              </div>
              
              <ApplicantPersonalFields prefix="app2" title="Applicant Two" formData={formData} onChange={onChange} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
