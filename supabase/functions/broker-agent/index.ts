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

// AI Agent Prompt - Core broker intelligence
const BROKER_AGENT_SYSTEM_PROMPT = `You are an AI Mortgage Broker Agent for Irish mortgage applications. You act as a digital mortgage officer that:
- Reviews documents meticulously
- Flags risks objectively
- Guides next steps clearly
- Assists broker decisions with data-driven insights

CRITICAL RULES:
1. Never promise loan approval - only assess likelihood
2. Always explain flags neutrally without alarming language
3. Ask for documents step-by-step when needed
4. Escalate uncertainty to human broker immediately
5. Use Irish mortgage terminology (BER, LTV, P60, etc.)

RISK ASSESSMENT FRAMEWORK:
- 🟢 LOW RISK: Standard application, all docs present, DTI < 35%, stable employment
- 🟡 MEDIUM RISK: Minor gaps, DTI 35-45%, some flags but explainable
- 🔴 HIGH RISK: Major issues, DTI > 45%, unexplained deposits, employment gaps

IRISH MORTGAGE CONTEXT:
- LTV limits: FTB can get up to 90% LTV, non-FTB up to 80%
- Stress test: Applications tested at +2% above current rates
- Income multiples: Typically 3.5x gross annual income
- Central Bank rules apply to all applications`;

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
}> {
  // Calculate key metrics
  const totalIncome = (formData.app1_gross_salary || 0) + 
    (formData.app1_overtime || 0) + 
    (formData.app1_bonuses || 0) + 
    (formData.app2_gross_salary || 0);
  
  const loanAmount = formData.loan_amount || 0;
  const propertyValue = formData.property_value || 0;
  const ltv = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
  const monthlyCommitments = formData.monthly_commitments || 0;
  const monthlyIncome = totalIncome / 12;
  const dti = monthlyIncome > 0 ? (monthlyCommitments / monthlyIncome) * 100 : 0;
  const incomeMultiple = totalIncome > 0 ? loanAmount / totalIncome : 0;

  const prompt = `Perform a comprehensive mortgage application analysis.

APPLICATION METRICS:
- Total Annual Income: €${totalIncome}
- Requested Loan Amount: €${loanAmount}
- Property Value: €${propertyValue}
- LTV Ratio: ${ltv.toFixed(1)}%
- Monthly Income: €${monthlyIncome.toFixed(0)}
- Monthly Commitments: €${monthlyCommitments}
- DTI Ratio: ${dti.toFixed(1)}%
- Income Multiple: ${incomeMultiple.toFixed(2)}x
- First Time Buyer: ${formData.first_time_buyer ? 'Yes' : 'No'}
- Mortgage Term: ${formData.mortgage_term || 25} years

DOCUMENTS SUBMITTED (${documents.length} total):
${documents.map(d => `- ${d.document_type}: ${d.status} (Score: ${d.score || 'N/A'})`).join('\n')}

EXISTING RISK FLAGS FROM DOCUMENT ANALYSIS:
${existingAnalysis.map(a => `- ${a.risk_level}: ${JSON.stringify(a.risk_flags)}`).join('\n')}

IRISH MORTGAGE RULES TO APPLY:
- Central Bank LTV limits: FTB 90%, Others 80%
- Income multiple cap: 3.5x (exceptions possible)
- Stress test at current rate + 2%
- Required docs: P60, payslips, bank statements, ID, proof of address

Respond with JSON:
{
  "overallRiskLevel": "low" | "medium" | "high",
  "aggregatedFlags": ["all significant concerns"],
  "estimatedApprovalAmount": number or null,
  "estimatedMonthlyPayment": number or null,
  "estimatedInterestRange": {"min": number, "max": number} or null,
  "recommendedPrograms": ["suitable mortgage types"],
  "submissionReady": boolean,
  "openItems": ["what's still needed"],
  "readinessScore": 0-100,
  "brokerSummary": "detailed internal summary for broker",
  "clientSummary": "friendly summary for client",
  "requiresHumanReview": boolean,
  "handoffReason": "reason if human review needed" or null
}`;

  try {
    const response = await callAI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error("Application analysis error:", error);
    return {
      overallRiskLevel: "pending",
      aggregatedFlags: ["Analysis incomplete"],
      estimatedApprovalAmount: null,
      estimatedMonthlyPayment: null,
      estimatedInterestRange: null,
      recommendedPrograms: [],
      submissionReady: false,
      openItems: ["Manual review required"],
      readinessScore: 0,
      brokerSummary: "Automated analysis could not complete. Please review manually.",
      clientSummary: "Your application is being reviewed by our team.",
      requiresHumanReview: true,
      handoffReason: "Automated analysis failed",
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
