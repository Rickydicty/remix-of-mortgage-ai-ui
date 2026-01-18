import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    }

    if (docAnalysis?.client_explanation) {
      greetingMessage += `📝 **What you can do:** ${docAnalysis.client_explanation}\n\n`;
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
