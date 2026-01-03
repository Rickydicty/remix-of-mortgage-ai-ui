import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormFieldFlags, validatePropertyDetails } from "@/components/client/FormFieldFlags";
import { Separator } from "@/components/ui/separator";

interface PropertyDetailsFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const PropertyDetailsForm = ({ formData, onChange }: PropertyDetailsFormProps) => {
  const flags = validatePropertyDetails(formData);

  return (
    <div className="space-y-4">
      <FormFieldFlags flags={flags} />
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-4">Section E – Property Details</h3>
          
          {/* Property Address */}
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Property</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
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
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">County</Label>
                <Input className="flex-1" value={formData.property_county || ''} onChange={(e) => onChange('property_county', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Country</Label>
                <Input className="flex-1" value={formData.property_country || 'Ireland'} onChange={(e) => onChange('property_country', e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Property Type</Label>
                <Select value={formData.property_type || ''} onValueChange={(v) => onChange('property_type', v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newly_built_house">Newly Built House</SelectItem>
                    <SelectItem value="one_off_build">One Off Built House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="second_hand">Second Hand Property</SelectItem>
                    <SelectItem value="bungalow">Bungalow</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">New or Secondhand</Label>
                <Select value={formData.property_new_or_secondhand || ''} onValueChange={(v) => onChange('property_new_or_secondhand', v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Property</SelectItem>
                    <SelectItem value="secondhand">Second Hand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Est. Closing Date</Label>
                <Input className="flex-1" type="date" value={formData.estimated_closing_date || ''} onChange={(e) => onChange('estimated_closing_date', e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Estimated Value</Label>
                <span className="text-muted-foreground">€</span>
                <Input className="flex-1" type="number" value={formData.property_estimated_value || ''} onChange={(e) => onChange('property_estimated_value', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Number of Rooms */}
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Number of Rooms</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
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
          </div>
          
          <Separator className="my-6" />
          
          {/* Property Details */}
          <h4 className="font-semibold text-primary bg-primary/10 px-3 py-2 rounded mb-4">Additional Details</h4>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Year Built</Label>
                <Input className="w-28" type="number" min="1800" max="2030" value={formData.year_built || ''} onChange={(e) => onChange('year_built', parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">BER Rating</Label>
                <Select value={formData.ber_rating || ''} onValueChange={(v) => onChange('ber_rating', v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                    <SelectItem value="B3">B3</SelectItem>
                    <SelectItem value="C1">C1</SelectItem>
                    <SelectItem value="C2">C2</SelectItem>
                    <SelectItem value="C3">C3</SelectItem>
                    <SelectItem value="D1">D1</SelectItem>
                    <SelectItem value="D2">D2</SelectItem>
                    <SelectItem value="E1">E1</SelectItem>
                    <SelectItem value="E2">E2</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                    <SelectItem value="exempt">Exempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {formData.property_tenure === 'leasehold' && (
                <div className="flex items-center gap-4">
                  <Label className="w-40 text-sm text-muted-foreground">Lease Years Remaining</Label>
                  <Input className="w-28" type="number" min="0" value={formData.property_lease_years || ''} onChange={(e) => onChange('property_lease_years', parseInt(e.target.value) || 0)} />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-sm text-muted-foreground">Construction Type</Label>
                <Input className="flex-1" value={formData.property_construction_type || ''} onChange={(e) => onChange('property_construction_type', e.target.value)} placeholder="e.g., Standard, Timber Frame" />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={formData.property_vacant_possession !== false} 
                  onCheckedChange={(v) => onChange('property_vacant_possession', v)} 
                />
                <Label className="text-sm">Vacant Possession</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
