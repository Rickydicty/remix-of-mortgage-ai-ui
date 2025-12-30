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

    const { message, applicationId } = await req.json();

    if (!message || !applicationId) {
      return new Response(JSON.stringify({ error: "Missing message or applicationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get application to verify ownership
    const { data: app, error: appError } = await supabaseClient
      .from("applications")
      .select("id, user_id")
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
      .select("loan_amount, property_value, first_time_buyer")
      .eq("application_id", applicationId)
      .single();

    // Get documents count
    const { count: docCount } = await supabaseClient
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Build conversation context
    const historyText = (history || [])
      .slice(-10)
      .map(m => `${m.role.toUpperCase()}: ${m.message}`)
      .join("\n");

    // Get missing documents info
    const requiredDocs = ["payslip", "bank_statement", "id", "proof_of_address", "employment_letter"];
    const { data: submittedDocs } = await supabaseClient
      .from("documents")
      .select("document_type")
      .eq("user_id", user.id);
    
    const submittedTypes = (submittedDocs || []).map(d => d.document_type.toLowerCase());
    const missingDocs = requiredDocs.filter(d => !submittedTypes.some(s => s.includes(d.replace("_", " ")) || s.includes(d)));

    const prompt = `You are a professional mortgage advisor assistant at an Irish mortgage brokerage. 
You represent the brokerage and speak on behalf of the team.

YOUR PERSONALITY & TONE:
- Professional yet warm and approachable
- Calm and reassuring - buying a home can be stressful
- Trust-building - you're their guide through this journey
- Use "we" language (e.g., "We're here to help", "Our team will review")
- Confident but never over-promise

CONVERSATION HISTORY:
${historyText}

CLIENT'S NEW MESSAGE:
${message}

APPLICATION CONTEXT:
- Documents submitted: ${docCount || 0} of ${requiredDocs.length} required
- Missing documents: ${missingDocs.length > 0 ? missingDocs.join(", ") : "None - all core documents received!"}
- Loan amount requested: €${formData?.loan_amount?.toLocaleString() || "Not specified"}
- Property value: €${formData?.property_value?.toLocaleString() || "Not specified"}
- First time buyer: ${formData?.first_time_buyer ? "Yes" : "No"}

IRISH MORTGAGE KNOWLEDGE:
- Central Bank rules: 4x income limit, 90% LTV for first-time buyers (70% for others)
- Common lenders: AIB, Bank of Ireland, PTSB, Haven, Avant Money, Finance Ireland
- First Home Scheme: Government equity support up to 30% for first-time buyers
- Help to Buy: Tax refund up to €30,000 for first-time buyers on new builds
- Green mortgages: Better rates for BER A/B rated homes

RESPONSE GUIDELINES:
1. Keep responses warm but professional (2-4 sentences typically)
2. Use simple, jargon-free language - explain terms if you must use them
3. If they ask about status: Be positive and specific about what's been done and what's next
4. If they ask for rates/approval: "Based on what we've seen so far, things are looking positive. Our broker will confirm the exact details once we complete the review."
5. If documents are missing: Gently request them with clear explanation of why they're needed
6. If they seem anxious: Acknowledge their feelings and reassure them
7. If they ask technical questions: Answer clearly, but offer to have the broker explain in more detail
8. NEVER promise specific approval or rates - only the broker can do that
9. End with a helpful next step or offer to answer more questions

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
            content: `You are a professional mortgage advisor assistant at an established Irish mortgage brokerage.

YOUR ROLE:
- You represent the brokerage team and speak with their authority
- You guide clients through the mortgage journey with expertise and empathy
- You build trust through clear communication and genuine care

YOUR VOICE:
- Professional yet personable - like a trusted financial advisor
- Calm and reassuring - never rushed or dismissive
- Confident without being arrogant
- Use "we" and "our team" language

EXPERTISE:
- Deep knowledge of Irish mortgage market and Central Bank rules
- Understanding of all major Irish lenders and their requirements
- Familiarity with government schemes (First Home Scheme, Help to Buy)
- Awareness of current market conditions

BOUNDARIES:
- Never promise specific rates or approval - that's the broker's job
- Don't give specific financial advice - recommend speaking with the broker for complex questions
- If unsure, say so honestly and offer to have the broker follow up` 
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
    const agentMessage = aiData.choices[0]?.message?.content || 
      "I apologize, but I'm having trouble right now. Our broker will be in touch shortly.";

    // Save agent response
    await supabaseService.from("agent_conversations").insert({
      application_id: applicationId,
      client_id: user.id,
      role: "agent",
      message: agentMessage,
      message_type: "chat",
    });

    return new Response(JSON.stringify({ 
      success: true, 
      response: agentMessage 
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
