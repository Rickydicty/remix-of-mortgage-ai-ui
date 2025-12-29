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

// State transitions that trigger notifications
const NOTIFICATION_TRIGGERS: Record<string, { notification_type: string; subject: string; getHtml: (data: any) => string }> = {
  // When docs go from partial to complete
  [`${APPLICATION_STATES.DOCS_PARTIAL}_TO_${APPLICATION_STATES.DOCS_COMPLETE}`]: {
    notification_type: "docs_complete",
    subject: "Application Documents Complete - Ready for Review",
    getHtml: (data) => `
      <h2>Documents Complete!</h2>
      <p>Client <strong>${data.clientEmail}</strong> has submitted all required documents.</p>
      <p>Application ID: ${data.applicationNumber}</p>
      <p>The application is now ready for AI review.</p>
    `
  },
  // When AI review flags issues requiring human review
  [`${APPLICATION_STATES.UNDER_AI_REVIEW}_TO_${APPLICATION_STATES.NEEDS_HUMAN_REVIEW}`]: {
    notification_type: "human_review_needed",
    subject: "⚠️ Application Requires Human Review",
    getHtml: (data) => `
      <h2>Human Review Required</h2>
      <p>Application <strong>${data.applicationNumber}</strong> has been flagged for human review.</p>
      <p>Reason: ${data.reason || 'AI analysis detected potential issues'}</p>
      <h3>Blockers:</h3>
      <ul>
        ${(data.blockers || []).map((b: string) => `<li>${b}</li>`).join('')}
      </ul>
      <p>Please review in the broker dashboard.</p>
    `
  },
  // When application is approved
  [`${APPLICATION_STATES.NEEDS_HUMAN_REVIEW}_TO_${APPLICATION_STATES.APPROVED}`]: {
    notification_type: "application_approved",
    subject: "✅ Application Approved",
    getHtml: (data) => `
      <h2>Application Approved!</h2>
      <p>Application <strong>${data.applicationNumber}</strong> has been approved.</p>
      <p>Client: ${data.clientEmail}</p>
    `
  },
  // When application is rejected
  [`${APPLICATION_STATES.NEEDS_HUMAN_REVIEW}_TO_${APPLICATION_STATES.REJECTED}`]: {
    notification_type: "application_rejected", 
    subject: "❌ Application Rejected",
    getHtml: (data) => `
      <h2>Application Rejected</h2>
      <p>Application <strong>${data.applicationNumber}</strong> has been rejected.</p>
      <p>Client: ${data.clientEmail}</p>
      <p>Reason: ${data.reason || 'See application details'}</p>
    `
  },
  // First document uploaded - journey started
  [`${APPLICATION_STATES.NOT_STARTED}_TO_${APPLICATION_STATES.DOCS_STARTED}`]: {
    notification_type: "journey_started",
    subject: "New Client Started Application",
    getHtml: (data) => `
      <h2>New Application Started</h2>
      <p>Client <strong>${data.clientEmail}</strong> has started their mortgage application.</p>
      <p>Application ID: ${data.applicationNumber}</p>
      <p>First document uploaded.</p>
    `
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
