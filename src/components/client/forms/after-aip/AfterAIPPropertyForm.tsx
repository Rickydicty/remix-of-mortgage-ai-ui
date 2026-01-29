import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface AfterAIPPropertyFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const AfterAIPPropertyForm = ({ formData, onChange }: AfterAIPPropertyFormProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-lg">Property Details (Additional - After AIP)</h3>
        <p className="text-sm text-muted-foreground">Complete these fields after receiving AIP, when preparing for the formal offer.</p>
        
        {/* New Build Fields */}
        {formData.property_new && (
          <>
            <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">New Build Details</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData.homebuilders_bond || false} onCheckedChange={(v) => onChange('homebuilders_bond', v)} />
                  <Label className="text-sm">Homebuilders Bond</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData.direct_labour || false} onCheckedChange={(v) => onChange('direct_labour', v)} />
                  <Label className="text-sm">Direct Labour Construction</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData.part_of_development || false} onCheckedChange={(v) => onChange('part_of_development', v)} />
                  <Label className="text-sm">Part of Development</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData.fixed_price_contract || false} onCheckedChange={(v) => onChange('fixed_price_contract', v)} />
                  <Label className="text-sm">Fixed Price Contract</Label>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData.stage_payments_required || false} onCheckedChange={(v) => onChange('stage_payments_required', v)} />
                  <Label className="text-sm">Stage Payments Required</Label>
                </div>
                {formData.stage_payments_required && (
                  <div className="flex items-center gap-4 ml-6">
                    <Label className="text-sm text-muted-foreground">Number of Payments</Label>
                    <Input className="w-24" type="number" min="1" value={formData.num_stage_payments || ''} onChange={(e) => onChange('num_stage_payments', parseInt(e.target.value) || 0)} />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData.architect_supervision || false} onCheckedChange={(v) => onChange('architect_supervision', v)} />
                  <Label className="text-sm">Architect Supervision</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData.hb47_available || false} onCheckedChange={(v) => onChange('hb47_available', v)} />
                  <Label className="text-sm">HB47 / Architect Certificate Available</Label>
                </div>
              </div>
            </div>
            <Separator className="my-6" />
          </>
        )}
        
        {/* Apartment Specific */}
        {formData.property_type === 'apartment' && (
          <>
            <div className="flex items-center gap-4">
              <Label className="w-48 text-sm text-muted-foreground">Number of Floors</Label>
              <Input className="w-24" type="number" min="1" value={formData.property_floors || ''} onChange={(e) => onChange('property_floors', parseInt(e.target.value) || 0)} />
            </div>
            <Separator className="my-6" />
          </>
        )}
        
        {/* Property New Toggle */}
        <div className="flex items-center gap-3">
          <Checkbox checked={formData.property_new || false} onCheckedChange={(v) => onChange('property_new', v)} />
          <Label className="text-sm font-medium">This is a New Property (enables new build fields above)</Label>
        </div>
        
        <Separator className="my-6" />
        
        {/* Selling Agent */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Selling Agent Details</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Name</Label>
              <Input className="flex-1" value={formData.selling_agent_name || ''} onChange={(e) => onChange('selling_agent_name', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Telephone</Label>
              <Input className="flex-1" value={formData.selling_agent_phone || ''} onChange={(e) => onChange('selling_agent_phone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Address</Label>
              <Input className="flex-1" value={formData.selling_agent_address || ''} onChange={(e) => onChange('selling_agent_address', e.target.value)} />
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Valuer Details */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Valuer Details</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Name</Label>
              <Input className="flex-1" value={formData.valuer_name || ''} onChange={(e) => onChange('valuer_name', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Company</Label>
              <Input className="flex-1" value={formData.valuer_company || ''} onChange={(e) => onChange('valuer_company', e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Telephone</Label>
              <Input className="flex-1" value={formData.valuer_phone || ''} onChange={(e) => onChange('valuer_phone', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Address</Label>
              <Input className="flex-1" value={formData.valuer_address || ''} onChange={(e) => onChange('valuer_address', e.target.value)} />
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Contact for Valuation Access */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Contact for Valuation Access</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Name</Label>
              <Input className="flex-1" value={formData.valuation_contact_name || ''} onChange={(e) => onChange('valuation_contact_name', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Telephone</Label>
              <Input className="flex-1" value={formData.valuation_contact_phone || ''} onChange={(e) => onChange('valuation_contact_phone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Address</Label>
              <Input className="flex-1" value={formData.valuation_contact_address || ''} onChange={(e) => onChange('valuation_contact_address', e.target.value)} />
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Architect & Builder */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Architect & Builder</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Architect Name</Label>
              <Input className="flex-1" value={formData.architect_name || ''} onChange={(e) => onChange('architect_name', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Architect Phone</Label>
              <Input className="flex-1" value={formData.architect_phone || ''} onChange={(e) => onChange('architect_phone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Builder Name</Label>
              <Input className="flex-1" value={formData.builder_name || ''} onChange={(e) => onChange('builder_name', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Builder Phone</Label>
              <Input className="flex-1" value={formData.builder_phone || ''} onChange={(e) => onChange('builder_phone', e.target.value)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
