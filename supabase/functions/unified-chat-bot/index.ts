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

    const { message, applicationId, brokerId } = await req.json();

    if (!message || !applicationId) {
      return new Response(JSON.stringify({ error: "Missing message or applicationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get application to verify ownership
    const { data: app, error: appError } = await supabaseClient
      .from("applications")
      .select("id, user_id, assigned_broker_id")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .single();

    if (appError || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for agent operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Save client message
    await supabaseService.from("agent_conversations").insert({
      application_id: applicationId,
      client_id: user.id,
      role: "client",
      message: message,
      message_type: "chat",
    });

    // Get conversation history
    const { data: history } = await supabaseService
      .from("agent_conversations")
      .select("role, message, created_at")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });

    // Get FULL form data for comprehensive context
    const { data: formData } = await supabaseClient
      .from("application_form_data")
      .select("*")
      .eq("application_id", applicationId)
      .single();

    // Get FULL documents with all details
    const { data: allDocs } = await supabaseClient
      .from("documents")
      .select("id, document_type, status, flag_reason, approval_status, analysis_text, filename, created_at")
      .eq("user_id", user.id);

    // Get document analysis for detailed rejection reasons
    const { data: docAnalysis } = await supabaseService
      .from("agent_document_analysis")
      .select("document_id, risk_level, risk_flags, quality_issues, client_explanation, completeness_score, extracted_data")
      .eq("client_id", user.id);

    // Get application analysis for AI insights
    const { data: appAnalysis } = await supabaseService
      .from("agent_application_analysis")
      .select("*")
      .eq("application_id", applicationId)
      .single();

    const requiredDocs = ["certified_id", "proof_of_address", "payslips", "bank_statements", "employment_summary"];
    const submittedTypes = (allDocs || []).map(d => d.document_type);
    const missingDocs = requiredDocs.filter(d => !submittedTypes.includes(d));
    const flaggedDocs = (allDocs || []).filter(d => d.status === "flagged" || d.approval_status === "rejected");
    const approvedDocs = (allDocs || []).filter(d => d.status === "approved" || d.approval_status === "approved");
    const pendingDocs = (allDocs || []).filter(d => d.status === "pending" || d.approval_status === "pending");

    // Build detailed document context with analysis
    const docAnalysisMap = new Map((docAnalysis || []).map(a => [a.document_id, a]));
    const detailedDocStatus = (allDocs || []).map(doc => {
      const analysis = docAnalysisMap.get(doc.id);
      let status = `${doc.document_type}: ${doc.status}`;
      if (doc.flag_reason) status += ` - Reason: ${doc.flag_reason}`;
      if (analysis?.quality_issues) status += ` - Issues: ${JSON.stringify(analysis.quality_issues)}`;
      if (analysis?.risk_flags) status += ` - Flags: ${JSON.stringify(analysis.risk_flags)}`;
      if (analysis?.client_explanation) status += ` - Explanation needed: ${analysis.client_explanation}`;
      return status;
    }).join("\n");

    // Get flagged document details for context
    const flaggedDetails = flaggedDocs.map(d => {
      const analysis = docAnalysisMap.get(d.id);
      let detail = `${d.document_type}: ${d.flag_reason || "needs review"}`;
      if (analysis?.client_explanation) detail += ` (${analysis.client_explanation})`;
      return detail;
    }).join(", ");

    // Build conversation context
    const historyText = (history || [])
      .slice(-15)
      .map(m => `${m.role.toUpperCase()}: ${m.message}`)
      .join("\n");

    // Determine if this should be escalated to broker
    const escalationKeywords = [
      "speak to broker", "talk to broker", "human", "real person",
      "call me", "phone", "urgent", "complaint", "unhappy", "frustrated",
      "legal", "solicitor", "lawyer", "deadline", "emergency"
    ];
    
    const shouldEscalate = escalationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    const clientName = formData?.app1_forenames 
      ? `${formData.app1_forenames}` 
      : "there";

    // Build comprehensive form data summary
    const formSummary = formData ? `
PERSONAL DETAILS:
- Name: ${formData.app1_forenames || ''} ${formData.app1_surname || ''} 
- DOB: ${formData.app1_date_of_birth || 'Not provided'}
- Address: ${formData.app1_address_line1 || ''} ${formData.app1_address_line2 || ''} ${formData.app1_county || ''}
- Employment: ${formData.app1_employment_type || 'Not specified'} at ${formData.app1_employer_name || 'Not specified'}
- Gross Salary: €${formData.app1_gross_salary?.toLocaleString() || 'Not provided'}
- Net Monthly Income: €${formData.app1_net_monthly_income?.toLocaleString() || 'Not provided'}

MORTGAGE DETAILS:
- Loan Amount Requested: €${formData.loan_amount?.toLocaleString() || 'Not specified'}
- Property Value: €${formData.property_value?.toLocaleString() || 'Not specified'}
- Deposit Amount: €${formData.deposit_amount?.toLocaleString() || 'Not specified'}
- Mortgage Term: ${formData.mortgage_term || 'Not specified'} years
- Mortgage Purpose: ${formData.mortgage_purpose || 'Not specified'}
- First Time Buyer: ${formData.first_time_buyer ? 'Yes' : 'No'}
- Help to Buy: ${formData.help_to_buy ? 'Yes' : 'No'}

PROPERTY DETAILS:
- Property Type: ${formData.property_type || 'Not specified'}
- Property Address: ${formData.property_address_line1 || 'Not yet identified'}
- BER Rating: ${formData.ber_rating || 'Not provided'}

FINANCIAL:
- Monthly Commitments: €${formData.monthly_commitments?.toLocaleString() || '0'}
- Existing Loans: €${formData.existing_loans?.toLocaleString() || '0'}
- Savings: €${formData.savings?.toLocaleString() || 'Not provided'}

CREDIT HISTORY:
- Has Arrears: ${formData.has_arrears ? 'YES - IMPORTANT' : 'No'}
- Has CCJ: ${formData.has_ccj ? 'YES - IMPORTANT' : 'No'}
- Bankruptcy: ${formData.app1_bankruptcy ? 'YES - IMPORTANT' : 'No'}
- Refused Mortgage Before: ${formData.app1_refused_mortgage ? 'YES' : 'No'}
` : 'Form data not yet submitted';

    // Application analysis summary
    const analysisSummary = appAnalysis ? `
AI ANALYSIS:
- Readiness Score: ${appAnalysis.readiness_score || 'Not calculated'}%
- Risk Level: ${appAnalysis.overall_risk_level || 'Not assessed'}
- Submission Ready: ${appAnalysis.submission_ready ? 'YES' : 'NO - issues to resolve'}
- Estimated Approval Amount: €${appAnalysis.estimated_approval_amount?.toLocaleString() || 'Not calculated'}
- Open Items: ${appAnalysis.open_items ? JSON.stringify(appAnalysis.open_items) : 'None'}
- Blockers: ${appAnalysis.aggregated_flags ? JSON.stringify(appAnalysis.aggregated_flags) : 'None identified'}
` : '';

    const prompt = `You are Éire, the AI mortgage assistant for an Irish mortgage brokerage.

**CRITICAL INSTRUCTION**: You MUST reference the client's ACTUAL data below in EVERY response. Never give generic answers - always tie your response to their specific documents, form data, and application status.

=== CLIENT'S COMPLETE APPLICATION DATA ===

${formSummary}

=== DOCUMENT STATUS (CRITICAL - ALWAYS REFERENCE THIS) ===

DETAILED STATUS OF EACH DOCUMENT:
${detailedDocStatus || 'No documents submitted yet'}

SUMMARY:
- ✅ Approved Documents: ${approvedDocs.length} (${approvedDocs.map(d => d.document_type).join(', ') || 'None'})
- ⏳ Pending Review: ${pendingDocs.length} (${pendingDocs.map(d => d.document_type).join(', ') || 'None'})
- ❌ Flagged/Rejected: ${flaggedDocs.length} (${flaggedDetails || 'None'})
- 📋 Missing Documents: ${missingDocs.length > 0 ? missingDocs.join(', ') : 'All required docs submitted!'}

${analysisSummary}

=== CONVERSATION HISTORY ===
${historyText}

=== CLIENT'S NEW MESSAGE ===
"${message}"

=== YOUR RESPONSE RULES ===

1. **ALWAYS REFERENCE THEIR DATA**: If they ask about documents, tell them EXACTLY which are approved/pending/flagged/missing. If they ask about their application, reference their ACTUAL loan amount, property value, income.

2. **FOR FLAGGED DOCUMENTS**: If any document is flagged, explain the SPECIFIC reason from the data above. Example: "Your bank statements were flagged because [exact flag_reason]"

3. **FOR QUESTIONS ABOUT STATUS**: Reference their actual numbers - "You have X of Y documents approved, with Z flagged"

4. **FOR GENERAL QUESTIONS**: Still tie it back to their situation - "Given your €X loan amount and €Y income..."

5. **NEXT STEPS**: Always end with a clear action based on their ACTUAL status

6. **NAME**: Address them as ${clientName}

=== IRISH MORTGAGE KNOWLEDGE ===
- Central Bank rules: 4x income limit, 90% LTV for FTBs, 80% for others
- Major lenders: AIB, Bank of Ireland, PTSB, Haven, Avant Money
- First Home Scheme: Government equity up to 30% for new homes
- Help to Buy: Tax refund up to €30,000 for FTBs on new builds
- Green mortgages: Better rates for BER A/B homes

${shouldEscalate ? "⚠️ This query may need escalation to a human broker." : ""}

Respond now - be warm, specific to their data, and action-oriented:`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are Éire, an expert AI mortgage assistant for an Irish brokerage.

**YOUR #1 RULE**: NEVER give generic answers. You have FULL ACCESS to the client's application data, documents, and status. USE IT in every response.

EXAMPLES OF BAD RESPONSES (NEVER DO THIS):
❌ "Your documents are being processed" (too vague)
❌ "You'll need to submit bank statements" (without checking if they already did)
❌ "The typical loan amount is..." (when you know their exact request)

EXAMPLES OF GOOD RESPONSES (ALWAYS DO THIS):
✅ "Your bank statements from AIB were flagged because they don't show 6 months of history - you've only provided 4 months. Please upload statements going back to [date]."
✅ "Great news! 4 of your 5 documents are approved. You're just waiting on your employment summary which is currently pending review."
✅ "Based on your €85,000 combined income and €340,000 property value, you're looking at an 80% LTV which qualifies you for..."

PERSONALITY:
- Warm and personal (use their name)
- Incredibly specific (always reference their actual data)
- Knowledgeable about Irish mortgages
- Action-oriented (clear next steps)
- Reassuring but honest

Remember: The client's COMPLETE data is provided. Reference it directly.` 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let agentMessage = aiData.choices[0]?.message?.content || 
      "I apologize, but I'm having trouble right now. Let me connect you with our team.";

    // Check if the AI response indicates escalation
    const responseIndicatesEscalation = shouldEscalate || 
      agentMessage.toLowerCase().includes("forwarding to") ||
      agentMessage.toLowerCase().includes("connect you with") ||
      agentMessage.toLowerCase().includes("broker will");

    // If escalating, send message to broker
    if (responseIndicatesEscalation && app.assigned_broker_id) {
      await supabaseService.from("messages").insert({
        sender_id: user.id,
        receiver_id: app.assigned_broker_id,
        application_id: applicationId,
        message: `[AI Escalation] Client message: "${message}"\n\nContext: ${flaggedDocs.length} flagged docs, ${missingDocs.length} missing docs.`,
        approval_status: "approved",
      });
    }

    // Save agent response
    await supabaseService.from("agent_conversations").insert({
      application_id: applicationId,
      client_id: user.id,
      role: "agent",
      message: agentMessage,
      message_type: responseIndicatesEscalation ? "escalation" : "chat",
    });

    return new Response(JSON.stringify({ 
      success: true, 
      response: agentMessage,
      escalated: responseIndicatesEscalation
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
