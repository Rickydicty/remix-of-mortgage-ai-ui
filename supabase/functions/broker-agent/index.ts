import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentData {
  id: string;
  filename: string;
  document_type: string;
  analysis_text: string | null;
  score: number | null;
  status: string;
  file_path: string;
}

interface ApplicationFormData {
  app1_gross_salary?: number;
  app1_overtime?: number;
  app1_bonuses?: number;
  app1_commissions?: number;
  app2_gross_salary?: number;
  loan_amount?: number;
  property_value?: number;
  monthly_commitments?: number;
  existing_loans?: number;
  credit_cards?: number;
  first_time_buyer?: boolean;
  mortgage_term?: number;
}

// AI Agent Prompt - Comprehensive Irish Mortgage Broker Knowledge Base
const BROKER_AGENT_SYSTEM_PROMPT = `
🔐 AI MORTGAGE BROKER AGENT — IRELAND

🧠 ROLE & SCOPE
You are an AI Mortgage Broker Assistant specialised in Irish residential mortgages.
You analyse client-entered application data across these sections:
- Personal Information
- Employment Information
- Income Information
- Mortgage & Property Details
- Financial Commitments
- Declarations

You do NOT approve loans, quote rates, or provide legal/tax advice.
Your purpose is to:
- Validate completeness and consistency
- Apply Irish lender standards
- Detect risks and inconsistencies
- Flag issues early
- Prepare the application for broker review

🗂️ APPLICATION DATA SECTIONS & STANDARDS

1️⃣ PERSONAL INFORMATION
Fields Expected: Full legal name, Date of birth, Email & phone, Marital status, Dependents, Residency status, Current address, Time at address
Irish Standards:
- Must be 18+
- Residency status must permit borrowing in Ireland
- Address history usually ≥ 6 months
🚩 Flags:
- Name does not match uploaded ID
- Missing DOB
- Short address history without explanation
- Marital status declared but spouse not included
- Dependents not declared but visible in expenses later

2️⃣ EMPLOYMENT INFORMATION
Fields Expected: Employment type (employee/self_employed), Employer/business name, Job title, Start date, Contract type, Probation status
Irish Standards:
- Employees: permanent role preferred
- Self-employed: typically ≥ 2 years trading
- Probation = high scrutiny
🚩 Flags:
- Employment < 6 months
- Probationary role
- Contract/temporary employment
- Self-employed < 2 years
- Employer name differs from payslips/accounts

3️⃣ INCOME INFORMATION
Fields Expected: Base annual income, Net income, Bonus/commission (if any), Other income sources
Irish Standards:
- Base income weighted highest
- Variable income needs history (2–3 years)
- Self-employed income assessed conservatively
🚩 Flags:
- Income entered higher than documents support
- Variable income treated as guaranteed
- Sudden income increase
- Multiple income sources not explained

4️⃣ FINANCIAL COMMITMENTS
Fields Expected: Existing loans, Credit cards, Child maintenance, Other regular commitments
Irish Standards:
- All liabilities must be declared
- Bank statements must reflect commitments
🚩 Flags:
- Commitments missing but visible in bank statements
- Declared "no loans" with repayments detected
- High credit utilisation
- Recent new borrowing

5️⃣ MORTGAGE & PROPERTY DETAILS
Fields Expected: Buyer type (First Time Buyer/Mover/Switcher/Remortgage/Top-Up/Buy-to-Let), Property value/price, Mortgage amount requested, Deposit amount, Deposit source, Property type
Irish Standards:
- Deposit must be verifiable
- Borrowed deposits not allowed
- Buy-to-let assessed differently
🚩 Flags:
- Deposit source unclear
- Gifted deposit without declaration
- Mortgage amount exceeds affordability norms
- Non-standard property type not flagged
- Buy-to-let selected but residential info entered

6️⃣ DECLARATIONS & CONSENTS
Fields Expected: Accuracy confirmation, Consent to data use, Disclosure of adverse credit (if asked)
🚩 Flags:
- Declarations not accepted
- Conflicts between declarations and data
- Missing consents

🔍 CROSS-FIELD INTELLIGENCE (CRITICAL)
You must cross-check across all fields:
Examples:
- Income vs bank statements
- Employment type vs documents uploaded
- Mortgage amount vs income level
- Dependents vs expenses
- Marital status vs mortgage applicants
🚩 High-Risk Inconsistencies:
- Declared PAYE but uploads self-employed docs
- Declared no loans but repayments detected
- First-time buyer but mortgage statements uploaded
- Deposit source not matching savings history

🚩 FLAG SEVERITY
🔴 HIGH: Misrepresentation, Missing core fields, Unexplained income or deposits, Revenue non-compliance indicators
🟡 MEDIUM: Employment changes, Variable income, Minor inconsistencies
🟢 LOW: Formatting issues, Clarifications needed

🗣️ RESPONSE STYLE
Client-Facing: Neutral, Non-alarming, Action-oriented
Example: "We noticed a difference between your declared income and your uploaded documents. Please review and confirm so we can proceed."

Broker-Facing: Precise, Technical, Concise
Example: "Declared income €85k. EDS supports €78k. Variable income not evidenced. Recommend clarification."

❌ STRICT RULES
You must NEVER:
- Approve or decline a mortgage
- Promise outcomes
- Recommend lenders or products
- Estimate specific interest rates as guarantees
- Provide tax or legal advice

Always include: "All mortgage applications are subject to lender assessment and approval."

✅ OUTPUT STRUCTURE (MANDATORY)
When analysing application fields, respond as:
1. Summary
2. Key Extracted Data
3. Detected Flags (with severity)
4. Required Actions
5. Broker Notes (internal)

IRISH MORTGAGE CONTEXT:
- LTV limits: FTB can get up to 90% LTV, non-FTB up to 80%
- Stress test: Applications tested at +2% above current rates
- Income multiples: Typically 3.5x gross annual income (Central Bank limit, 10% of lending can exceed)
- Central Bank rules apply to all applications
- Required docs: Employment summary, payslips (3 months), bank statements (6 months), ID, proof of address

🧠 FINAL NOTE
You are preparing the application — not deciding the outcome.
Your success is measured by: Fewer broker back-and-forths, Cleaner submissions, Early risk visibility.
`;

