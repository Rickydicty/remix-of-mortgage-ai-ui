import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AI Provider configurations
interface AIProvider {
  name: string;
  call: (systemPrompt: string, userPrompt: string) => Promise<string>;
}

// Gemini API call helper
async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error: ${response.status}`, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Groq API call helper (compound-beta model)
async function callGroq(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "compound-beta",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Groq API error: ${response.status}`, errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Call AI - TESTING MODE: Only use Gemini Primary (fallbacks disabled)
async function callAIWithFallback(systemPrompt: string, userPrompt: string): Promise<{ text: string; provider: string }> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  // DISABLED FOR TESTING:
  // const geminiBackupKey = Deno.env.get("GEMINI_API_KEY_BACKUP");
  // const groqKey = Deno.env.get("GROQ_API_KEY");

  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log("Testing Gemini Primary only (fallbacks disabled)");
  const text = await callGemini(geminiKey, systemPrompt, userPrompt);
  console.log("Success with Gemini Primary");
  return { text, provider: "Gemini Primary (test mode)" };
}

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

    // Get ALL documents sorted by created_at to get latest version of each type
    const { data: allDocsRaw } = await supabaseClient
      .from("documents")
      .select("id, document_type, status, flag_reason, approval_status, analysis_text, filename, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Get only the LATEST version of each document type
    const latestDocsByType = new Map();
    (allDocsRaw || []).forEach(doc => {
      if (!latestDocsByType.has(doc.document_type)) {
        latestDocsByType.set(doc.document_type, doc);
      }
    });
    const allDocs = Array.from(latestDocsByType.values());

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

    // Required docs - excludes loan_request and property_valuation (these are form-based, not uploads)
    const requiredDocs = ["certified_id", "proof_of_address", "payslips", "bank_statements", "employment_summary"];
    const submittedTypes = allDocs.map(d => d.document_type);
    const missingDocs = requiredDocs.filter(d => !submittedTypes.includes(d));
    
    // Categorize by CURRENT status (latest upload only)
    const approvedDocs = allDocs.filter(d => d.approval_status === "approved" || d.status === "approved");
    const rejectedDocs = allDocs.filter(d => d.approval_status === "rejected" || d.status === "rejected");
    const flaggedDocs = allDocs.filter(d => d.status === "flagged" && d.approval_status !== "approved" && d.approval_status !== "rejected");
    const pendingDocs = allDocs.filter(d => (d.status === "pending" || d.approval_status === "pending") && d.approval_status !== "approved" && d.approval_status !== "rejected");

    // Build detailed document context with analysis
    const docAnalysisMap = new Map((docAnalysis || []).map(a => [a.document_id, a]));
    
    // Build approved docs list
    const approvedDocsList = approvedDocs.map(doc => {
      return `✅ ${doc.document_type.replace(/_/g, ' ')}: Approved`;
    }).join("\n");

    // Build rejected docs list with reasons
    const rejectedDocsList = rejectedDocs.map(doc => {
      const analysis = docAnalysisMap.get(doc.id);
      let reason = doc.flag_reason || "No specific reason provided";
      if (analysis?.quality_issues && Array.isArray(analysis.quality_issues) && analysis.quality_issues.length > 0) {
        reason = analysis.quality_issues.join(", ");
      }
      if (analysis?.client_explanation) {
        reason += ` - ${analysis.client_explanation}`;
      }
      return `❌ ${doc.document_type.replace(/_/g, ' ')}: Rejected - ${reason}`;
    }).join("\n");

    // Build flagged docs list with reasons
    const flaggedDocsList = flaggedDocs.map(doc => {
      const analysis = docAnalysisMap.get(doc.id);
      let reason = doc.flag_reason || "Needs review";
      if (analysis?.quality_issues && Array.isArray(analysis.quality_issues) && analysis.quality_issues.length > 0) {
        reason = analysis.quality_issues.join(", ");
      }
      return `⚠️ ${doc.document_type.replace(/_/g, ' ')}: Flagged - ${reason}`;
    }).join("\n");

    // Build pending docs list
    const pendingDocsList = pendingDocs.map(doc => {
      return `⏳ ${doc.document_type.replace(/_/g, ' ')}: Pending review`;
    }).join("\n");

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

    const userPrompt = `You are Éire, the AI mortgage assistant for an Irish mortgage brokerage.

**CRITICAL INSTRUCTION**: Answer the client's question DIRECTLY and SPECIFICALLY. Use the ACTUAL data below.

=== CLIENT'S COMPLETE APPLICATION DATA ===

${formSummary}

=== DOCUMENT STATUS (LATEST VERSION OF EACH DOCUMENT TYPE ONLY) ===

**APPROVED DOCUMENTS (${approvedDocs.length}):**
${approvedDocsList || 'None approved yet'}

**REJECTED DOCUMENTS (${rejectedDocs.length}):**
${rejectedDocsList || 'None rejected'}

**FLAGGED FOR REVIEW (${flaggedDocs.length}):**
${flaggedDocsList || 'None flagged'}

**PENDING REVIEW (${pendingDocs.length}):**
${pendingDocsList || 'None pending'}

**MISSING DOCUMENTS (${missingDocs.length}):**
${missingDocs.length > 0 ? missingDocs.map(d => `📋 ${d.replace(/_/g, ' ')}`).join('\n') : 'All required documents submitted!'}

**Note:** Loan request amount and property valuation are provided in the application form, not as document uploads.

${analysisSummary}

=== CONVERSATION HISTORY ===
${historyText}

=== CLIENT'S NEW MESSAGE ===
"${message}"

=== YOUR RESPONSE RULES ===

1. **ANSWER THE QUESTION DIRECTLY FIRST**: If they ask "how many docs approved?" - start with the exact number. Example: "You have ${approvedDocs.length} documents approved!"

2. **FOR DOCUMENT COUNT QUESTIONS**: Give the exact count, then list them by name.

3. **FOR REJECTED DOCUMENTS**: Always explain the SPECIFIC reason from the data above.

4. **ONLY USE LATEST UPLOADS**: If a document was rejected before but approved now, it counts as approved (we only show latest version).

5. **NAME**: Address them as ${clientName}

6. **BE CONCISE**: Answer what they asked, don't over-explain.

=== IRISH MORTGAGE KNOWLEDGE ===
- Central Bank rules: 4x income limit, 90% LTV for FTBs, 80% for others
- Major lenders: AIB, Bank of Ireland, PTSB, Haven, Avant Money

${shouldEscalate ? "⚠️ This query may need escalation to a human broker." : ""}

Respond now - answer their question directly first:`;

    const systemPrompt = `You are Aida, an Irish mortgage assistant.

CRITICAL: Give SHORT, DIRECT answers (1-3 sentences max).

EXAMPLES:
- "How many approved?" → "3 approved: Certified ID, Proof of Address, Payslips."
- "Which rejected?" → "Bank Statements rejected: doesn't cover 6 months."
- "What's missing?" → "Missing: Employment Summary."

NO long explanations. NO encouragement unless asked. Just answer the question.`;

    // Call AI with automatic fallback
    const { text: agentMessage, provider: usedProvider } = await callAIWithFallback(systemPrompt, userPrompt);
    console.log(`Response generated using: ${usedProvider}`);

    const finalMessage = agentMessage || "I apologize, but I'm having trouble right now. Let me connect you with our team.";

    // Check if the AI response indicates escalation
    const responseIndicatesEscalation = shouldEscalate || 
      finalMessage.toLowerCase().includes("forwarding to") ||
      finalMessage.toLowerCase().includes("connect you with") ||
      finalMessage.toLowerCase().includes("broker will");

    // If escalating, send message to broker
    if (responseIndicatesEscalation && app.assigned_broker_id) {
      await supabaseService.from("messages").insert({
        sender_id: user.id,
        receiver_id: app.assigned_broker_id,
        application_id: applicationId,
        message: `[AI Escalation] Client message: "${message}"\n\nContext: ${rejectedDocs.length} rejected docs, ${flaggedDocs.length} flagged docs, ${missingDocs.length} missing docs.`,
        approval_status: "approved",
      });
    }

    // Save agent response
    await supabaseService.from("agent_conversations").insert({
      application_id: applicationId,
      client_id: user.id,
      role: "agent",
      message: finalMessage,
      message_type: responseIndicatesEscalation ? "escalation" : "chat",
    });

    return new Response(JSON.stringify({ 
      success: true, 
      response: finalMessage,
      escalated: responseIndicatesEscalation,
      provider: usedProvider
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
