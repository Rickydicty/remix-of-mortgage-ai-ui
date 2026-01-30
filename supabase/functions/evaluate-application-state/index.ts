import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Document checklist - core required documents for mortgage application
const DOCUMENT_CHECKLIST = [
  "certified_id",
  "proof_of_address", 
  "payslips",
  "current_account_statements",
  "employment_summary",
  "salary_cert"
];

// Application states in order of progression
const APPLICATION_STATES = {
  NOT_STARTED: "NOT_STARTED",
  DOCS_STARTED: "DOCS_STARTED",
  DOCS_PARTIAL: "DOCS_PARTIAL",
  DOCS_COMPLETE: "DOCS_COMPLETE",
  UNDER_AI_REVIEW: "UNDER_AI_REVIEW",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
};

// Email wrapper for consistent branding
const getEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YourKey Mortgages</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🏠 YourKey</h1>
              <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Mortgage Portal</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@yourkey.ie" style="color: #4CAF50; text-decoration: none;">support@yourkey.ie</a>
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                © ${new Date().getFullYear()} YourKey Mortgages. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// State transitions that trigger notifications
const NOTIFICATION_TRIGGERS: Record<string, { notification_type: string; subject: string; getHtml: (data: any) => string }> = {
  // When docs go from partial to complete
  [`${APPLICATION_STATES.DOCS_PARTIAL}_TO_${APPLICATION_STATES.DOCS_COMPLETE}`]: {
    notification_type: "docs_complete",
    subject: "✅ Application Documents Complete - Ready for Review",
    getHtml: (data) => getEmailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">📄 Documents Complete!</h2>
      <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
        Great news! Client <strong>${data.clientEmail}</strong> has submitted all required documents.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #e8f5e9; border-radius: 6px; margin: 20px 0;">
        <tr>
          <td style="color: #2E7D32; font-size: 14px;"><strong>Application ID:</strong></td>
          <td style="color: #333; font-size: 14px;">${data.applicationNumber}</td>
        </tr>
      </table>
      <p style="margin: 0 0 20px 0; color: #555; font-size: 16px;">
        The application is now ready for AI review and processing.
      </p>
      <div style="text-align: center;">
        <a href="https://yourkey.ie/login" style="display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Application</a>
      </div>
    `)
  },
  // When AI review flags issues requiring human review
  [`${APPLICATION_STATES.UNDER_AI_REVIEW}_TO_${APPLICATION_STATES.NEEDS_HUMAN_REVIEW}`]: {
    notification_type: "human_review_needed",
    subject: "⚠️ Application Requires Human Review",
    getHtml: (data) => getEmailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">⚠️ Human Review Required</h2>
      <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
        Application <strong>${data.applicationNumber}</strong> has been flagged for human review by our AI system.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #fff3e0; border-radius: 6px; margin: 20px 0;">
        <tr>
          <td style="color: #e65100; font-size: 14px;"><strong>Reason:</strong></td>
          <td style="color: #333; font-size: 14px;">${data.reason || 'AI analysis detected potential issues'}</td>
        </tr>
      </table>
      ${(data.blockers && data.blockers.length > 0) ? `
        <h3 style="margin: 20px 0 10px 0; color: #333; font-size: 16px;">Blockers Identified:</h3>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #555;">
          ${data.blockers.map((b: string) => `<li style="margin: 5px 0;">${b}</li>`).join('')}
        </ul>
      ` : ''}
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://yourkey.ie/login" style="display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review in Dashboard</a>
      </div>
    `)
  },
  // When application is approved
  [`${APPLICATION_STATES.NEEDS_HUMAN_REVIEW}_TO_${APPLICATION_STATES.APPROVED}`]: {
    notification_type: "application_approved",
    subject: "✅ Application Approved",
    getHtml: (data) => getEmailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">🎉 Application Approved!</h2>
      <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
        Congratulations! Application <strong>${data.applicationNumber}</strong> has been approved.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #e8f5e9; border-radius: 6px; margin: 20px 0;">
        <tr>
          <td style="color: #2E7D32; font-size: 14px;"><strong>Client:</strong></td>
          <td style="color: #333; font-size: 14px;">${data.clientEmail}</td>
        </tr>
        <tr>
          <td style="color: #2E7D32; font-size: 14px;"><strong>Status:</strong></td>
          <td style="color: #1B5E20; font-size: 14px; font-weight: bold;">APPROVED ✓</td>
        </tr>
      </table>
      <div style="text-align: center;">
        <a href="https://yourkey.ie/login" style="display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
      </div>
    `)
  },
  // When application is rejected
  [`${APPLICATION_STATES.NEEDS_HUMAN_REVIEW}_TO_${APPLICATION_STATES.REJECTED}`]: {
    notification_type: "application_rejected", 
    subject: "❌ Application Rejected",
    getHtml: (data) => getEmailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Application Update</h2>
      <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
        Application <strong>${data.applicationNumber}</strong> has been reviewed and unfortunately could not be approved at this time.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #ffebee; border-radius: 6px; margin: 20px 0;">
        <tr>
          <td style="color: #c62828; font-size: 14px;"><strong>Client:</strong></td>
          <td style="color: #333; font-size: 14px;">${data.clientEmail}</td>
        </tr>
        <tr>
          <td style="color: #c62828; font-size: 14px;"><strong>Reason:</strong></td>
          <td style="color: #333; font-size: 14px;">${data.reason || 'See application details'}</td>
        </tr>
      </table>
      <div style="text-align: center;">
        <a href="https://yourkey.ie/login" style="display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
      </div>
    `)
  },
  // First document uploaded - journey started
  [`${APPLICATION_STATES.NOT_STARTED}_TO_${APPLICATION_STATES.DOCS_STARTED}`]: {
    notification_type: "journey_started",
    subject: "🚀 New Client Started Application",
    getHtml: (data) => getEmailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">🚀 New Application Started</h2>
      <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
        A new client has started their mortgage application journey.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background: #e3f2fd; border-radius: 6px; margin: 20px 0;">
        <tr>
          <td style="color: #1565c0; font-size: 14px;"><strong>Client:</strong></td>
          <td style="color: #333; font-size: 14px;">${data.clientEmail}</td>
        </tr>
        <tr>
          <td style="color: #1565c0; font-size: 14px;"><strong>Application ID:</strong></td>
          <td style="color: #333; font-size: 14px;">${data.applicationNumber}</td>
        </tr>
        <tr>
          <td style="color: #1565c0; font-size: 14px;"><strong>Status:</strong></td>
          <td style="color: #333; font-size: 14px;">First document uploaded</td>
        </tr>
      </table>
      <div style="text-align: center;">
        <a href="https://yourkey.ie/login" style="display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Application</a>
      </div>
    `)
  }
};

interface EvaluateRequest {
  application_id: string;
  force_state?: string; // For manual state overrides (admin actions)
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { application_id, force_state, reason }: EvaluateRequest = await req.json();

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "application_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Evaluating application state for: ${application_id}`);

    // Fetch application data
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (appError || !application) {
      console.error("Application not found:", appError);
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch profile separately (no direct FK relationship)
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", application.user_id)
      .single();

    // Fetch current journey state (or create if doesn't exist)
    let { data: journeyState } = await supabase
      .from("application_journey_state")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    if (!journeyState) {
      // Initialize journey state
      const { data: newState, error: createError } = await supabase
        .from("application_journey_state")
        .insert({
          application_id,
          client_id: application.user_id,
          current_state: APPLICATION_STATES.NOT_STARTED,
          documents_required: DOCUMENT_CHECKLIST
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Failed to create journey state:", createError);
        throw createError;
      }
      journeyState = newState;
    }

    const previousState = journeyState.current_state;
    let newState = previousState;
    let blockers: string[] = [];
    let evaluationNotes = "";

    // If force_state is provided (admin action), use it directly
    if (force_state && Object.values(APPLICATION_STATES).includes(force_state)) {
      newState = force_state;
      evaluationNotes = `Manually set to ${force_state}${reason ? `: ${reason}` : ''}`;
    } else {
      // AI Decision Layer: Evaluate current state based on documents
      const { data: documents } = await supabase
        .from("documents")
        .select("document_type, status, score, approval_status")
        .eq("user_id", application.user_id);

      const submittedTypes = documents?.map(d => d.document_type) || [];
      const uniqueSubmittedTypes = [...new Set(submittedTypes)];
      
      // Calculate completion percentage
      const requiredDocs = DOCUMENT_CHECKLIST;
      const completedDocs = requiredDocs.filter(doc => uniqueSubmittedTypes.includes(doc));
      const completionPercentage = Math.round((completedDocs.length / requiredDocs.length) * 100);
      
      // Check for low-score documents (potential issues)
      const lowScoreDocs = documents?.filter(d => d.score !== null && d.score < 60) || [];
      const pendingApprovalDocs = documents?.filter(d => d.approval_status === 'pending') || [];

      // Determine new state based on document analysis
      if (completedDocs.length === 0) {
        if (uniqueSubmittedTypes.length > 0) {
          newState = APPLICATION_STATES.DOCS_STARTED;
          evaluationNotes = "First document uploaded, but none match required checklist";
        } else {
          newState = APPLICATION_STATES.NOT_STARTED;
          evaluationNotes = "No documents uploaded yet";
        }
      } else if (completionPercentage < 100) {
        if (completionPercentage >= 40) {
          newState = APPLICATION_STATES.DOCS_PARTIAL;
          const missing = requiredDocs.filter(d => !uniqueSubmittedTypes.includes(d));
          blockers = missing.map(d => `Missing: ${d.replace(/_/g, ' ')}`);
          evaluationNotes = `${completionPercentage}% complete. Missing: ${missing.join(', ')}`;
        } else {
          newState = APPLICATION_STATES.DOCS_STARTED;
          evaluationNotes = `Only ${completionPercentage}% complete`;
        }
      } else {
        // All required docs submitted
        if (lowScoreDocs.length > 0 || pendingApprovalDocs.length > 0) {
          newState = APPLICATION_STATES.NEEDS_HUMAN_REVIEW;
          if (lowScoreDocs.length > 0) {
            blockers.push(`${lowScoreDocs.length} document(s) with low AI score`);
          }
          if (pendingApprovalDocs.length > 0) {
            blockers.push(`${pendingApprovalDocs.length} document(s) pending approval`);
          }
          evaluationNotes = "Documents complete but flagged for human review";
        } else {
          newState = APPLICATION_STATES.DOCS_COMPLETE;
          evaluationNotes = "All required documents submitted and verified";
        }
      }

      // Update journey state with new values
      await supabase
        .from("application_journey_state")
        .update({
          current_state: newState,
          previous_state: previousState,
          documents_submitted: uniqueSubmittedTypes,
          documents_completion_percentage: completionPercentage,
          last_evaluation_at: new Date().toISOString(),
          evaluation_notes: evaluationNotes,
          blockers,
          state_changed_at: newState !== previousState ? new Date().toISOString() : journeyState.state_changed_at,
          ...(newState === APPLICATION_STATES.DOCS_STARTED && !journeyState.docs_started_at ? { docs_started_at: new Date().toISOString() } : {}),
          ...(newState === APPLICATION_STATES.DOCS_COMPLETE ? { docs_complete_at: new Date().toISOString() } : {}),
          ...(newState === APPLICATION_STATES.NEEDS_HUMAN_REVIEW ? { human_review_requested_at: new Date().toISOString() } : {}),
          ...(newState === APPLICATION_STATES.APPROVED ? { approved_at: new Date().toISOString() } : {}),
          ...(newState === APPLICATION_STATES.REJECTED ? { rejected_at: new Date().toISOString() } : {}),
          updated_at: new Date().toISOString()
        })
        .eq("id", journeyState.id);
    }

    // Check if state changed
    const stateChanged = newState !== previousState;
    let notificationSent = false;

    if (stateChanged) {
      console.log(`State changed: ${previousState} → ${newState}`);

      // Record state change in history
      await supabase
        .from("application_state_history")
        .insert({
          application_id,
          from_state: previousState,
          to_state: newState,
          trigger_reason: evaluationNotes || reason,
          metadata: { blockers, evaluationNotes }
        });

      // Check if this transition triggers a notification
      const transitionKey = `${previousState}_TO_${newState}`;
      const trigger = NOTIFICATION_TRIGGERS[transitionKey];

      if (trigger) {
        console.log(`Triggering notification for: ${transitionKey}`);
        
        const notificationData = {
          clientEmail: profile?.email || 'Unknown',
          clientName: profile?.full_name || 'Unknown',
          applicationNumber: application.application_number,
          reason: reason || evaluationNotes,
          blockers
        };

        // Send notification
        const { error: notifyError } = await supabase.functions.invoke('send-notification', {
          body: {
            notification_type: trigger.notification_type,
            subject: trigger.subject,
            html_content: trigger.getHtml(notificationData),
            event_data: {
              application_id,
              from_state: previousState,
              to_state: newState,
              ...notificationData
            }
          }
        });

        if (!notifyError) {
          notificationSent = true;
          // Update history to mark notification as sent
          await supabase
            .from("application_state_history")
            .update({ notification_sent: true, notification_type: trigger.notification_type })
            .eq("application_id", application_id)
            .eq("to_state", newState)
            .order("created_at", { ascending: false })
            .limit(1);
        } else {
          console.error("Notification error:", notifyError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        application_id,
        previous_state: previousState,
        current_state: newState,
        state_changed: stateChanged,
        notification_sent: notificationSent,
        evaluation_notes: evaluationNotes,
        blockers
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error evaluating application state:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
