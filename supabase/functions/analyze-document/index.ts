import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createWorker } from "tesseract.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResponse {
  score: number;
  analysis: string;
  status: 'approved' | 'disapproved' | 'waiting';
}

async function analyzeDocumentWithGroq(text: string): Promise<AnalysisResponse> {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  
  const prompt = `You are a document verification expert. Analyze the following document text and provide:
1. A score from 0-100 based on document quality, completeness, and validity
2. A brief analysis explaining the score

Document text:
${text}

Respond in JSON format with "score" (number) and "analysis" (string) fields.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'groq/compound',
      messages: [
        { role: 'system', content: 'You are a document analysis expert. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  console.log('Groq response:', data);
  
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);
  
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

async function performOCR(fileBuffer: ArrayBuffer): Promise<string> {
  console.log('Starting OCR...');
  const worker = await createWorker();
  
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text } } = await worker.recognize(new Uint8Array(fileBuffer));
    console.log('OCR completed, extracted text length:', text.length);
    
    return text;
  } finally {
    await worker.terminate();
  }
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

    // Perform OCR
    const extractedText = await performOCR(fileBuffer);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'No text could be extracted from document' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze with Groq
    const analysis = await analyzeDocumentWithGroq(extractedText);

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