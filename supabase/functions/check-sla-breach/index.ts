import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SLA_IDLE_DAYS = 7; // Alert after 7 days of inactivity

const getEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>YourKey</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f4;"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#4CAF50,#2E7D32);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
<h1 style="margin:0;color:#fff;font-size:28px;">🏠 YourKey</h1>
<p style="margin:5px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Mortgage Portal</p>
</td></tr>
<tr><td style="padding:40px 30px;">${content}</td></tr>
<tr><td style="background:#f8f9fa;padding:20px 30px;text-align:center;border-radius:0 0 8px 8px;border-top:1px solid #e9ecef;">
<p style="margin:0;color:#adb5bd;font-size:12px;">© ${new Date().getFullYear()} YourKey Mortgages.</p>
</td></tr></table></td></tr></table></body></html>`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SLA_IDLE_DAYS);

    // Find applications with journey states that haven't been updated recently
    // and are in active (non-terminal) states
    const { data: idleApps, error } = await supabase
      .from("application_journey_state")
      .select("application_id, client_id, current_state, updated_at")
      .in("current_state", ["DOCS_STARTED", "DOCS_PARTIAL", "NEEDS_HUMAN_REVIEW"])
      .lt("updated_at", cutoffDate.toISOString());

    if (error) {
      console.error("Error fetching idle applications:", error);
      throw error;
    }

    console.log(`Found ${idleApps?.length || 0} idle applications`);

    let notificationsSent = 0;

    for (const app of (idleApps || [])) {
      // Get client profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", app.client_id)
        .single();

      if (!profile) continue;

      const idleDays = Math.floor(
        (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const lastActivity = new Date(app.updated_at).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Send SLA breach notification to admin
      const { error: notifyError } = await supabase.functions.invoke("send-notification", {
        body: {
          notification_type: "sla_breach",
          subject: `⏰ SLA Breach: ${profile.full_name || profile.email} idle ${idleDays} days`,
          html_content: getEmailWrapper(`
            <h2 style="margin:0 0 20px;color:#333;font-size:24px;">⏰ SLA Breach - Client Idle</h2>
            <p style="margin:0 0 20px;color:#555;font-size:16px;">
              A client has been inactive for <strong>${idleDays} days</strong> and may require intervention.
            </p>
            <table width="100%" cellspacing="0" cellpadding="8" style="background:#fff3e0;border-radius:6px;margin:20px 0;">
              <tr><td style="color:#e65100;font-size:14px;border-bottom:1px solid #ffe0b2;"><strong>Client:</strong></td>
              <td style="color:#333;font-size:14px;border-bottom:1px solid #ffe0b2;">${profile.full_name || 'Unknown'} (${profile.email})</td></tr>
              <tr><td style="color:#e65100;font-size:14px;border-bottom:1px solid #ffe0b2;"><strong>Idle Days:</strong></td>
              <td style="color:#c62828;font-size:14px;font-weight:bold;border-bottom:1px solid #ffe0b2;">${idleDays} days</td></tr>
              <tr><td style="color:#e65100;font-size:14px;border-bottom:1px solid #ffe0b2;"><strong>Current State:</strong></td>
              <td style="color:#333;font-size:14px;border-bottom:1px solid #ffe0b2;">${app.current_state}</td></tr>
              <tr><td style="color:#e65100;font-size:14px;"><strong>Last Activity:</strong></td>
              <td style="color:#333;font-size:14px;">${lastActivity}</td></tr>
            </table>
            <div style="text-align:center;">
              <a href="https://yourkey.ie/login" style="display:inline-block;background:linear-gradient(135deg,#4CAF50,#2E7D32);color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">Take Action</a>
            </div>
          `),
        },
      });

      if (!notifyError) {
        notificationsSent++;

        // Also send a reminder to the client
        await supabase.functions.invoke("send-notification", {
          body: {
            notification_type: "client_idle_reminder",
            subject: "We miss you! Your mortgage application is waiting",
            recipient_email: profile.email,
            html_content: getEmailWrapper(`
              <h2 style="margin:0 0 20px;color:#333;font-size:24px;">👋 We Haven't Heard From You</h2>
              <p style="margin:0 0 20px;color:#555;font-size:16px;">
                Hi <strong>${profile.full_name || 'there'}</strong>,
              </p>
              <p style="margin:0 0 20px;color:#555;font-size:16px;">
                We noticed you haven't updated your mortgage application in a while. Your application is still active and we're here to help!
              </p>
              <p style="margin:0 0 20px;color:#555;font-size:16px;">
                Log in to continue where you left off, or chat with our AI assistant if you need guidance.
              </p>
              <div style="text-align:center;">
                <a href="https://yourkey.ie/login" style="display:inline-block;background:linear-gradient(135deg,#4CAF50,#2E7D32);color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">Continue Application</a>
              </div>
            `),
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        idle_applications: idleApps?.length || 0,
        notifications_sent: notificationsSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("SLA breach check error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
