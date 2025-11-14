import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResponse {
  score: number;
  analysis: string;
  status: 'approved' | 'disapproved' | 'waiting';
}

async function analyzeDocumentWithAI(imageBase64: string, mimeType: string): Promise<AnalysisResponse> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: 'You are a document verification expert. Analyze documents and provide a score from 0-100 based on quality, completeness, and validity. Always respond with valid JSON containing "score" (number) and "analysis" (string) fields.' 
        },
        { 
          role: 'user', 
          content: [
            {
              type: 'text',
              text: 'Analyze this document and provide a score (0-100) and brief analysis. Consider factors like: document authenticity, completeness, readability, validity of information, and any red flags. Respond ONLY with JSON: {"score": number, "analysis": "your analysis"}'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            }
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('AI response:', data);
  
  let content = data.choices[0].message.content;
  
  // Remove markdown code blocks if present
  if (content.includes('```json')) {
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  } else if (content.includes('```')) {
    content = content.replace(/```\s*/g, '');
  }
  
  const parsed = JSON.parse(content.trim());
  
  let status: 'approved' | 'disapproved' | 'waiting';
  if (parsed.score >= 70) {
    status = 'approved';
  } else if (parsed.score < 50) {
    status = 'disapproved';
  } else {
    status = 'waiting';
  }

  return {
    score: parsed.score,
    analysis: parsed.analysis,
    status,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file || !documentType) {
      return new Response(JSON.stringify({ error: 'Missing file or documentType' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing file:', file.name, 'Type:', documentType);

    // Upload to storage
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert to base64 for AI analysis
    const base64Image = btoa(
      new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Analyze with AI
    const analysis = await analyzeDocumentWithAI(base64Image, file.type);

    // Save to database
    const { data: document, error: dbError } = await supabaseClient
      .from('documents')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        document_type: documentType,
        status: analysis.status,
        score: analysis.score,
        analysis_text: analysis.analysis,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to save document' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Document processed successfully:', document.id);

    return new Response(JSON.stringify({ 
      success: true,
      document,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-document:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});