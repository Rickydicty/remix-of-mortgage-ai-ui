import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email helper functions
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

const btnStyle = "display:inline-block;background:linear-gradient(135deg,#4CAF50,#2E7D32);color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;";

const getAIDocIssueEmail = (clientName: string, docType: string, issue: string) => getEmailWrapper(`
  <h2 style="margin:0 0 20px;color:#333;font-size:24px;">⚠️ Document Needs Attention</h2>
  <p style="margin:0 0 15px;color:#555;font-size:16px;">Hello <strong>${clientName}</strong>,</p>
  <p style="margin:0 0 20px;color:#555;font-size:16px;">Our system reviewed your <strong>${docType}</strong> and found an issue:</p>
  <div style="background:#fff3e0;border-left:4px solid #ff9800;padding:15px 20px;margin:20px 0;border-radius:0 4px 4px 0;">
    <p style="margin:0;color:#333;font-size:15px;">${issue}</p>
  </div>
  <div style="text-align:center;"><a href="https://yourkey.ie/login" style="${btnStyle}">Review &amp; Respond</a></div>
`);

const getRiskAnomalyEmail = (appNumber: string, clientName: string, details: string) => getEmailWrapper(`
  <h2 style="margin:0 0 20px;color:#333;font-size:24px;">🚨 Risk / Anomaly Detected</h2>
  <p style="margin:0 0 20px;color:#555;font-size:16px;">A potential risk has been flagged on application <strong>${appNumber}</strong>.</p>
  <table width="100%" cellspacing="0" cellpadding="8" style="background:#ffebee;border-radius:6px;margin:20px 0;">
    <tr><td style="color:#c62828;font-size:14px;border-bottom:1px solid #ffcdd2;"><strong>Client:</strong></td>
    <td style="color:#333;font-size:14px;border-bottom:1px solid #ffcdd2;">${clientName}</td></tr>
    <tr><td style="color:#c62828;font-size:14px;"><strong>Details:</strong></td>
    <td style="color:#333;font-size:14px;">${details}</td></tr>
  </table>
  <div style="text-align:center;"><a href="https://yourkey.ie/login" style="${btnStyle}">Review Application</a></div>
`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { applicationId, documentType, documentId, score, autoApproved, filename } = await req.json();

    if (!applicationId || !documentType) {
      return new Response(JSON.stringify({ error: "Missing applicationId or documentType" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for agent operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get client name from form data
    const { data: formData } = await supabaseClient
      .from("application_form_data")
      .select("app1_forenames, app1_surname, app1_address_line1, app1_address_line2, app1_county")
      .eq("application_id", applicationId)
      .single();

    const clientName = formData?.app1_forenames || "there";

    // Get document analysis if available
    let docAnalysis = null;
    if (documentId) {
      const { data: analysis } = await supabaseService
        .from("agent_document_analysis")
        .select("risk_flags, quality_issues, client_explanation, extracted_data")
        .eq("document_id", documentId)
        .single();
      docAnalysis = analysis;
    }

    // Get all documents to understand overall progress
    const { data: allDocs } = await supabaseClient
      .from("documents")
      .select("document_type, status, approval_status")
      .eq("user_id", user.id);

    const requiredDocs = ["certified_id", "proof_of_address", "payslips", "current_account_statements", "employment_summary"];
    const submittedTypes = (allDocs || []).map(d => d.document_type);
    const approvedCount = (allDocs || []).filter(d => d.status === "approved" || d.approval_status === "approved").length;
    const totalSubmitted = allDocs?.length || 0;
    const missingDocs = requiredDocs.filter(d => !submittedTypes.includes(d));

    // Document type labels for friendly messaging
    const docTypeLabels: Record<string, string> = {
      "certified_id": "Certified ID",
      "proof_of_address": "Proof of Address",
      "payslips": "Payslips",
      "current_account_statements": "Bank Statements",
      "savings_account_statements": "Savings Statements",
      "employment_summary": "Employment Summary",
      "salary_cert": "Salary Certificate",
      "marriage_certificate": "Marriage Certificate",
      "self_employed_docs": "Self-Employed Documents",
      "tax_clearance": "Tax Clearance Certificate",
      "gift_letter": "Gift Letter",
      "loan_account_statements": "Loan Statements",
      "mortgage_statements": "Mortgage Statements",
      "application_form": "Application Form",
      "other": "Document"
    };

    const docLabel = docTypeLabels[documentType] || documentType;

    // Build personalized greeting message based on context
    let greetingMessage = "";

    // Thank them for the upload
    greetingMessage = `Thanks for uploading your ${docLabel}, ${clientName}! `;

    if (autoApproved) {
      greetingMessage += `Great news - it's been automatically verified with a score of ${score}/100. ✅\n\n`;
    } else {
      greetingMessage += `It's now pending review (score: ${score}/100). I'll keep you posted on its status.\n\n`;
    }

    // Add context-specific guidance based on document type and form data
    if (documentType === "proof_of_address") {
      if (formData?.app1_address_line1) {
        greetingMessage += `I can see your address is listed as "${formData.app1_address_line1}${formData.app1_address_line2 ? ', ' + formData.app1_address_line2 : ''}${formData.app1_county ? ', ' + formData.app1_county : ''}". Just make sure your proof of address matches this exactly!\n\n`;
      } else {
        greetingMessage += `**Quick note**: I noticed your current address details haven't been filled in on your application form yet. Please update your Address Line 1, Address Line 2, and County in the Personal Details section so we can verify this document matches your application.\n\n`;
      }
    } else if (documentType === "payslips") {
      greetingMessage += `I'll be checking that your payslips cover the last 3 months and match your stated income. If there are any discrepancies, I'll flag them for you.\n\n`;
    } else if (documentType === "current_account_statements") {
      greetingMessage += `I'm reviewing your bank statements to ensure they cover 6 months and show your regular income deposits. Any unusual transactions will be noted for discussion.\n\n`;
    } else if (documentType === "certified_id") {
      greetingMessage += `I'll verify your ID matches the name on your application and that the certification is valid.\n\n`;
    }

    // Add quality issues if flagged
    if (docAnalysis?.quality_issues && Array.isArray(docAnalysis.quality_issues) && docAnalysis.quality_issues.length > 0) {
      greetingMessage += `⚠️ **A few things to note about this document:**\n`;
      (docAnalysis.quality_issues as string[]).forEach((issue: string) => {
        greetingMessage += `• ${issue}\n`;
      });
      greetingMessage += "\n";

      // Send email to client about the document issue
      const userProfile = await supabaseService
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      if (userProfile.data?.email) {
        const issueDetails = (docAnalysis.quality_issues as string[]).join("; ");
        await supabaseService.functions.invoke('send-notification', {
          body: {
            notification_type: 'ai_document_issue',
            subject: `Action Needed: Your ${docLabel} requires attention`,
            recipient_email: userProfile.data.email,
            html_content: getAIDocIssueEmail(
              userProfile.data.full_name || clientName,
              docLabel,
              issueDetails
            ),
          }
        });
      }
    }

    if (docAnalysis?.client_explanation) {
      greetingMessage += `📝 **What you can do:** ${docAnalysis.client_explanation}\n\n`;
    }

    // Also send email if score is low (missing/incorrect doc detection)
    if (score !== undefined && score < 60) {
      const userProfile = await supabaseService
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      if (userProfile.data?.email) {
        await supabaseService.functions.invoke('send-notification', {
          body: {
            notification_type: 'ai_document_issue',
            subject: `Action Needed: Your ${docLabel} needs review`,
            recipient_email: userProfile.data.email,
            html_content: getAIDocIssueEmail(
              userProfile.data.full_name || clientName,
              docLabel,
              `Your document scored ${score}/100. This may indicate the document is incomplete, unclear, or doesn't match your application details. Please review and re-upload if needed.`
            ),
          }
        });
      }

      // Send risk/anomaly email to broker
      const { data: appData } = await supabaseService
        .from("applications")
        .select("assigned_broker_id, application_number")
        .eq("id", applicationId)
        .single();

      if (appData?.assigned_broker_id) {
        const { data: brokerProfile } = await supabaseService
          .from("profiles")
          .select("email, full_name")
          .eq("id", appData.assigned_broker_id)
          .single();

        if (brokerProfile?.email) {
          const userProfile2 = await supabaseService
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          await supabaseService.functions.invoke('send-notification', {
            body: {
              notification_type: 'risk_anomaly',
              subject: `Risk Alert: Low document score for ${appData.application_number}`,
              recipient_email: brokerProfile.email,
              html_content: getRiskAnomalyEmail(
                appData.application_number,
                userProfile2.data?.full_name || 'Client',
                `${docLabel} scored ${score}/100 — potential quality or authenticity issue detected.`
              ),
            }
          });
        }
      }
    }

    // Add progress update
    greetingMessage += `📊 **Your document progress:** ${approvedCount} approved out of ${totalSubmitted} submitted.`;
    
    if (missingDocs.length > 0) {
      const missingLabels = missingDocs.map(d => docTypeLabels[d] || d).slice(0, 3);
      greetingMessage += ` Still needed: ${missingLabels.join(", ")}${missingDocs.length > 3 ? ` and ${missingDocs.length - 3} more` : ""}.`;
    } else {
      greetingMessage += " All key documents submitted! 🎉";
    }

    greetingMessage += "\n\nLet me know if you have any questions about this document or your application!";

    // Save the agent greeting message
    await supabaseService.from("agent_conversations").insert({
      application_id: applicationId,
      client_id: user.id,
      role: "agent",
      message: greetingMessage,
      message_type: "document_greeting",
      metadata: { documentType, documentId, score, autoApproved }
    });

    console.log(`Document greeting sent for ${documentType} to user ${user.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: greetingMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Document greeting error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
