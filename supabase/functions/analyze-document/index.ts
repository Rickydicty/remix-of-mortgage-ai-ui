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

const DOCUMENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  certified_id: "Government-issued photo ID such as passport, driver's license, or national ID card. Must show full name, photo, and be clearly readable.",
  proof_of_address: "Utility bill, bank statement, or official letter showing current residential address dated within last 3 months.",
  cover_letter: "A formal cover letter explaining the mortgage application case and client situation.",
  application_form: "Completed mortgage application form or BI Application Form.",
  payslips: "Official payslips from employer showing salary details, deductions, and dates. Must be from recent 3 months.",
  current_account_statements: "Bank statements from a current/checking account showing transactions, account holder name, and bank details.",
  savings_account_statements: "Bank statements from a savings account showing balance, transactions, and account holder information.",
  employment_summary: "Employment Detail Summary (EDS) from Revenue showing employment history and income details.",
  salary_cert: "Salary certificate from employer confirming employment status and salary.",
  marriage_certificate: "Official marriage certificate showing names of both spouses and marriage date.",
  self_employed_docs: "Business accounts, Form 11s, Chapter 4s, or other self-employment documentation.",
  ros_payment_charges: "ROS (Revenue Online Service) payment and charges form.",
  tax_clearance: "Tax clearance certificate from Revenue.",
  gift_letter: "Letter confirming a gift of funds for deposit, signed by the giftor.",
  loan_account_statements: "Statements from loan accounts showing repayment history.",
  mortgage_statements: "Mortgage statements showing current mortgage details and payment history.",
  other: "Any other supporting document relevant to the mortgage application."
};

async function analyzeDocumentWithAI(imageBase64: string, mimeType: string, documentType: string): Promise<AnalysisResponse> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  const expectedDocDescription = DOCUMENT_TYPE_DESCRIPTIONS[documentType] || "Unknown document type";
  
  const systemPrompt = `You are a STRICT document verification expert for mortgage applications. Your job is to verify that uploaded documents match the expected document type EXACTLY.

CRITICAL RULES:
1. You must REJECT documents that do not match the expected document type
2. Random images, selfies, memes, screenshots, or unrelated content should get a score of 0-10
3. Documents that are a different type than expected should get a score of 10-30 (e.g., marriage certificate uploaded as ID)
4. Only documents that ACTUALLY match the expected type should score above 50
5. High scores (70+) require the document to be the CORRECT TYPE, clearly readable, and authentic-looking

EXPECTED DOCUMENT TYPE: "${documentType}"
EXPECTED DOCUMENT DESCRIPTION: "${expectedDocDescription}"

Scoring guide:
- 0-10: Random image, meme, selfie, screenshot, or completely unrelated content
- 10-30: A real document but WRONG TYPE (e.g., uploading a utility bill when ID is expected)
- 30-50: Correct document type but poor quality, expired, or has issues
- 50-70: Correct document type, readable, but minor issues
- 70-90: Correct document type, good quality, no major issues
- 90-100: Perfect document - correct type, high quality, all details visible

Always respond with valid JSON: {"score": number, "analysis": "your analysis explaining why this score was given"}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { 
          role: 'system', 
          content: systemPrompt
        },
        { 
          role: 'user', 
          content: [
            {
              type: 'text',
              text: `Analyze this document. The user claims this is a "${documentType}" document. 
              
VERIFY: Does this document actually match what a "${documentType}" should look like?

Expected: ${expectedDocDescription}

If this is NOT the correct document type, or if this is a random image/meme/selfie, give a LOW score (0-30).
Only give scores above 50 if this IS actually a ${documentType} document.

Respond ONLY with JSON: {"score": number, "analysis": "your analysis"}`
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

    // Analyze with AI - pass document type for strict validation
    const analysis = await analyzeDocumentWithAI(base64Image, file.type, documentType);

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