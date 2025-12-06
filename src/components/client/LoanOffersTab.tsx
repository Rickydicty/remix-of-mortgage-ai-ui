import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { FileText, Download, TrendingUp, Calendar, Percent, Euro, Clock, Loader2, Sparkles } from 'lucide-react';

interface LoanOffer {
  id: string;
  lender_name: string;
  offer_amount: number;
  interest_rate: number;
  loan_term: number;
  monthly_repayment: number | null;
  offer_type: string | null;
  fixed_period: number | null;
  total_repayment: number | null;
  offer_valid_until: string | null;
  document_url: string | null;
  is_mock: boolean | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
}

interface LoanOffersTabProps {
  applicationId: string | null;
}

export function LoanOffersTab({ applicationId }: LoanOffersTabProps) {
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (applicationId) {
      fetchOffers();
    }
  }, [applicationId]);

  const fetchOffers = async () => {
    if (!applicationId) return;
    
    try {
      const { data, error } = await supabase
        .from('loan_offers')
        .select('*')
        .eq('application_id', applicationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers((data as LoanOffer[]) || []);
    } catch (error) {
      console.error('Error fetching loan offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (documentUrl: string, lenderName: string) => {
    window.open(documentUrl, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!applicationId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No application found</p>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Loan Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">No Loan Offers Yet</h3>
            <p className="text-sm text-muted-foreground">
              Loan offers will appear here once your broker submits them after AIP approval.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Loan Offers ({offers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Review your loan offers below. Each offer includes detailed terms and conditions from the lender.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {offers.map((offer) => (
          <Card key={offer.id} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Euro className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{offer.lender_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {offer.is_mock && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Sparkles className="h-3 w-3" />
                          Sample Offer
                        </Badge>
                      )}
                      <Badge className="bg-success/10 text-success border-success/20">
                        {offer.status === 'active' ? 'Active Offer' : offer.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {offer.document_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(offer.document_url!, offer.lender_name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View Offer
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Key Figures */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                  <p className="text-xl font-bold text-success">
                    €{offer.offer_amount.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
                  <p className="text-xl font-bold text-primary flex items-center gap-1">
                    <Percent className="h-4 w-4" />
                    {offer.interest_rate}%
                  </p>
                  {offer.offer_type && offer.fixed_period && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {offer.offer_type} for {offer.fixed_period} years
                    </p>
                  )}
                </div>
                <div className="p-4 bg-muted/50 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Loan Term</p>
                  <p className="text-xl font-bold flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {offer.loan_term} years
                  </p>
                </div>
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Monthly Repayment</p>
                  <p className="text-xl font-bold text-warning">
                    €{offer.monthly_repayment?.toLocaleString() || 'TBC'}
                  </p>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {offer.total_repayment && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Repayment</p>
                    <p className="font-semibold">€{offer.total_repayment.toLocaleString()}</p>
                  </div>
                )}
                {offer.offer_valid_until && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Valid Until
                    </p>
                    <p className="font-semibold">
                      {format(new Date(offer.offer_valid_until), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {offer.created_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Received On</p>
                    <p className="font-semibold">
                      {format(new Date(offer.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {offer.notes && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Broker Notes</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{offer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
