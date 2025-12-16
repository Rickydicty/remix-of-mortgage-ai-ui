import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Save, CheckCircle, Loader2 } from "lucide-react";

interface CoverLetterFormProps {
  onComplete?: () => void;
}

interface CoverLetterData {
  cover_letter_client_background: string;
  cover_letter_mortgage_purpose: string;
  cover_letter_mortgage_amount: number | null;
  cover_letter_property_details: string;
  cover_letter_pra_details: string;
  cover_letter_bof_details: string;
  cover_letter_employment_summary: string;
  cover_letter_additional_info: string;
  cover_letter_completed: boolean;
}

export default function CoverLetterForm({ onComplete }: CoverLetterFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CoverLetterData>({
    cover_letter_client_background: "",
    cover_letter_mortgage_purpose: "",
    cover_letter_mortgage_amount: null,
    cover_letter_property_details: "",
    cover_letter_pra_details: "",
    cover_letter_bof_details: "",
    cover_letter_employment_summary: "",
    cover_letter_additional_info: "",
    cover_letter_completed: false,
  });

  useEffect(() => {
    fetchCoverLetterData();
  }, []);

  const fetchCoverLetterData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("application_form_data")
        .select("cover_letter_client_background, cover_letter_mortgage_purpose, cover_letter_mortgage_amount, cover_letter_property_details, cover_letter_pra_details, cover_letter_bof_details, cover_letter_employment_summary, cover_letter_additional_info, cover_letter_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          cover_letter_client_background: data.cover_letter_client_background || "",
          cover_letter_mortgage_purpose: data.cover_letter_mortgage_purpose || "",
          cover_letter_mortgage_amount: data.cover_letter_mortgage_amount,
          cover_letter_property_details: data.cover_letter_property_details || "",
          cover_letter_pra_details: data.cover_letter_pra_details || "",
          cover_letter_bof_details: data.cover_letter_bof_details || "",
          cover_letter_employment_summary: data.cover_letter_employment_summary || "",
          cover_letter_additional_info: data.cover_letter_additional_info || "",
          cover_letter_completed: data.cover_letter_completed || false,
        });
      }
    } catch (error) {
      console.error("Error fetching cover letter data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CoverLetterData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (markComplete: boolean = false) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to save your cover letter");
        return;
      }

      const updateData = {
        ...formData,
        cover_letter_completed: markComplete ? true : formData.cover_letter_completed,
        cover_letter_completed_at: markComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      // Check if record exists
      const { data: existing } = await supabase
        .from("application_form_data")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("application_form_data")
          .update(updateData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("application_form_data")
          .insert({ ...updateData, user_id: user.id });

        if (error) throw error;
      }

      if (markComplete) {
        setFormData(prev => ({ ...prev, cover_letter_completed: true }));
      }

      toast.success(markComplete ? "Cover letter completed and saved!" : "Cover letter saved as draft");
      onComplete?.();
    } catch (error) {
      console.error("Error saving cover letter:", error);
      toast.error("Failed to save cover letter");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Cover Letter</CardTitle>
              <CardDescription>
                Please complete this cover letter detailing your mortgage application case
              </CardDescription>
            </div>
          </div>
          {formData.cover_letter_completed && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Background */}
        <div className="space-y-2">
          <Label htmlFor="client_background" className="text-sm font-medium">
            Client Background & Situation *
          </Label>
          <Textarea
            id="client_background"
            placeholder="Describe your current situation, family status, current living arrangements, and reason for seeking a mortgage..."
            value={formData.cover_letter_client_background}
            onChange={(e) => handleInputChange("cover_letter_client_background", e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            Include details about your family status, current residence, and why you are applying for a mortgage.
          </p>
        </div>

        {/* Mortgage Purpose */}
        <div className="space-y-2">
          <Label htmlFor="mortgage_purpose" className="text-sm font-medium">
            Purpose of Mortgage *
          </Label>
          <Textarea
            id="mortgage_purpose"
            placeholder="e.g., First-time buyer purchasing family home, refinancing existing mortgage, investment property..."
            value={formData.cover_letter_mortgage_purpose}
            onChange={(e) => handleInputChange("cover_letter_mortgage_purpose", e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Mortgage Amount */}
        <div className="space-y-2">
          <Label htmlFor="mortgage_amount" className="text-sm font-medium">
            Mortgage Amount Required (€) *
          </Label>
          <Input
            id="mortgage_amount"
            type="number"
            placeholder="e.g., 350000"
            value={formData.cover_letter_mortgage_amount || ""}
            onChange={(e) => handleInputChange("cover_letter_mortgage_amount", e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>

        {/* Property Details */}
        <div className="space-y-2">
          <Label htmlFor="property_details" className="text-sm font-medium">
            Property Details *
          </Label>
          <Textarea
            id="property_details"
            placeholder="Property address, type (house/apartment), number of bedrooms, purchase price, etc..."
            value={formData.cover_letter_property_details}
            onChange={(e) => handleInputChange("cover_letter_property_details", e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* PRA Details */}
        <div className="space-y-2">
          <Label htmlFor="pra_details" className="text-sm font-medium">
            PRA (Property Registration Authority) Details
          </Label>
          <Textarea
            id="pra_details"
            placeholder="If known, include any PRA reference numbers, folio numbers, or land registry details..."
            value={formData.cover_letter_pra_details}
            onChange={(e) => handleInputChange("cover_letter_pra_details", e.target.value)}
            className="min-h-[60px]"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank if not applicable or unknown - your broker can assist with this.
          </p>
        </div>

        {/* BOF Details */}
        <div className="space-y-2">
          <Label htmlFor="bof_details" className="text-sm font-medium">
            Balance of Funds (BOF) *
          </Label>
          <Textarea
            id="bof_details"
            placeholder="Explain how you will fund the deposit and other costs. Include savings, gifts from family, Help-to-Buy scheme, etc..."
            value={formData.cover_letter_bof_details}
            onChange={(e) => handleInputChange("cover_letter_bof_details", e.target.value)}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            Lenders need to see proof of where your deposit comes from.
          </p>
        </div>

        {/* Employment Summary */}
        <div className="space-y-2">
          <Label htmlFor="employment_summary" className="text-sm font-medium">
            Employment Summary *
          </Label>
          <Textarea
            id="employment_summary"
            placeholder="Current employer, job title, length of employment, employment type (permanent/contract), annual salary..."
            value={formData.cover_letter_employment_summary}
            onChange={(e) => handleInputChange("cover_letter_employment_summary", e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Additional Information */}
        <div className="space-y-2">
          <Label htmlFor="additional_info" className="text-sm font-medium">
            Additional Information
          </Label>
          <Textarea
            id="additional_info"
            placeholder="Any other relevant information you would like to include in your cover letter..."
            value={formData.cover_letter_additional_info}
            onChange={(e) => handleInputChange("cover_letter_additional_info", e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Complete & Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
