import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, documents } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('AI Search query:', query);
    console.log('Documents count:', documents?.length || 0);

    const searchPrompt = `You are a document search assistant for a mortgage broker's library. Parse the user's natural language query and return matching document criteria.

User query: "${query}"

Available document types: proof_of_id, proof_of_address, proof_of_income, bank_statements, employment_contract, aip_letter, valuation_report, loan_offer, mortgage_application

Respond with JSON only:
{
  "searchTerms": ["keywords to match in filename"],
  "documentTypes": ["matching document_type values or empty array"],
  "lenders": ["lender names mentioned: Haven, BOI, AIB, PTSB, ICS, etc."],
  "intent": "search" | "upload",
  "suggestion": "brief helpful message about what was found or action needed"
}

Return only valid JSON, no markdown or explanations.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: searchPrompt }]
          }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Parse AI response
    let parsedCriteria;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsedCriteria = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      console.error('Failed to parse AI response:', content);
      parsedCriteria = { searchTerms: [query], documentTypes: [], lenders: [], intent: 'search', suggestion: '' };
    }

    console.log('Parsed criteria:', parsedCriteria);

    // Filter documents based on AI criteria
    let filteredDocs = [...(documents || [])];
    
    // Filter by search terms in filename
    if (parsedCriteria.searchTerms?.length > 0) {
      filteredDocs = filteredDocs.filter(doc => 
        parsedCriteria.searchTerms.some((term: string) => 
          doc.filename.toLowerCase().includes(term.toLowerCase())
        )
      );
    }

    // Filter by document types
    if (parsedCriteria.documentTypes?.length > 0) {
      const typeFiltered = documents.filter((doc: any) => 
        parsedCriteria.documentTypes.some((type: string) => 
          doc.document_type.toLowerCase().includes(type.toLowerCase())
        )
      );
      if (typeFiltered.length > 0) {
        filteredDocs = [...new Set([...filteredDocs, ...typeFiltered])];
      }
    }

    // Filter by lender names in filename
    if (parsedCriteria.lenders?.length > 0) {
      const lenderFiltered = documents.filter((doc: any) => 
        parsedCriteria.lenders.some((lender: string) => 
          doc.filename.toLowerCase().includes(lender.toLowerCase())
        )
      );
      if (lenderFiltered.length > 0) {
        filteredDocs = [...new Set([...filteredDocs, ...lenderFiltered])];
      }
    }

    // Remove duplicates by id
    const uniqueDocs = Array.from(new Map(filteredDocs.map((d: any) => [d.id, d])).values());

    return new Response(
      JSON.stringify({
        results: uniqueDocs,
        criteria: parsedCriteria,
        intent: parsedCriteria.intent || 'search',
        suggestion: parsedCriteria.suggestion || `Found ${uniqueDocs.length} matching documents`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
