import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (roleData?.role !== 'admin') {
      throw new Error("Admin access required");
    }

    const { action } = await req.json();
    console.log("[ADMIN-STRIPE] Action:", action);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let responseData = {};

    switch (action) {
      case 'list_products': {
        const products = await stripe.products.list({ limit: 100 });
        responseData = { products: products.data };
        break;
      }
      case 'list_prices': {
        const prices = await stripe.prices.list({ limit: 100, expand: ['data.product'] });
        responseData = { prices: prices.data };
        break;
      }
      case 'list_customers': {
        const customers = await stripe.customers.list({ limit: 100 });
        responseData = { customers: customers.data };
        break;
      }
      case 'list_subscriptions': {
        const subscriptions = await stripe.subscriptions.list({ limit: 100, status: 'all' });
        responseData = { subscriptions: subscriptions.data };
        break;
      }
      case 'list_payments': {
        const payments = await stripe.paymentIntents.list({ limit: 100 });
        responseData = { payments: payments.data };
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[ADMIN-STRIPE] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
