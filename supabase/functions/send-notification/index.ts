import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  notification_type: string;
  subject: string;
  html_content: string;
  recipient_email?: string;
  event_data?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "SendGrid not configured", sent: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { notification_type, subject, html_content, recipient_email, event_data }: NotificationRequest = await req.json();

    console.log(`Processing notification: ${notification_type}, recipient: ${recipient_email || 'from settings'}`);

    let toEmail = recipient_email;

    // If no recipient_email provided, look up from notification_settings
    if (!toEmail) {
      const { data: setting, error: settingError } = await supabaseClient
        .from("notification_settings")
        .select("*")
        .eq("notification_type", notification_type)
        .single();

      if (settingError) {
        console.error("Error fetching notification setting:", settingError);
        return new Response(
          JSON.stringify({ error: "Notification type not found", sent: false }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!setting.enabled) {
        console.log(`Notification type ${notification_type} is disabled`);
        return new Response(
          JSON.stringify({ message: "Notification disabled", sent: false }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      toEmail = setting.recipient_email;
    }

    if (!toEmail) {
      console.error("No recipient email found");
      return new Response(
        JSON.stringify({ error: "No recipient email", sent: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending email to: ${toEmail}, subject: ${subject}`);

    // Send email via SendGrid
    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail }],
          },
        ],
        from: { email: "support@yourkey.ie", name: "YourKey Mortgages" },
        subject: subject,
        content: [
          {
            type: "text/html",
            value: html_content,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("SendGrid error:", emailResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `SendGrid API error: ${emailResponse.status}`, details: errorText, sent: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Email sent successfully to ${toEmail} for ${notification_type}`);

    return new Response(
      JSON.stringify({ success: true, sent: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message, sent: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
