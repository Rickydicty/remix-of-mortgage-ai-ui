import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Knowledge base for mortgage-related quick answers
const knowledgeBase: Record<string, string> = {
  "p60": "A P60 is an annual statement from your employer showing your total pay and tax deducted for the tax year (January-December). It's essential for mortgage applications as it proves your income. You'll receive one from each employer you worked for during the year.",
  "p45": "A P45 is a document you receive when you leave a job. It shows your total pay and tax paid up to your leaving date. If you changed jobs recently, your mortgage broker may need this.",
  "payslip": "Payslips are documents from your employer showing your salary, tax deductions, and net pay. Most lenders require 3-6 months of consecutive payslips as proof of income.",
  "aip": "An Agreement in Principle (AIP) is a conditional offer from a lender stating how much they'd be willing to lend you, subject to full application and property valuation. It's also called a 'Mortgage in Principle' or 'Decision in Principle'.",
  "ltv": "Loan-to-Value (LTV) is the percentage of the property value you're borrowing. For example, if you're buying a €300,000 property with a €60,000 deposit, your LTV is 80%. Lower LTV usually means better interest rates.",
  "ber": "A Building Energy Rating (BER) certificate rates the energy performance of a property from A (most efficient) to G (least efficient). It's required when selling or renting a property in Ireland.",
  "deposit": "For a mortgage in Ireland, first-time buyers typically need at least 10% deposit, while second-time buyers need 20%. There may be additional schemes like Help to Buy that can assist with this.",
  "stamp duty": "Stamp Duty is a tax paid when purchasing property in Ireland. The rate is 1% on properties up to €1 million, and 2% on the balance above €1 million for residential properties.",
  "solicitor": "A solicitor handles the legal aspects of your property purchase, including title searches, contract review, and transfer of ownership. You'll need one before completing your mortgage.",
  "valuation": "A property valuation is an independent assessment of a property's market value, required by lenders before approving a mortgage. The lender typically arranges this, but you usually pay the fee.",
};

// Compliance-related keywords that should escalate to human support
const complianceKeywords = [
  "complaint", "complain", "dispute", "legal", "lawsuit", "regulation",
  "data protection", "gdpr", "privacy", "mis-sold", "missold", "compensation",
  "ombudsman", "financial services", "central bank", "regulatory"
];

function shouldEscalateToHuman(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return complianceKeywords.some(keyword => lowerMessage.includes(keyword));
}

function findQuickAnswer(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  for (const [key, answer] of Object.entries(knowledgeBase)) {
    if (lowerMessage.includes(key)) {
      return answer;
    }
  }
  
  // Check for common variations
  if (lowerMessage.includes("what is") || lowerMessage.includes("what's") || lowerMessage.includes("explain")) {
    for (const [key, answer] of Object.entries(knowledgeBase)) {
      if (lowerMessage.includes(key)) {
        return answer;
      }
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, hasAttachment, attachmentType } = await req.json();
    
    // Check for compliance escalation
    if (shouldEscalateToHuman(message)) {
      return new Response(
        JSON.stringify({
          response: "I understand this is an important matter. For questions about compliance, regulations, or complaints, I recommend speaking directly with your broker or our support team who can provide expert assistance. Would you like me to connect you with human support?",
          escalate: true,
          type: "compliance"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check for quick answers from knowledge base
    const quickAnswer = findQuickAnswer(message);
    if (quickAnswer) {
      return new Response(
        JSON.stringify({
          response: quickAnswer,
          escalate: false,
          type: "knowledge_base"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // For attachment-related queries
    if (hasAttachment) {
      return new Response(
        JSON.stringify({
          response: `I've received your ${attachmentType || 'document'}. Your broker will review this and get back to you. In the meantime, is there anything else I can help you with?`,
          escalate: false,
          type: "attachment"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use Lovable AI for general questions
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
            content: `You are a helpful mortgage assistant for Irish mortgage applicants. You help answer questions about:
- Mortgage documents (P60, payslips, bank statements)
- The mortgage application process
- Irish property terms (BER, stamp duty, etc.)
- General mortgage guidance

Keep responses concise and friendly. If asked about specific rates, fees, or complex compliance matters, suggest speaking with the broker.
Do NOT provide specific financial advice or recommendations.
If you're unsure, say so and recommend contacting the broker.`
          },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            response: "I'm a bit busy right now. Please try again in a moment, or send a message to your broker directly.",
            escalate: false,
            type: "rate_limit"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm not sure how to help with that. Would you like to speak with your broker?";

    return new Response(
      JSON.stringify({
        response: aiResponse,
        escalate: false,
        type: "ai"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(
      JSON.stringify({
        response: "I'm having trouble right now. Please try again or send a message to your broker directly.",
        escalate: false,
        type: "error"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
