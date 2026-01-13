// Automatically populate application_form_data when documents are approved
import { supabase } from "@/integrations/supabase/client";
import { getMappableFields, ExtractedData } from "./documentFormMapping";

/**
 * Auto-populate form data from approved document's extracted data
 * Called when a document is approved (by AI or broker)
 */
export async function autoPopulateFormFromDocument(
  documentId: string,
  documentType: string,
  userId: string,
  applicationId: string
): Promise<{ success: boolean; fieldsApplied: number; error?: string }> {
  try {
    // Fetch the extracted data for this document
    const { data: analysisData, error: analysisError } = await supabase
      .from('agent_document_analysis')
      .select('extracted_data')
      .eq('document_id', documentId)
      .maybeSingle();

    if (analysisError) {
      console.error('Error fetching document analysis:', analysisError);
      return { success: false, fieldsApplied: 0, error: 'Failed to fetch document analysis' };
    }

    if (!analysisData?.extracted_data) {
      console.log('No extracted data found for document:', documentId);
      return { success: true, fieldsApplied: 0 };
    }

    const extractedData = analysisData.extracted_data as ExtractedData;

    // Get current form data
    const { data: currentFormData, error: formError } = await supabase
      .from('application_form_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (formError) {
      console.error('Error fetching form data:', formError);
      return { success: false, fieldsApplied: 0, error: 'Failed to fetch current form data' };
    }

    // Get mappable fields (only non-conflicting ones for auto-populate)
    const mappedFields = getMappableFields(documentType, extractedData, currentFormData || {});
    
    // Filter to only non-conflicting fields for automatic population
    const fieldsToApply = mappedFields.filter(f => !f.hasConflict);
    
    if (fieldsToApply.length === 0) {
      console.log('No new fields to apply for document:', documentId);
      return { success: true, fieldsApplied: 0 };
    }

    // Build update object
    const updates: Record<string, any> = {};
    for (const field of fieldsToApply) {
      updates[field.formField] = field.value;
    }

    console.log('Auto-populating form fields:', Object.keys(updates));

    if (currentFormData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('application_form_data')
        .update(updates)
        .eq('id', currentFormData.id);

      if (updateError) {
        console.error('Error updating form data:', updateError);
        return { success: false, fieldsApplied: 0, error: 'Failed to update form data' };
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('application_form_data')
        .insert({
          user_id: userId,
          application_id: applicationId,
          ...updates,
        });

      if (insertError) {
        console.error('Error inserting form data:', insertError);
        return { success: false, fieldsApplied: 0, error: 'Failed to create form data' };
      }
    }

    console.log(`Successfully auto-populated ${fieldsToApply.length} fields from ${documentType}`);
    return { success: true, fieldsApplied: fieldsToApply.length };

  } catch (error) {
    console.error('Error in autoPopulateFormFromDocument:', error);
    return { success: false, fieldsApplied: 0, error: 'Unexpected error' };
  }
}
