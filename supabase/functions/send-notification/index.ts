import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  notification_type: string;
  subject: string;
  html_content: string;
  event_data?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { notification_type, subject, html_content, event_data }: NotificationRequest = await req.json();

    console.log(`Processing notification: ${notification_type}`);

    // Check if this notification type is enabled and get recipient email
    const { data: setting, error: settingError } = await supabaseClient
      .from("notification_settings")
      .select("*")
      .eq("notification_type", notification_type)
      .single();

    if (settingError) {
      console.error("Error fetching notification setting:", settingError);
      return new Response(
        JSON.stringify({ error: "Notification type not found", sent: false }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!setting.enabled) {
      console.log(`Notification type ${notification_type} is disabled`);
      return new Response(
        JSON.stringify({ message: "Notification disabled", sent: false }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Mortgage Portal <notifications@resend.dev>",
      to: [setting.recipient_email],
      subject: subject,
      html: html_content,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: true,
        email_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message, sent: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
