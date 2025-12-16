import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileText, CheckCircle, Clock, Loader2 } from "lucide-react";

interface CoverLetterViewProps {
  userId: string;
}

interface CoverLetterData {
  cover_letter_client_background: string | null;
  cover_letter_mortgage_purpose: string | null;
  cover_letter_mortgage_amount: number | null;
  cover_letter_property_details: string | null;
  cover_letter_pra_details: string | null;
  cover_letter_bof_details: string | null;
  cover_letter_employment_summary: string | null;
  cover_letter_additional_info: string | null;
  cover_letter_completed: boolean | null;
  cover_letter_completed_at: string | null;
}

export default function CoverLetterView({ userId }: CoverLetterViewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CoverLetterData | null>(null);

  useEffect(() => {
    fetchCoverLetter();
  }, [userId]);

  const fetchCoverLetter = async () => {
    try {
      const { data: coverLetterData, error } = await supabase
        .from("application_form_data")
        .select("cover_letter_client_background, cover_letter_mortgage_purpose, cover_letter_mortgage_amount, cover_letter_property_details, cover_letter_pra_details, cover_letter_bof_details, cover_letter_employment_summary, cover_letter_additional_info, cover_letter_completed, cover_letter_completed_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      setData(coverLetterData);
    } catch (error) {
      console.error("Error fetching cover letter:", error);
    } finally {
      setLoading(false);
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

  const hasData = data && (
    data.cover_letter_client_background ||
    data.cover_letter_mortgage_purpose ||
    data.cover_letter_mortgage_amount ||
    data.cover_letter_property_details
  );

  if (!hasData) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Client has not submitted a cover letter yet</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-IE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Client Cover Letter</CardTitle>
              <CardDescription>Cover letter submitted by client</CardDescription>
            </div>
          </div>
          {data?.cover_letter_completed ? (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed {data.cover_letter_completed_at && `on ${formatDate(data.cover_letter_completed_at)}`}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-500/20">
              <Clock className="h-3 w-3 mr-1" />
              Draft
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Background */}
        {data?.cover_letter_client_background && (
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Client Background & Situation</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
              {data.cover_letter_client_background}
            </p>
          </div>
        )}

        {/* Mortgage Purpose */}
        {data?.cover_letter_mortgage_purpose && (
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Purpose of Mortgage</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
              {data.cover_letter_mortgage_purpose}
            </p>
          </div>
        )}

        {/* Mortgage Amount */}
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Mortgage Amount Required</h4>
          <p className="text-lg font-semibold text-primary">
            {formatCurrency(data?.cover_letter_mortgage_amount ?? null)}
          </p>
        </div>

        {/* Property Details */}
        {data?.cover_letter_property_details && (
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Property Details</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
              {data.cover_letter_property_details}
            </p>
          </div>
        )}

        {/* PRA Details */}
        {data?.cover_letter_pra_details && (
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">PRA Details</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
              {data.cover_letter_pra_details}
            </p>
          </div>
        )}

        {/* BOF Details */}
        {data?.cover_letter_bof_details && (
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Balance of Funds</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
              {data.cover_letter_bof_details}
            </p>
          </div>
        )}

        {/* Employment Summary */}
        {data?.cover_letter_employment_summary && (
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Employment Summary</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
              {data.cover_letter_employment_summary}
            </p>
          </div>
        )}

        {/* Additional Info */}
        {data?.cover_letter_additional_info && (
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Additional Information</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
              {data.cover_letter_additional_info}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
