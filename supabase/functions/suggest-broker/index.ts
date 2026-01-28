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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
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

Respond with a JSON object containing: broker_id, broker_name, reason (max 50 words), current_clients (number).
Example: {"broker_id": "abc123", "broker_name": "John Smith", "reason": "Lowest workload with 5 clients", "current_clients": 5}

Only output valid JSON, nothing else.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "You are a broker assignment expert. " + prompt }]
          }],
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from response
    let suggestion = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      console.error("Failed to parse AI response:", content);
    }

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
