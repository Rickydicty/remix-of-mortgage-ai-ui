import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_VERIFY_SERVICE_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    const { action, phone, code } = await req.json();

    if (action === 'send') {
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
        console.log('Twilio Verify not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID secrets.');
        return new Response(JSON.stringify({
          success: true,
          message: 'OTP triggered (Twilio not configured — check edge function logs)',
          dev_mode: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const twilioResponse = await fetch(
        `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            Channel: 'sms',
          }),
        }
      );

      const twilioData = await twilioResponse.json();

      if (!twilioResponse.ok) {
        console.error('Twilio Verify error:', twilioData);
        return new Response(JSON.stringify({ error: twilioData.message || 'Failed to send verification code' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Store phone number in profile (unverified until OTP confirmed)
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(supabaseUrl, serviceKey);
      await adminClient.from('profiles').update({
        phone_number: phone,
        phone_verified: false,
      }).eq('id', user.id);

      return new Response(JSON.stringify({ success: true, message: 'Verification code sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'verify') {
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
        return new Response(JSON.stringify({ error: 'Twilio Verify not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      // Get the phone from the profile (stored during send step)
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data: profile } = await adminClient
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single();

      if (!profile?.phone_number) {
        return new Response(JSON.stringify({ error: 'No pending phone number. Please request a new code.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const twilioResponse = await fetch(
        `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: profile.phone_number,
            Code: code,
          }),
        }
      );

      const twilioData = await twilioResponse.json();

      if (!twilioResponse.ok || twilioData.status !== 'approved') {
        return new Response(JSON.stringify({ error: 'Invalid or expired code. Please try again.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark phone as verified in profile
      await adminClient.from('profiles').update({
        phone_verified: true,
      }).eq('id', user.id);

      return new Response(JSON.stringify({ success: true, message: 'Phone verified successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
