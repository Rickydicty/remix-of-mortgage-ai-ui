import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyAddress, clientEstimate, propertyType, yearBuilt, size, bedrooms, notes } = await req.json();
    
    console.log('Checking valuation for:', propertyAddress);
    console.log('Client estimate:', clientEstimate);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // First, simulate searching Tailte Éireann API for comparable properties
    // In production, this would call the actual Tailte API
    const mockComparables = generateMockComparables(propertyAddress, clientEstimate);
    
    console.log('Found comparables:', mockComparables.length);

    // Use AI to analyze the valuation
    const analysisPrompt = `Analyze this Irish property valuation:

**Property:** ${propertyAddress}
**Client Estimate:** €${clientEstimate?.toLocaleString() || 'N/A'}
**Type:** ${propertyType || 'N/A'} | **Year:** ${yearBuilt || 'N/A'} | **Size:** ${size || 'N/A'}sqm | **Beds:** ${bedrooms || 'N/A'}

**Registry Comparables (avg €${Math.round(mockComparables.reduce((s, c) => s + c.ratableValue, 0) / mockComparables.length).toLocaleString()}):**
${mockComparables.map((c, i) => `• ${c.address}: €${c.ratableValue.toLocaleString()}`).join('\n')}

Provide a brief assessment with:
1. ✓ or ⚠ Verdict (aligned/overvalued/undervalued)
2. Risk flags (if any)
3. Recommendation (proceed/independent valuation needed/review required)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a property valuation analyst. Be concise. Use bullet points. Max 150 words." 
          },
          { role: "user", content: analysisPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiAnalysis = data.choices?.[0]?.message?.content || "Unable to generate analysis";

    console.log('AI analysis complete');

    // Calculate summary stats
    const avgRegistryValue = mockComparables.reduce((sum, c) => sum + c.ratableValue, 0) / mockComparables.length;
    const variance = clientEstimate ? ((clientEstimate - avgRegistryValue) / avgRegistryValue) * 100 : 0;

    return new Response(JSON.stringify({
      success: true,
      comparables: mockComparables,
      aiAnalysis,
      summary: {
        clientEstimate: clientEstimate || 0,
        avgRegistryValue: Math.round(avgRegistryValue),
        variance: Math.round(variance * 10) / 10,
        varianceStatus: Math.abs(variance) < 5 ? 'aligned' : variance > 0 ? 'high' : 'low'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-valuation-ai:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMockComparables(address: string, clientEstimate: number): Array<{
  address: string;
  eircode: string;
  valuationDate: string;
  ratableValue: number;
  propertyCategory: string;
  localAuthority: string;
}> {
  // Generate realistic mock comparables based on client estimate
  const baseValue = clientEstimate || 350000;
  const variance = baseValue * 0.15; // 15% variance range
  
  const comparables = [
    {
      address: address,
      eircode: "D01 ABC1",
      valuationDate: "2024-09-15",
      ratableValue: Math.round(baseValue - variance * 0.1 + Math.random() * variance * 0.3),
      propertyCategory: "Residential",
      localAuthority: "Dublin City Council"
    },
    {
      address: address.replace(/\d+/, (m) => String(Number(m) + 2)),
      eircode: "D01 ABC3",
      valuationDate: "2024-07-22",
      ratableValue: Math.round(baseValue + variance * 0.2 + Math.random() * variance * 0.2),
      propertyCategory: "Residential",
      localAuthority: "Dublin City Council"
    },
    {
      address: address.replace(/\d+/, (m) => String(Math.max(1, Number(m) - 4))),
      eircode: "D01 ABB9",
      valuationDate: "2024-05-10",
      ratableValue: Math.round(baseValue - variance * 0.05 + Math.random() * variance * 0.25),
      propertyCategory: "Residential",
      localAuthority: "Dublin City Council"
    },
    {
      address: address.replace(/\d+/, (m) => String(Number(m) + 6)),
      eircode: "D01 ABD2",
      valuationDate: "2024-03-18",
      ratableValue: Math.round(baseValue + variance * 0.1 + Math.random() * variance * 0.2),
      propertyCategory: "Residential",
      localAuthority: "Dublin City Council"
    }
  ];

  return comparables;
}
