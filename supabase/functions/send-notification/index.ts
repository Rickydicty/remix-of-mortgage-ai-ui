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
            to: [{ email: setting.recipient_email }],
          },
        ],
        from: { email: "raufpokemon00@gmail.com", name: "Mortgage Portal" },
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
      console.error("SendGrid error:", errorText);
      throw new Error(`SendGrid API error: ${emailResponse.status}`);
    }

    console.log("Email sent successfully via SendGrid");

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: true,
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