async function callAI(prompt: string, systemPrompt: string = BROKER_AGENT_SYSTEM_PROMPT): Promise<string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  
  if (!lovableApiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function analyzeDocument(doc: DocumentData, formData: ApplicationFormData): Promise<{
  extractedData: Record<string, unknown>;
  riskLevel: string;
  riskFlags: string[];
  brokerCommentary: string;
  clientExplanation: string;
  qualityIssues: string[];
  completenessScore: number;
}> {
  const prompt = `Analyze this mortgage document and provide a detailed assessment.

DOCUMENT INFO:
- Type: ${doc.document_type}
- Filename: ${doc.filename}
- Current AI Score: ${doc.score || 'Not scored'}
- Current Analysis: ${doc.analysis_text || 'No analysis'}

APPLICATION CONTEXT:
- Gross Salary (Applicant 1): €${formData.app1_gross_salary || 0}
- Additional Income: €${(formData.app1_overtime || 0) + (formData.app1_bonuses || 0) + (formData.app1_commissions || 0)}
- Second Applicant Salary: €${formData.app2_gross_salary || 0}
- Requested Loan: €${formData.loan_amount || 0}
- Property Value: €${formData.property_value || 0}
- Monthly Commitments: €${formData.monthly_commitments || 0}
- First Time Buyer: ${formData.first_time_buyer ? 'Yes' : 'No'}

Respond with a JSON object:
{
  "extractedData": {
    // Key data points from document type (income, employer, dates, etc.)
  },
  "riskLevel": "low" | "medium" | "high",
  "riskFlags": ["array of specific concerns"],
  "brokerCommentary": "Internal insight for broker with mitigation suggestions",
  "clientExplanation": "Simple, jargon-free explanation for client if action needed",
  "qualityIssues": ["any document quality problems"],
  "completenessScore": 0-100
}`;

  try {
    const response = await callAI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error("Document analysis error:", error);
    return {
      extractedData: {},
      riskLevel: "medium",
      riskFlags: ["Unable to fully analyze document"],
      brokerCommentary: "Automated analysis incomplete - manual review recommended",
      clientExplanation: "Your document is being reviewed by our team",
      qualityIssues: [],
      completenessScore: 50,
    };
  }
}

async function analyzeFullApplication(
  documents: DocumentData[],
  formData: ApplicationFormData,
  existingAnalysis: Array<{ risk_level: string; risk_flags: unknown[] }>
): Promise<{
  overallRiskLevel: string;
  aggregatedFlags: string[];
  estimatedApprovalAmount: number | null;
  estimatedMonthlyPayment: number | null;
  estimatedInterestRange: { min: number; max: number } | null;
  recommendedPrograms: string[];
  submissionReady: boolean;
  openItems: string[];
  readinessScore: number;
  brokerSummary: string;
  clientSummary: string;
  requiresHumanReview: boolean;
  handoffReason: string | null;
  eligibilityMetrics: {
    ltvRatio: number;
    dtiRatio: number;
    incomeMultiple: number;
    maxBorrowingCapacity: number;
    stressTestedPayment: number;
    affordabilityStatus: string;
  };
}> {
  // Calculate key metrics using Irish mortgage rules
  const totalIncome = (formData.app1_gross_salary || 0) + 
    (formData.app1_overtime || 0) * 0.5 + // Overtime typically counted at 50%
    (formData.app1_bonuses || 0) * 0.5 + // Bonuses typically counted at 50%
    (formData.app1_commissions || 0) * 0.5 +
    (formData.app2_gross_salary || 0);
  
  const loanAmount = formData.loan_amount || 0;
  const propertyValue = formData.property_value || 0;
  const mortgageTerm = formData.mortgage_term || 25;
  const monthlyCommitments = (formData.monthly_commitments || 0) + 
    (formData.existing_loans || 0) + 
    (formData.credit_cards || 0);
  
  // Irish Central Bank Rules Calculations
  const ltv = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
  const maxLtv = formData.first_time_buyer ? 90 : 80;
  
  const monthlyIncome = totalIncome / 12;
  const dti = monthlyIncome > 0 ? (monthlyCommitments / monthlyIncome) * 100 : 0;
  
  // Income multiple (Central Bank limit is 3.5x for most borrowers)
  const incomeMultiple = totalIncome > 0 ? loanAmount / totalIncome : 0;
  const maxIncomeMultiple = 3.5;
  const maxBorrowingCapacity = totalIncome * maxIncomeMultiple;
  
  // Estimate interest rate based on LTV and profile
  const baseRate = 3.5; // Current typical Irish mortgage rate
  const ltvPremium = ltv > 80 ? 0.25 : ltv > 60 ? 0 : -0.1;
  const ftbDiscount = formData.first_time_buyer ? -0.1 : 0;
  const estimatedRate = baseRate + ltvPremium + ftbDiscount;
  const stressTestRate = estimatedRate + 2; // Central Bank stress test
  
  // Monthly payment calculations
  const monthlyRate = estimatedRate / 100 / 12;
  const numPayments = mortgageTerm * 12;
  const monthlyPayment = loanAmount > 0 
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : 0;
  
  // Stress tested payment
  const stressMonthlyRate = stressTestRate / 100 / 12;
  const stressTestedPayment = loanAmount > 0 
    ? (loanAmount * stressMonthlyRate * Math.pow(1 + stressMonthlyRate, numPayments)) / (Math.pow(1 + stressMonthlyRate, numPayments) - 1)
    : 0;
  
  // Net Disposable Income (NDI) check
  const totalMonthlyOutgoings = monthlyCommitments + stressTestedPayment;
  const ndi = monthlyIncome - totalMonthlyOutgoings;
  const ndiRatio = monthlyIncome > 0 ? (ndi / monthlyIncome) * 100 : 0;
  
  // Determine affordability status
  let affordabilityStatus = "Affordable";
  if (ndiRatio < 15) affordabilityStatus = "Tight - May not pass stress test";
  if (ndiRatio < 10) affordabilityStatus = "Unaffordable - Fails stress test";
  if (incomeMultiple > maxIncomeMultiple) affordabilityStatus = "Exceeds income multiple limit";
  if (ltv > maxLtv) affordabilityStatus = "Exceeds LTV limit";
  
  const eligibilityMetrics = {
    ltvRatio: Math.round(ltv * 10) / 10,
    dtiRatio: Math.round(dti * 10) / 10,
    incomeMultiple: Math.round(incomeMultiple * 100) / 100,
    maxBorrowingCapacity: Math.round(maxBorrowingCapacity),
    stressTestedPayment: Math.round(stressTestedPayment),
    affordabilityStatus,
  };

  const prompt = `Perform a comprehensive mortgage eligibility and pre-approval estimation for an Irish mortgage application.

APPLICATION METRICS (PRE-CALCULATED):
- Total Annual Income: €${totalIncome.toLocaleString()}
- Requested Loan Amount: €${loanAmount.toLocaleString()}
- Property Value: €${propertyValue.toLocaleString()}
- LTV Ratio: ${ltv.toFixed(1)}% (Max allowed: ${maxLtv}%)
- Monthly Income: €${monthlyIncome.toFixed(0)}
- Monthly Commitments: €${monthlyCommitments}
- DTI Ratio: ${dti.toFixed(1)}%
- Income Multiple: ${incomeMultiple.toFixed(2)}x (Max: 3.5x)
- Max Borrowing Capacity: €${maxBorrowingCapacity.toLocaleString()}
- First Time Buyer: ${formData.first_time_buyer ? 'Yes' : 'No'}
- Mortgage Term: ${mortgageTerm} years

ESTIMATED PAYMENTS:
- Estimated Rate: ${estimatedRate.toFixed(2)}%
- Monthly Payment: €${monthlyPayment.toFixed(0)}
- Stress Test Rate (+2%): ${stressTestRate.toFixed(2)}%
- Stress Tested Payment: €${stressTestedPayment.toFixed(0)}
- Net Disposable Income Ratio: ${ndiRatio.toFixed(1)}%
- Affordability Status: ${affordabilityStatus}

DOCUMENTS SUBMITTED (${documents.length} total):
${documents.map(d => `- ${d.document_type}: ${d.status} (Score: ${d.score || 'N/A'})`).join('\n')}

EXISTING RISK FLAGS FROM DOCUMENT ANALYSIS:
${existingAnalysis.map(a => `- ${a.risk_level}: ${JSON.stringify(a.risk_flags)}`).join('\n')}

IRISH MORTGAGE RULES TO APPLY:
- Central Bank LTV limits: FTB 90%, Others 80%
- Income multiple cap: 3.5x (10% of bank's lending can exceed)
- Stress test at current rate + 2%
- Required docs: Employment summary, payslips (3 months), bank statements (6 months), ID, proof of address
- Minimum NDI of 15% recommended

MORTGAGE PROGRAM MATCHING:
Based on the profile, recommend suitable programs:
- Standard Variable Rate
- Fixed Rate (1-10 years)
- Green Mortgage (for BER A/B rated properties)
- First Time Buyer Schemes (if FTB)
- Local Authority Home Loan (if income under €65k single / €75k joint)
- Help to Buy (for new builds, FTB)

Respond with JSON:
{
  "overallRiskLevel": "low" | "medium" | "high",
  "aggregatedFlags": ["all significant concerns including affordability issues"],
  "estimatedApprovalAmount": ${Math.min(loanAmount, maxBorrowingCapacity) || 'null'},
  "estimatedMonthlyPayment": ${Math.round(monthlyPayment) || 'null'},
  "estimatedInterestRange": {"min": ${(estimatedRate - 0.5).toFixed(2)}, "max": ${(estimatedRate + 0.5).toFixed(2)}},
  "recommendedPrograms": ["list 2-4 suitable mortgage types based on profile"],
  "submissionReady": boolean,
  "openItems": ["what's still needed for approval"],
  "readinessScore": 0-100,
  "brokerSummary": "detailed internal summary including eligibility assessment, income vs loan analysis, stress test results",
  "clientSummary": "friendly summary explaining their borrowing power and next steps",
  "requiresHumanReview": boolean,
  "handoffReason": "reason if human review needed" or null
}`;

  try {
    const response = await callAI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { ...parsed, eligibilityMetrics };
    }
    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error("Application analysis error:", error);
    return {
      overallRiskLevel: "pending",
      aggregatedFlags: ["Analysis incomplete"],
      estimatedApprovalAmount: Math.round(Math.min(loanAmount, maxBorrowingCapacity)) || null,
      estimatedMonthlyPayment: Math.round(monthlyPayment) || null,
      estimatedInterestRange: { min: estimatedRate - 0.5, max: estimatedRate + 0.5 },
      recommendedPrograms: [],
      submissionReady: false,
      openItems: ["Manual review required"],
      readinessScore: 0,
      brokerSummary: "Automated analysis could not complete. Please review manually.",
      clientSummary: "Your application is being reviewed by our team.",
      requiresHumanReview: true,
      handoffReason: "Automated analysis failed",
      eligibilityMetrics,
    };
  }
}

