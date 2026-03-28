import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

serve(async (req) => {
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

    const { action, phone, code } = await req.json();

    if (action === 'send') {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in profiles (using service role for update)
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(supabaseUrl, serviceKey);
      
      // Store OTP with expiry (5 minutes)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await adminClient.from('profiles').update({
        phone_number: phone,
        phone_verified: false,
      }).eq('id', user.id);

      // Store OTP temporarily in user metadata
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          pending_otp: otp,
          otp_expires_at: expiresAt,
          pending_phone: phone,
        },
      });

      // Send SMS via Twilio direct API
      const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
      const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER');
      
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !twilioFrom) {
        // Twilio not configured - return OTP in dev mode for testing
        console.log('Twilio not configured. OTP:', otp);
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'OTP generated (Twilio not configured - check logs)',
          dev_mode: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
      
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: twilioFrom,
            Body: `Your YourKey Mortgages verification code is: ${otp}. This code expires in 5 minutes.`,
          }),
        }
      );

      const twilioData = await twilioResponse.json();
      if (!twilioResponse.ok) {
        console.error('Twilio error:', twilioData);
        return new Response(JSON.stringify({ error: 'Failed to send SMS via Twilio' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'OTP sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'verify') {
      // Verify OTP
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(supabaseUrl, serviceKey);
      
      const { data: { user: freshUser } } = await adminClient.auth.admin.getUserById(user.id);
      
      if (!freshUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const storedOtp = freshUser.user_metadata?.pending_otp;
      const expiresAt = freshUser.user_metadata?.otp_expires_at;
      const pendingPhone = freshUser.user_metadata?.pending_phone;
      
      if (!storedOtp || !expiresAt) {
        return new Response(JSON.stringify({ error: 'No pending OTP. Please request a new code.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (new Date() > new Date(expiresAt)) {
        return new Response(JSON.stringify({ error: 'OTP has expired. Please request a new code.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (code !== storedOtp) {
        return new Response(JSON.stringify({ error: 'Invalid code. Please try again.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // OTP is valid - mark phone as verified
      await adminClient.from('profiles').update({
        phone_number: pendingPhone,
        phone_verified: true,
      }).eq('id', user.id);

      // Clear OTP from metadata
      const { pending_otp, otp_expires_at, pending_phone, ...restMetadata } = freshUser.user_metadata || {};
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: restMetadata,
      });

      return new Response(JSON.stringify({ success: true, message: 'Phone verified successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
