import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { MappedField, formatFieldValue } from "@/lib/documentFormMapping";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentFieldMapperProps {
  mappedFields: MappedField[];
  applicationId: string;
  userId: string;
  documentType: string;
  onMappingComplete?: () => void;
}

const DocumentFieldMapper = ({
  mappedFields,
  applicationId,
  userId,
  documentType,
  onMappingComplete,
}: DocumentFieldMapperProps) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(mappedFields.filter(f => !f.hasConflict).map(f => f.formField))
  );
  const [applying, setApplying] = useState(false);

  if (mappedFields.length === 0) {
    return null;
  }

  const toggleField = (fieldName: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldName)) {
      newSelected.delete(fieldName);
    } else {
      newSelected.add(fieldName);
    }
    setSelectedFields(newSelected);
  };

  const handleApplyMapping = async () => {
    console.log('handleApplyMapping called');
    console.log('selectedFields:', Array.from(selectedFields));
    console.log('mappedFields:', mappedFields);
    
    if (selectedFields.size === 0) {
      toast.error("No fields selected to apply");
      return;
    }

    setApplying(true);
    try {
      // Get current form data
      console.log('Fetching form data for userId:', userId);
      const { data: currentData, error: fetchError } = await supabase
        .from('application_form_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Current form data:', currentData);
      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      // Build update object with only selected fields
      const updates: Record<string, any> = {};
      for (const field of mappedFields) {
        if (selectedFields.has(field.formField)) {
          updates[field.formField] = field.value;
          console.log(`Adding field ${field.formField} = ${field.value}`);
        }
      }
      
      console.log('Updates to apply:', updates);

      if (currentData) {
        // Update existing record
        console.log('Updating existing record with id:', currentData.id);
        const { error: updateError } = await supabase
          .from('application_form_data')
          .update(updates)
          .eq('id', currentData.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
        console.log('Update successful');
      } else {
        // Insert new record
        console.log('Inserting new record');
        const { error: insertError } = await supabase
          .from('application_form_data')
          .insert({
            user_id: userId,
            application_id: applicationId,
            ...updates,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
        console.log('Insert successful');
      }

      toast.success(`Applied ${selectedFields.size} field(s) from ${documentType.replace(/_/g, ' ')} to application form`);
      onMappingComplete?.();
    } catch (error) {
      console.error('Error applying field mapping:', error);
      toast.error('Failed to apply field mapping');
    } finally {
      setApplying(false);
    }
  };

  const conflictCount = mappedFields.filter(f => f.hasConflict).length;
  const selectedCount = selectedFields.size;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Auto-Fill Application Form
          </span>
          {conflictCount > 0 && (
            <Badge variant="outline" className="text-warning border-warning/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {conflictCount} conflict(s)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-3">
        <p className="text-xs text-muted-foreground">
          Select fields to auto-populate in the client's application form:
        </p>

        <div className="space-y-2">
          {mappedFields.map((field) => (
            <div 
              key={field.formField}
              className={`flex items-center gap-3 p-2 rounded border ${
                field.hasConflict 
                  ? 'border-warning/30 bg-warning/5' 
                  : 'border-border bg-background/50'
              }`}
            >
              <Checkbox
                checked={selectedFields.has(field.formField)}
                onCheckedChange={() => toggleField(field.formField)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{field.label}</span>
                  {field.hasConflict && (
                    <AlertTriangle className="h-3 w-3 text-warning" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-primary font-medium">
                    {formatFieldValue(field.value)}
                  </span>
                  {field.hasConflict && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground line-through">
                        Current: {formatFieldValue(field.currentValue)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleApplyMapping} 
          disabled={applying || selectedCount === 0}
          className="w-full gap-2"
          size="sm"
        >
          <CheckCircle className="h-4 w-4" />
          {applying ? 'Applying...' : `Apply ${selectedCount} Field${selectedCount !== 1 ? 's' : ''} to Form`}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Fields with conflicts require manual confirmation
        </p>
      </CardContent>
    </Card>
  );
};

export default DocumentFieldMapper;