async function handleClientChat(
  message: string,
  applicationId: string,
  conversationHistory: Array<{ role: string; message: string }>,
  applicationContext: { formData: ApplicationFormData; documents: DocumentData[]; analysis: unknown }
): Promise<string> {
  const historyText = conversationHistory
    .slice(-10) // Last 10 messages for context
    .map(m => `${m.role.toUpperCase()}: ${m.message}`)
    .join('\n');

  const prompt = `You are chatting with a mortgage applicant. Be helpful, professional, and reassuring.

CONVERSATION HISTORY:
${historyText}

CLIENT'S NEW MESSAGE:
${message}

APPLICATION CONTEXT:
- Documents submitted: ${applicationContext.documents.length}
- Loan amount requested: €${applicationContext.formData.loan_amount || 'Not specified'}
- Property value: €${applicationContext.formData.property_value || 'Not specified'}

RESPONSE RULES:
1. Keep responses concise (2-3 sentences usually)
2. Use simple language, no jargon
3. If they ask about status, be positive but honest
4. If they ask for specific rates or approval, say "I'll have our broker confirm the exact details"
5. Guide them on next steps if documents are missing
6. Never promise approval or specific rates

Respond directly to the client (no JSON, just your message):`;

  const clientPrompt = `You are a friendly, professional AI mortgage assistant helping Irish homebuyers. 
Keep responses warm but professional. Use "we" language to feel like part of the brokerage team.
If uncertain, recommend speaking with the broker rather than guessing.`;

  try {
    return await callAI(prompt, clientPrompt);
  } catch (error) {
    console.error("Chat error:", error);
    return "I apologize, but I'm having trouble processing your request. Let me connect you with our broker who can help you directly.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, applicationId, clientId, message, documentId } = await req.json();

    console.log(`Broker Agent Action: ${action}, Application: ${applicationId}`);

    switch (action) {
      case "analyze_document": {
        // Analyze a single document
        if (!documentId || !applicationId) {
          return new Response(JSON.stringify({ error: "Missing documentId or applicationId" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get document
        const { data: doc, error: docError } = await supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();

        if (docError || !doc) {
          return new Response(JSON.stringify({ error: "Document not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get application form data
        const { data: formData } = await supabase
          .from("application_form_data")
          .select("*")
          .eq("application_id", applicationId)
          .single();

        const analysis = await analyzeDocument(doc, formData || {});

        // Save analysis
        const { error: insertError } = await supabase
          .from("agent_document_analysis")
          .upsert({
            document_id: documentId,
            application_id: applicationId,
            client_id: doc.user_id,
            extracted_data: analysis.extractedData,
            risk_level: analysis.riskLevel,
            risk_flags: analysis.riskFlags,
            broker_commentary: analysis.brokerCommentary,
            client_explanation: analysis.clientExplanation,
            quality_issues: analysis.qualityIssues,
            completeness_score: analysis.completenessScore,
          }, { onConflict: "document_id" });

        if (insertError) {
          console.error("Error saving document analysis:", insertError);
        }

        // Log action
        await supabase.from("agent_action_logs").insert({
          application_id: applicationId,
          action_type: "document_analysis",
          action_description: `Analyzed ${doc.document_type} document`,
          trigger_type: "document_upload",
          result: { documentId, riskLevel: analysis.riskLevel },
          success: true,
        });

        return new Response(JSON.stringify({ success: true, analysis }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "analyze_application": {
        // Full application analysis
        if (!applicationId) {
          return new Response(JSON.stringify({ error: "Missing applicationId" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get application
        const { data: app, error: appError } = await supabase
          .from("applications")
          .select("*")
          .eq("id", applicationId)
          .single();

        if (appError || !app) {
          return new Response(JSON.stringify({ error: "Application not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get documents
        const { data: documents } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", app.user_id);

        // Get form data
        const { data: formData } = await supabase
          .from("application_form_data")
          .select("*")
          .eq("application_id", applicationId)
          .single();

        // Get existing document analyses
        const { data: docAnalyses } = await supabase
          .from("agent_document_analysis")
          .select("risk_level, risk_flags")
          .eq("application_id", applicationId);

        const analysis = await analyzeFullApplication(
          documents || [],
          formData || {},
          docAnalyses || []
        );

        // Save/update application analysis
        const { error: upsertError } = await supabase
          .from("agent_application_analysis")
          .upsert({
            application_id: applicationId,
            client_id: app.user_id,
            overall_risk_level: analysis.overallRiskLevel,
            aggregated_flags: analysis.aggregatedFlags,
            estimated_approval_amount: analysis.estimatedApprovalAmount,
            estimated_monthly_payment: analysis.estimatedMonthlyPayment,
            estimated_interest_range: analysis.estimatedInterestRange,
            recommended_programs: analysis.recommendedPrograms,
            submission_ready: analysis.submissionReady,
            open_items: analysis.openItems,
            readiness_score: analysis.readinessScore,
            broker_summary: analysis.brokerSummary,
            client_summary: analysis.clientSummary,
            requires_human_review: analysis.requiresHumanReview,
            handoff_reason: analysis.handoffReason,
            last_analysis_at: new Date().toISOString(),
          }, { onConflict: "application_id" });

        if (upsertError) {
          console.error("Error saving application analysis:", upsertError);
        }

        // Log action
        await supabase.from("agent_action_logs").insert({
          application_id: applicationId,
          action_type: "application_analysis",
          action_description: "Full application risk assessment completed",
          trigger_type: "manual",
          result: { 
            riskLevel: analysis.overallRiskLevel, 
            readinessScore: analysis.readinessScore,
            submissionReady: analysis.submissionReady
          },
          success: true,
        });

        return new Response(JSON.stringify({ success: true, analysis }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "chat": {
        // Client conversation
        if (!applicationId || !clientId || !message) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Save client message
        await supabase.from("agent_conversations").insert({
          application_id: applicationId,
          client_id: clientId,
          role: "client",
          message: message,
          message_type: "chat",
        });

        // Get conversation history
        const { data: history } = await supabase
          .from("agent_conversations")
          .select("role, message")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: true });

        // Get context
        const { data: formData } = await supabase
          .from("application_form_data")
          .select("*")
          .eq("application_id", applicationId)
          .single();

        const { data: documents } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", clientId);

        const { data: analysis } = await supabase
          .from("agent_application_analysis")
          .select("*")
          .eq("application_id", applicationId)
          .single();

        const agentResponse = await handleClientChat(
          message,
          applicationId,
          history || [],
          { formData: formData || {}, documents: documents || [], analysis }
        );

        // Save agent response
        await supabase.from("agent_conversations").insert({
          application_id: applicationId,
          client_id: clientId,
          role: "agent",
          message: agentResponse,
          message_type: "chat",
        });

        return new Response(JSON.stringify({ success: true, response: agentResponse }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_insights": {
        // Get all insights for broker dashboard
        if (!applicationId) {
          return new Response(JSON.stringify({ error: "Missing applicationId" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: appAnalysis } = await supabase
          .from("agent_application_analysis")
          .select("*")
          .eq("application_id", applicationId)
          .maybeSingle();

        const { data: docAnalyses } = await supabase
          .from("agent_document_analysis")
          .select("*")
          .eq("application_id", applicationId);

        // Fetch documents for this application so the broker can always see
        // each uploaded document even if no analysis row exists yet.
        const { data: app } = await supabase
          .from("applications")
          .select("user_id")
          .eq("id", applicationId)
          .single();

        const { data: documents } = await supabase
          .from("documents")
          .select("id, filename, document_type, analysis_text, score, status, created_at")
          .eq("user_id", app?.user_id)
          .order("created_at", { ascending: false });

        const { data: conversations } = await supabase
          .from("agent_conversations")
          .select("*")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false })
          .limit(20);

        const { data: actionLogs } = await supabase
          .from("agent_action_logs")
          .select("*")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false })
          .limit(10);

        return new Response(
          JSON.stringify({
            success: true,
            applicationAnalysis: appAnalysis,
            documentAnalyses: docAnalyses || [],
            documents: documents || [],
            conversations: conversations || [],
            actionLogs: actionLogs || [],
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("Broker agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
