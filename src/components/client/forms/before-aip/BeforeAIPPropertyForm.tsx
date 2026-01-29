import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface BeforeAIPPropertyFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const BeforeAIPPropertyForm = ({ formData, onChange }: BeforeAIPPropertyFormProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h3 className="font-bold text-lg">Property Details (AIP Level)</h3>
        
        {/* Property Address */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Property Address</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Address Line 1</Label>
              <Input className="flex-1" value={formData.property_address_line1 || ''} onChange={(e) => onChange('property_address_line1', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Address Line 2</Label>
              <Input className="flex-1" value={formData.property_address_line2 || ''} onChange={(e) => onChange('property_address_line2', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Address Line 3</Label>
              <Input className="flex-1" value={formData.property_address_line3 || ''} onChange={(e) => onChange('property_address_line3', e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">County</Label>
              <Input className="flex-1" value={formData.property_county || ''} onChange={(e) => onChange('property_county', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Country</Label>
              <Input className="flex-1" value={formData.property_country || 'Ireland'} onChange={(e) => onChange('property_country', e.target.value)} />
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Property Details */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Property Details</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Property Type</Label>
              <Select value={formData.property_type || ''} onValueChange={(v) => onChange('property_type', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newly_built_house">Newly Built House</SelectItem>
                  <SelectItem value="one_off_build">One-off Built House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="second_hand">Second Hand Property</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Estimated Value</Label>
              <span className="text-muted-foreground">€</span>
              <Input className="flex-1" type="number" value={formData.property_estimated_value || ''} onChange={(e) => onChange('property_estimated_value', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Est. Closing Date</Label>
              <Input className="flex-1" type="date" value={formData.estimated_closing_date || ''} onChange={(e) => onChange('estimated_closing_date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Tenure</Label>
              <Select value={formData.property_tenure || 'freehold'} onValueChange={(v) => onChange('property_tenure', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freehold">Freehold</SelectItem>
                  <SelectItem value="leasehold">Leasehold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={formData.property_vacant_possession !== false} 
                onCheckedChange={(v) => onChange('property_vacant_possession', v)} 
              />
              <Label className="text-sm">Vacant Possession</Label>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Age of Property</Label>
              <Input className="w-24" type="number" min="0" value={formData.year_built || ''} onChange={(e) => onChange('year_built', parseInt(e.target.value) || 0)} placeholder="Year" />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm text-muted-foreground">Construction Type</Label>
              <Input className="flex-1" value={formData.property_construction_type || ''} onChange={(e) => onChange('property_construction_type', e.target.value)} placeholder="e.g., Standard, Timber Frame" />
            </div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Number of Rooms */}
        <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded">Number of Rooms</h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Living Rooms</Label>
            <Input type="number" min="0" value={formData.property_num_living_rooms || ''} onChange={(e) => onChange('property_num_living_rooms', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dining Rooms</Label>
            <Input type="number" min="0" value={formData.property_num_dining_rooms || ''} onChange={(e) => onChange('property_num_dining_rooms', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bedrooms</Label>
            <Input type="number" min="0" value={formData.property_num_bedrooms || ''} onChange={(e) => onChange('property_num_bedrooms', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bathrooms</Label>
            <Input type="number" min="0" value={formData.property_num_bathrooms || ''} onChange={(e) => onChange('property_num_bathrooms', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kitchens</Label>
            <Input type="number" min="0" value={formData.property_num_kitchens || ''} onChange={(e) => onChange('property_num_kitchens', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Utility Rooms</Label>
            <Input type="number" min="0" value={formData.property_num_utility_rooms || ''} onChange={(e) => onChange('property_num_utility_rooms', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Additional */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={formData.property_private_owner_occupation !== false} 
              onCheckedChange={(v) => onChange('property_private_owner_occupation', v)} 
            />
            <Label className="text-sm">Private Owner Occupation Only</Label>
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-40 text-sm text-muted-foreground">Purpose</Label>
            <Select value={formData.property_purpose || ''} onValueChange={(v) => onChange('property_purpose', v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary_residence">Primary Residence</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="holiday_home">Holiday Home</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
