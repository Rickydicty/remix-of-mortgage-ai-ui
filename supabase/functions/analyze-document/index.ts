import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedData {
  // Income documents
  income?: number;
  employer?: string;
  employmentType?: string;
  payPeriod?: string;
  netPay?: number;
  grossPay?: number;
  taxDeducted?: number;
  startDate?: string;
  
  // Bank statements
  avgBalance?: number;
  endingBalance?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  accountType?: string;
  bankName?: string;
  
  // ID documents
  fullName?: string;
  dateOfBirth?: string;
  idNumber?: string;
  idType?: string;
  expiryDate?: string;
  nationality?: string;
  
  // Address proof
  address?: string;
  documentDate?: string;
  utilityProvider?: string;
  
  // Tax documents
  taxYear?: string;
  totalIncome?: number;
  taxPaid?: number;
  ppsNumber?: string;
  
  // Liabilities
  loanBalance?: number;
  monthlyPayment?: number;
  lender?: string;
  interestRate?: number;
  
  // General
  missingPages?: boolean;
  dateRange?: { from: string; to: string };
  inconsistencies?: string[];
}

interface AnalysisResponse {
  score: number;
  analysis: string;
  status: 'approved' | 'disapproved' | 'waiting';
  extractedData: ExtractedData;
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

// Define extraction schema based on document type
function getExtractionTool(documentType: string) {
  const baseProperties: Record<string, any> = {
    missingPages: { type: "boolean", description: "Whether pages appear to be missing from the document" },
    inconsistencies: { type: "array", items: { type: "string" }, description: "Any inconsistencies or red flags found" }
  };

  const typeSpecificProperties: Record<string, any> = {
    payslips: {
      income: { type: "number", description: "Annual gross salary/income in EUR" },
      grossPay: { type: "number", description: "Gross pay for the period shown" },
      netPay: { type: "number", description: "Net pay after deductions" },
      taxDeducted: { type: "number", description: "Tax deducted for the period" },
      employer: { type: "string", description: "Employer name" },
      employmentType: { type: "string", enum: ["permanent", "contract", "part-time", "temporary"] },
      payPeriod: { type: "string", description: "Pay period (e.g., 'monthly', 'weekly', 'fortnightly')" },
      startDate: { type: "string", description: "Employment start date if visible (YYYY-MM-DD)" },
      ppsNumber: { type: "string", description: "PPS number if visible" }
    },
    current_account_statements: {
      avgBalance: { type: "number", description: "Average account balance over the statement period" },
      endingBalance: { type: "number", description: "Closing balance at end of statement" },
      totalDeposits: { type: "number", description: "Total deposits/credits during period" },
      totalWithdrawals: { type: "number", description: "Total withdrawals/debits during period" },
      bankName: { type: "string", description: "Name of the bank" },
      accountType: { type: "string", description: "Type of account" },
      dateRange: { 
        type: "object", 
        properties: { 
          from: { type: "string", description: "Start date (YYYY-MM-DD)" }, 
          to: { type: "string", description: "End date (YYYY-MM-DD)" } 
        } 
      }
    },
    savings_account_statements: {
      avgBalance: { type: "number", description: "Average savings balance" },
      endingBalance: { type: "number", description: "Current savings balance" },
      bankName: { type: "string", description: "Name of the bank" },
      interestRate: { type: "number", description: "Interest rate if shown" },
      dateRange: { 
        type: "object", 
        properties: { 
          from: { type: "string" }, 
          to: { type: "string" } 
        } 
      }
    },
    certified_id: {
      fullName: { type: "string", description: "Full name as shown on ID" },
      dateOfBirth: { type: "string", description: "Date of birth (YYYY-MM-DD)" },
      idNumber: { type: "string", description: "ID/passport number" },
      idType: { type: "string", enum: ["passport", "drivers_license", "national_id", "other"] },
      expiryDate: { type: "string", description: "Expiry date if applicable (YYYY-MM-DD)" },
      nationality: { type: "string", description: "Nationality/citizenship" }
    },
    proof_of_address: {
      fullName: { type: "string", description: "Name on the document" },
      address: { type: "string", description: "Full address shown" },
      documentDate: { type: "string", description: "Date of the document (YYYY-MM-DD)" },
      utilityProvider: { type: "string", description: "Utility/service provider name" }
    },
    employment_summary: {
      income: { type: "number", description: "Total annual income" },
      employer: { type: "string", description: "Employer name" },
      taxYear: { type: "string", description: "Tax year covered" },
      taxPaid: { type: "number", description: "Total tax paid" },
      ppsNumber: { type: "string", description: "PPS number" }
    },
    salary_cert: {
      income: { type: "number", description: "Annual salary confirmed" },
      employer: { type: "string", description: "Employer name" },
      employmentType: { type: "string", enum: ["permanent", "contract", "part-time", "temporary"] },
      startDate: { type: "string", description: "Employment start date" }
    },
    loan_account_statements: {
      loanBalance: { type: "number", description: "Outstanding loan balance" },
      monthlyPayment: { type: "number", description: "Monthly repayment amount" },
      lender: { type: "string", description: "Lender name" },
      interestRate: { type: "number", description: "Interest rate" },
      dateRange: { 
        type: "object", 
        properties: { 
          from: { type: "string" }, 
          to: { type: "string" } 
        } 
      }
    },
    mortgage_statements: {
      loanBalance: { type: "number", description: "Outstanding mortgage balance" },
      monthlyPayment: { type: "number", description: "Monthly mortgage payment" },
      lender: { type: "string", description: "Lender/bank name" },
      interestRate: { type: "number", description: "Current interest rate" },
      address: { type: "string", description: "Property address" }
    },
    tax_clearance: {
      taxYear: { type: "string", description: "Tax year" },
      ppsNumber: { type: "string", description: "PPS number" },
      totalIncome: { type: "number", description: "Total income declared" },
      taxPaid: { type: "number", description: "Total tax paid" }
    },
    self_employed_docs: {
      income: { type: "number", description: "Net profit/income" },
      taxYear: { type: "string", description: "Tax/accounting year" },
      totalIncome: { type: "number", description: "Gross revenue/turnover" }
    }
  };

  const properties = {
    ...baseProperties,
    ...(typeSpecificProperties[documentType] || {})
  };

  return {
    type: "function",
    function: {
      name: "extract_document_data",
      description: `Extract structured data from a ${documentType} document for mortgage application processing`,
      parameters: {
        type: "object",
        properties: {
          score: { type: "number", description: "Document quality score 0-100" },
          analysis: { type: "string", description: "Brief analysis of the document" },
          extractedData: {
            type: "object",
            properties,
            description: "Structured data extracted from the document"
          }
        },
        required: ["score", "analysis", "extractedData"]
      }
    }
  };
}

async function analyzeDocumentWithAI(imageBase64: string, mimeType: string, documentType: string): Promise<AnalysisResponse> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  const expectedDocDescription = DOCUMENT_TYPE_DESCRIPTIONS[documentType] || "Unknown document type";
  
