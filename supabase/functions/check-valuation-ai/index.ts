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
    const analysisPrompt = `You are an expert Irish property valuation analyst. Analyze the following property valuation submission and provide a detailed assessment.

**Property Details:**
- Address: ${propertyAddress}
- Client's Estimated Value: €${clientEstimate?.toLocaleString() || 'Not provided'}
- Property Type: ${propertyType || 'Not specified'}
- Year Built: ${yearBuilt || 'Not specified'}
- Size: ${size || 'Not specified'} sqm
- Bedrooms: ${bedrooms || 'Not specified'}
- Additional Notes: ${notes || 'None'}

**Comparable Properties from Tailte Éireann Registry:**
${mockComparables.map((c, i) => `${i + 1}. ${c.address} - €${c.ratableValue.toLocaleString()} (${c.valuationDate})`).join('\n')}

**Average Registry Value:** €${Math.round(mockComparables.reduce((sum, c) => sum + c.ratableValue, 0) / mockComparables.length).toLocaleString()}

Please provide:
1. **Valuation Assessment**: Is the client's estimate reasonable compared to registry data?
2. **Variance Analysis**: Calculate and explain the percentage variance from comparable properties
3. **Risk Flags**: Any concerns a lender should be aware of
4. **Recommendation**: Should this proceed as-is, require independent valuation, or needs further review?
5. **Confidence Score**: Rate your confidence in this assessment (1-100)

Be concise but thorough. Format your response clearly.`;

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
            content: "You are an expert Irish property valuation analyst with deep knowledge of the Irish property market, Tailte Éireann registry data, and mortgage lending requirements. Provide professional, actionable assessments." 
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
