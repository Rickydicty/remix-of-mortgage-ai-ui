import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Send, Clock, CheckCircle, AlertCircle, MapPin, Euro, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PropertyValuationSubmitProps {
  applicationId: string;
  onSubmit?: () => void;
}

interface Valuation {
  id: string;
  status: string;
  valuation_amount: number | null;
  notes: string | null;
  ordered_at: string | null;
  completed_at: string | null;
  valuer_name: string | null;
  appointment_date: string | null;
  report_url: string | null;
}

export const PropertyValuationSubmit = ({ applicationId, onSubmit }: PropertyValuationSubmitProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingValuation, setExistingValuation] = useState<Valuation | null>(null);
  
  const [valuationData, setValuationData] = useState({
    propertyAddress: "",
    estimatedValue: "",
    propertyType: "",
    yearBuilt: "",
    squareMeters: "",
    bedrooms: "",
    notes: "",
  });

  useEffect(() => {
    fetchExistingValuation();
  }, [applicationId]);

  const fetchExistingValuation = async () => {
    if (!applicationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setExistingValuation(data);
      }
    } catch (error) {
      console.error('Error fetching valuation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !applicationId) return;
    if (!valuationData.propertyAddress || !valuationData.estimatedValue) {
      toast({
        title: "Missing Information",
        description: "Please provide property address and estimated value",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const notes = `
Property Type: ${valuationData.propertyType || 'Not specified'}
Year Built: ${valuationData.yearBuilt || 'Not specified'}
Size: ${valuationData.squareMeters || 'Not specified'} sqm
Bedrooms: ${valuationData.bedrooms || 'Not specified'}
Client Notes: ${valuationData.notes || 'None'}
Client Estimated Value: €${Number(valuationData.estimatedValue).toLocaleString()}
      `.trim();

      const { error } = await supabase
        .from('valuations')
        .insert({
          application_id: applicationId,
          status: 'pending',
          valuation_amount: Number(valuationData.estimatedValue),
          notes: notes,
          ordered_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Valuation Request Submitted",
        description: "Your broker will review your property valuation details.",
      });

      setValuationData({
        propertyAddress: "",
        estimatedValue: "",
        propertyType: "",
        yearBuilt: "",
        squareMeters: "",
        bedrooms: "",
        notes: "",
      });
      
      fetchExistingValuation();
      onSubmit?.();
    } catch (error) {
      console.error('Error submitting valuation:', error);
      toast({
        title: "Error",
        description: "Failed to submit valuation request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
      pending: { variant: "secondary", icon: <Clock className="h-3 w-3" />, label: "Pending Review" },
      in_progress: { variant: "default", icon: <Clock className="h-3 w-3" />, label: "In Progress" },
      completed: { variant: "default", icon: <CheckCircle className="h-3 w-3" />, label: "Completed" },
      sent_to_lender: { variant: "outline", icon: <Send className="h-3 w-3" />, label: "Sent to Lender" },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Property Valuation
        </CardTitle>
        <CardDescription>
          Submit your property details for valuation. Your broker will verify using official property registers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {existingValuation ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Current Valuation Status</h4>
                {getStatusBadge(existingValuation.status)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Your Estimate:</span>
                  <span className="font-medium">
                    €{existingValuation.valuation_amount?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="font-medium">
                    {existingValuation.ordered_at 
                      ? format(new Date(existingValuation.ordered_at), 'dd MMM yyyy')
                      : 'N/A'}
                  </span>
                </div>

                {existingValuation.valuer_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Valuer:</span>
                    <span className="font-medium">{existingValuation.valuer_name}</span>
                  </div>
                )}

                {existingValuation.appointment_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Appointment:</span>
                    <span className="font-medium">
                      {format(new Date(existingValuation.appointment_date), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                )}
              </div>

              {existingValuation.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {existingValuation.notes}
                  </p>
                </div>
              )}

              {existingValuation.status === 'completed' && (
                <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Valuation Complete</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your broker has reviewed the valuation and will proceed with lender submission.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="propertyAddress">Property Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="propertyAddress"
                    placeholder="Full property address"
                    value={valuationData.propertyAddress}
                    onChange={(e) => setValuationData(prev => ({ ...prev, propertyAddress: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedValue">Your Estimated Value (€) *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimatedValue"
                    type="number"
                    placeholder="350000"
                    value={valuationData.estimatedValue}
                    onChange={(e) => setValuationData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Input
                  id="propertyType"
                  placeholder="e.g., Semi-detached, Apartment"
                  value={valuationData.propertyType}
                  onChange={(e) => setValuationData(prev => ({ ...prev, propertyType: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="2010"
                  value={valuationData.yearBuilt}
                  onChange={(e) => setValuationData(prev => ({ ...prev, yearBuilt: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="squareMeters">Size (sqm)</Label>
                <Input
                  id="squareMeters"
                  type="number"
                  placeholder="120"
                  value={valuationData.squareMeters}
                  onChange={(e) => setValuationData(prev => ({ ...prev, squareMeters: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="3"
                  value={valuationData.bedrooms}
                  onChange={(e) => setValuationData(prev => ({ ...prev, bedrooms: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about the property..."
                  value={valuationData.notes}
                  onChange={(e) => setValuationData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-primary" />
                <p>
                  Your broker will verify this valuation using official Irish property registers 
                  (Tailte Éireann) and may arrange a professional valuation if required.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit for Broker Review'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