  const systemPrompt = `You are an expert document OCR and data extraction system for mortgage applications. Your job is to:

1. VERIFY the document matches the expected type
2. EXTRACT all relevant structured data from the document
3. FLAG any inconsistencies, missing pages, or red flags

EXPECTED DOCUMENT TYPE: "${documentType}"
EXPECTED DOCUMENT DESCRIPTION: "${expectedDocDescription}"

EXTRACTION RULES:
- Extract ALL visible data fields relevant to mortgage applications
- For financial figures, use EUR and convert if necessary
- For dates, use YYYY-MM-DD format
- If a field is not visible or unclear, omit it (don't guess)
- Flag any inconsistencies (e.g., dates don't match, amounts seem wrong)

SCORING GUIDE:
- 0-10: Random image, meme, selfie, or completely unrelated content
- 10-30: A real document but WRONG TYPE
- 30-50: Correct document type but poor quality or has issues
- 50-70: Correct document type, readable, minor issues
- 70-90: Correct document type, good quality
- 90-100: Perfect document - correct type, high quality, all details visible

Use the extract_document_data function to return your analysis.`;

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
              text: `Analyze this "${documentType}" document. Extract all structured data and verify authenticity.

Expected: ${expectedDocDescription}

Use the extract_document_data function to return:
1. A quality score (0-100)
2. Brief analysis
3. All extracted data fields relevant to this document type`
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
      tools: [getExtractionTool(documentType)],
      tool_choice: { type: "function", function: { name: "extract_document_data" } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('AI response:', JSON.stringify(data, null, 2));
  
  // Parse tool call response
  const toolCall = data.choices[0]?.message?.tool_calls?.[0];
  
  if (toolCall && toolCall.function?.arguments) {
    const parsed = JSON.parse(toolCall.function.arguments);
    
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
      extractedData: parsed.extractedData || {}
    };
  }
  
  // Fallback: try parsing message content
  let content = data.choices[0]?.message?.content || '{}';
  
  if (content.includes('```json')) {
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  } else if (content.includes('```')) {
    content = content.replace(/```\s*/g, '');
  }
  
  try {
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
      score: parsed.score || 50,
      analysis: parsed.analysis || 'Document analyzed',
      status,
      extractedData: parsed.extractedData || {}
    };
  } catch {
    return {
      score: 50,
      analysis: 'Unable to fully analyze document - manual review recommended',
      status: 'waiting',
      extractedData: {}
    };
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

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    // Analyze with AI - extract structured data
    const analysis = await analyzeDocumentWithAI(base64Image, file.type, documentType);

    console.log('Extracted data:', JSON.stringify(analysis.extractedData, null, 2));

    // Save document to database
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

    // Get application for this user
    const { data: application } = await supabaseClient
      .from('applications')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Save extracted data to agent_document_analysis (using service role)
    if (application?.id) {
      const { error: analysisError } = await serviceClient
        .from('agent_document_analysis')
        .upsert({
          document_id: document.id,
          application_id: application.id,
          client_id: user.id,
          extracted_data: analysis.extractedData,
          risk_level: analysis.score >= 70 ? 'low' : analysis.score >= 50 ? 'medium' : 'high',
          risk_flags: analysis.extractedData.inconsistencies || [],
          quality_issues: analysis.score < 70 ? ['Document quality below threshold'] : [],
          completeness_score: analysis.score,
          broker_commentary: `Auto-extracted: ${Object.keys(analysis.extractedData).filter(k => k !== 'inconsistencies' && k !== 'missingPages').join(', ')}`,
          client_explanation: analysis.analysis
        }, { onConflict: 'document_id' });

      if (analysisError) {
        console.error('Error saving document analysis:', analysisError);
      } else {
        console.log('Saved extracted data to agent_document_analysis');
      }
    }

    console.log('Document processed successfully:', document.id);

    return new Response(JSON.stringify({ 
      success: true,
      document,
      extractedData: analysis.extractedData
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
