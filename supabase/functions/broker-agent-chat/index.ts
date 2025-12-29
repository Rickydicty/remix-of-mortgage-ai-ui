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

    const prompt = `You are chatting with a mortgage applicant. Be helpful, professional, and reassuring.

CONVERSATION HISTORY:
${historyText}

CLIENT'S NEW MESSAGE:
${message}

APPLICATION CONTEXT:
- Documents submitted: ${docCount || 0}
- Loan amount requested: €${formData?.loan_amount || "Not specified"}
- Property value: €${formData?.property_value || "Not specified"}
- First time buyer: ${formData?.first_time_buyer ? "Yes" : "No"}

RESPONSE RULES:
1. Keep responses concise (2-3 sentences usually)
2. Use simple language, no jargon
3. If they ask about status, be positive but honest
4. If they ask for specific rates or approval, say "I'll have our broker confirm the exact details"
5. Guide them on next steps if documents are missing
6. Never promise approval or specific rates
7. Be warm and supportive - buying a home is exciting!

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
            content: `You are a friendly, professional AI mortgage assistant for Irish homebuyers. 
Keep responses warm but professional. Use "we" language to feel like part of the brokerage team.
If uncertain, recommend speaking with the broker rather than guessing.
Never promise specific rates or approval - only the broker can do that.` 
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
