import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApplicationFeePaymentProps {
  applicationId?: string;
  onSuccess?: () => void;
}

const ApplicationFeePayment = ({ applicationId, onSuccess }: ApplicationFeePaymentProps) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceType: 'application_fee' }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Failed to start payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Application Fee
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">€50</span>
          <span className="text-muted-foreground">one-time fee</span>
        </div>
        <p className="text-sm text-muted-foreground">
          This fee covers the processing of your mortgage application. Broker commission (0.75-1%) is paid separately by the lender.
        </p>
        <Button 
          onClick={handlePayment} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          Pay Application Fee
        </Button>
      </CardContent>
    </Card>
  );
};

export default ApplicationFeePayment;
