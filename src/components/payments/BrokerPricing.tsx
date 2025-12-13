import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/stripe-config";

interface BrokerPricingProps {
  currentTier?: SubscriptionTier | null;
}

const BrokerPricing = ({ currentTier }: BrokerPricingProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    setLoading(tier);
    try {
      const priceType = `broker_${tier}`;
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceType }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('manage');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error("Failed to open subscription portal");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Broker Subscription Plans</h2>
        <p className="text-muted-foreground mt-2">Choose the plan that fits your needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {(Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][]).map(([key, tier]) => {
          const isCurrentPlan = currentTier === key;
          const isPro = key === 'pro';

          return (
            <Card 
              key={key} 
              className={`relative ${isPro ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
            >
              {isPro && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge variant="secondary" className="absolute -top-3 right-4">
                  Current Plan
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">€{tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrentPlan ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={loading === 'manage'}
                  >
                    {loading === 'manage' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Manage Subscription
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={isPro ? "default" : "outline"}
                    onClick={() => handleSubscribe(key)}
                    disabled={loading === key}
                  >
                    {loading === key ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {currentTier ? 'Switch Plan' : 'Get Started'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BrokerPricing;
