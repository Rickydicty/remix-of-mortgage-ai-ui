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

    // Get form data for context
    const { data: formData } = await supabaseClient
      .from("application_form_data")
      .select("loan_amount, property_value, first_time_buyer, app1_forenames, app1_surname")
      .eq("application_id", applicationId)
      .single();

    // Get documents status
    const { data: allDocs } = await supabaseClient
      .from("documents")
      .select("document_type, status, flag_reason")
      .eq("user_id", user.id);

    const requiredDocs = ["certified_id", "proof_of_address", "payslips", "bank_statements", "employment_summary"];
    const submittedTypes = (allDocs || []).map(d => d.document_type);
    const missingDocs = requiredDocs.filter(d => !submittedTypes.includes(d));
    const flaggedDocs = (allDocs || []).filter(d => d.status === "flagged");
    const approvedDocs = (allDocs || []).filter(d => d.status === "approved");

    // Get flagged document details for context
    const flaggedDetails = flaggedDocs.map(d => 
      `${d.document_type}: ${d.flag_reason || "needs review"}`
    ).join(", ");

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

    const prompt = `You are the AI mortgage assistant for an Irish mortgage brokerage. You handle ALL client queries and ONLY escalate to human brokers when absolutely necessary (less than 1% of cases).

YOUR CORE MISSION:
- Resolve 99%+ of queries yourself with helpful, accurate information
- Only escalate for: legal advice, complaints, urgent deadlines, or when client explicitly requests human contact
- Be warm, professional, and incredibly helpful

CONVERSATION HISTORY:
${historyText}

CLIENT'S NEW MESSAGE:
${message}

APPLICATION CONTEXT:
- Client name: ${clientName}
- Documents approved: ${approvedDocs.length} of ${requiredDocs.length}
- Documents missing: ${missingDocs.length > 0 ? missingDocs.join(", ") : "None"}
- Documents flagged: ${flaggedDocs.length > 0 ? flaggedDetails : "None"}
- Loan amount: €${formData?.loan_amount?.toLocaleString() || "Not specified"}
- Property value: €${formData?.property_value?.toLocaleString() || "Not specified"}
- First time buyer: ${formData?.first_time_buyer ? "Yes" : "No"}
- Has assigned broker: ${app.assigned_broker_id ? "Yes" : "Not yet"}

IRISH MORTGAGE KNOWLEDGE:
- Central Bank rules: 4x income limit, 90% LTV for first-time buyers, 80% for others
- Major lenders: AIB, Bank of Ireland, PTSB, Haven, Avant Money, Finance Ireland
- First Home Scheme: Government equity up to 30% for FTBs on new homes
- Help to Buy: Tax refund up to €30,000 for FTBs on new builds
- Typical timeline: 4-6 weeks from complete docs to approval
- Green mortgages: Better rates for BER A/B rated homes

DOCUMENT REQUIREMENTS:
- Certified ID: Passport/driving license certified by solicitor/GP
- Proof of Address: Utility bill or bank statement <3 months old
- Payslips: Last 3 months for employed
- Bank Statements: Last 6 months showing salary credits
- Employment Summary: Letter from employer on company letterhead
- For self-employed: 2 years accounts, Form 11, Chapter 4 tax clearance

WHAT YOU CAN HANDLE (99% of queries):
✓ Document requirements and status
✓ Process timeline and next steps
✓ General mortgage questions
✓ Application status updates
✓ Clarification about flagged documents
✓ Explaining lender requirements
✓ Helping with form completion
✓ First Home Scheme & Help to Buy info
✓ LTV and borrowing capacity questions

WHEN TO ESCALATE TO BROKER (1% of queries):
✗ Client explicitly requests human contact
✗ Legal/solicitor related questions
✗ Complaints about service
✗ Urgent time-sensitive issues
✗ Complex financial restructuring

RESPONSE STYLE:
- Warm and personal (use their name if known)
- Concise but complete (2-4 sentences usually)
- Action-oriented: always tell them what to do next
- Reassuring but honest
- Use "we" and "our team" language

${shouldEscalate ? "NOTE: This query may need escalation. If you cannot fully resolve it, indicate that you're forwarding to their broker." : ""}

Respond directly to the client:`;

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
            content: `You are an expert AI mortgage assistant for an Irish brokerage. You handle 99% of client queries independently.

PERSONALITY:
- Warm, professional, knowledgeable
- Patient and understanding
- Confident but never over-promise
- Speaks with "we/our team" language

EXPERTISE:
- Irish mortgage market specialist
- Central Bank regulations expert
- All major lenders and their requirements
- Government schemes (First Home Scheme, Help to Buy)
- Document requirements for all application types

CAPABILITIES:
- Answer ANY mortgage-related question
- Explain document requirements clearly
- Provide status updates and next steps
- Guide clients through the entire process
- De-escalate frustrated clients
- Resolve concerns without human involvement

ONLY ESCALATE IF:
- Client specifically requests human contact
- Legal/solicitor matters
- Formal complaints
- True emergencies

Your goal is to be so helpful that clients never need to wait for a human response.` 
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
