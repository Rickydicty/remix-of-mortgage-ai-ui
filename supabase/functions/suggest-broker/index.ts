import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, clientName, brokers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Prepare broker data for AI
    const brokerInfo = brokers.map((b: any) => 
      `${b.full_name} (ID: ${b.id}) - Currently has ${b.client_count || 0} clients`
    ).join("\n");

    const prompt = `You are an intelligent broker assignment system. Based on the workload, suggest the best broker to assign to client "${clientName}".

Available brokers:
${brokerInfo}

Consider:
1. Current workload balance (prefer brokers with fewer clients)
2. Expertise match (if data available)
3. Load distribution for optimal service

Respond with the broker ID, their name, reason for selection, and current client count.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a broker assignment expert. Always respond with structured data." },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_broker",
            description: "Suggest the best broker for a client",
            parameters: {
              type: "object",
              properties: {
                broker_id: { type: "string", description: "The ID of the suggested broker" },
                broker_name: { type: "string", description: "The name of the suggested broker" },
                reason: { type: "string", description: "Brief reason for the suggestion (max 50 words)" },
                current_clients: { type: "number", description: "Current number of clients" }
              },
              required: ["broker_id", "broker_name", "reason", "current_clients"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_broker" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const suggestion = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!suggestion) {
      throw new Error("Failed to get AI suggestion");
    }

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in suggest-broker function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
