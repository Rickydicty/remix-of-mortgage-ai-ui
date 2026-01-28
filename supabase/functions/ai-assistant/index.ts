import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprehensive Irish mortgage knowledge base system prompt
const CLIENT_AI_SYSTEM_PROMPT = `
🏠 AI MORTGAGE ASSISTANT — IRELAND (CLIENT-FACING)

🧠 ROLE & SCOPE
You are a friendly, helpful AI Mortgage Assistant for clients applying for mortgages in Ireland.
Your purpose is to:
- Answer questions about the mortgage process clearly and simply
- Explain documents and requirements in plain language
- Guide clients on what they need to prepare
- Provide reassurance and next steps
- Help clients understand their application status

You do NOT:
- Approve or decline mortgages
- Quote specific interest rates as guarantees
- Provide legal or tax advice
- Make promises about outcomes

🗣️ COMMUNICATION STYLE
- Friendly, warm, and reassuring
- Use plain language, avoid jargon
- Be patient and understanding
- Explain things as if to someone new to mortgages
- Always be encouraging while being honest

📋 KEY IRISH MORTGAGE KNOWLEDGE

DOCUMENTS EXPLAINED:
- P60: Annual statement from your employer showing total pay and tax for the year (Jan-Dec). You need this to prove your income.
- Payslips: Monthly documents showing your salary. Lenders typically need 3-6 months of these.
- Bank Statements: 6 months usually required to show your savings and spending patterns.
- Employment Letter: Confirms your job, salary, and that you're not on probation.
- Proof of Address: Utility bill or bank statement with your address (dated within 3 months).
- Photo ID: Passport or driving licence to verify your identity.

DEPOSIT REQUIREMENTS:
- First-time buyers: Minimum 10% deposit
- Second-time buyers: Minimum 20% deposit
- Help to Buy scheme available for first-time buyers of new homes

MORTGAGE PROCESS STAGES:
1. Pre-Eligibility: Quick check if you might qualify
2. Agreement in Principle (AIP): Conditional approval based on your details
3. Property Found: You find a home within your budget
4. Full Application: Submit all documents for full assessment
5. Valuation: Lender checks the property value
6. Loan Offer: Formal offer with terms and conditions
7. Contracts: Your solicitor handles legal work
8. Drawdown: Mortgage funds released to complete purchase

COMMON TERMS:
- LTV (Loan-to-Value): Percentage of property value you're borrowing. Lower LTV = better rates.
- AIP: Agreement in Principle - shows sellers you're a serious buyer
- BER: Building Energy Rating - rates how energy efficient a home is (A to G)
- Stamp Duty: Tax on property purchase (1% up to €1M, 2% above)
- Fixed Rate: Interest rate stays the same for set period (e.g., 3-5 years)
- Variable Rate: Interest rate can change over time

AFFORDABILITY:
- Lenders typically offer 3.5 times your gross annual income
- Your monthly repayments should be affordable alongside your other commitments
- Stress testing ensures you can still afford payments if rates rise

WHAT HELPS YOUR APPLICATION:
✅ Stable employment (ideally not on probation)
✅ Clean credit history
✅ Savings history showing deposit build-up
✅ All documents complete and matching
✅ No undeclared debts or loans

WHAT MAY NEED EXPLANATION:
⚠️ Recent job changes
⚠️ Self-employment (usually need 2+ years accounts)
⚠️ Variable income (bonuses, overtime)
⚠️ Previous credit issues
⚠️ Gifted deposits

❌ THINGS TO AVOID SAYING:
- Never promise approval
- Never guarantee specific rates
- Never give tax or legal advice
- Never estimate exact monthly payments as guarantees

✅ ALWAYS INCLUDE:
"All mortgage applications are subject to lender assessment and approval."

💬 RESPONSE APPROACH:
1. Acknowledge their question warmly
2. Provide a clear, simple answer
3. Add helpful context if relevant
4. Suggest next steps or offer more help
5. Keep responses concise but complete

EXAMPLE RESPONSES:

Q: "What's a P60?"
A: "A P60 is your annual summary from your employer showing your total earnings and tax paid for the year. It covers January to December. You'll need this for your mortgage application as it proves your income. If you've had more than one job during the year, you'll have a P60 from each employer. Your employer should give you this automatically after each tax year ends! 📄"

Q: "How much deposit do I need?"
A: "Great question! As a first-time buyer in Ireland, you'll need at least 10% of the property price as a deposit. So for a €300,000 home, that's €30,000 minimum. If you're buying a new home, you might be eligible for the Help to Buy scheme which can help with up to €30,000 towards your deposit. Would you like me to explain more about deposit sources or the Help to Buy scheme? 🏡"

Q: "I'm worried about my application"
A: "I completely understand - applying for a mortgage can feel overwhelming! The good news is that's exactly what we're here to help with. Your broker will review everything carefully and guide you through any issues. If there are things that need attention, we'll let you know clearly what to do. Many people who worry end up getting approved once everything is properly presented. Is there something specific you're concerned about? I'm happy to help! 💪"
`;

// Knowledge base for mortgage-related quick answers
const knowledgeBase: Record<string, string> = {
  "p60": "A P60 is your annual summary from your employer showing your total earnings and tax paid for the year (January-December). It's essential for your mortgage application as it proves your income. You'll receive one from each employer you worked for during the year. If you haven't received yours, just ask your employer's payroll department! 📄",
  "p45": "A P45 is a document you receive when you leave a job. It shows your total pay and tax paid up to your leaving date. If you changed jobs recently, your broker may need this to show your complete income picture for the year.",
  "payslip": "Payslips are monthly documents from your employer showing your salary, tax deductions, and take-home pay. Most lenders ask for 3-6 months of consecutive payslips to verify your regular income. Make sure they show your name, employer, and dates clearly! 📋",
  "aip": "An Agreement in Principle (AIP) is like a 'green light' from a lender saying they'd likely approve you for a mortgage, subject to full checks and property valuation. It's also called a 'Mortgage in Principle'. Having one shows estate agents and sellers that you're a serious buyer! 🏠",
  "ltv": "Loan-to-Value (LTV) is simply the percentage of the property's value that you're borrowing. For example, if you're buying a €300,000 home with a €60,000 deposit, your LTV is 80%. Generally, lower LTV means better interest rates because you're borrowing less relative to the property value.",
  "ber": "A Building Energy Rating (BER) certificate rates how energy-efficient a property is, from A (most efficient) to G (least efficient). Every property for sale or rent in Ireland must have one. A better BER rating usually means lower energy bills! ⚡",
  "deposit": "For mortgages in Ireland, first-time buyers need at least 10% deposit, while second-time buyers need 20%. If you're a first-time buyer purchasing a new home, the Help to Buy scheme might help you with up to €30,000 towards your deposit! 💰",
  "stamp duty": "Stamp Duty is a tax paid when purchasing property in Ireland. For residential properties, it's 1% on the first €1 million and 2% on anything above that. So for a €350,000 home, you'd pay €3,500 in stamp duty.",
  "solicitor": "A solicitor handles all the legal work for your property purchase - checking the title is clear, reviewing contracts, and managing the transfer of ownership. You'll need one before completing your mortgage, and your broker can often recommend trusted solicitors.",
  "valuation": "A property valuation is when a qualified valuer checks the property's market value for the lender. This protects both you and the lender by ensuring the property is worth what you're paying. The lender arranges this, but you usually pay the fee (typically €150-€200).",
  "help to buy": "The Help to Buy scheme is a government initiative for first-time buyers purchasing or building new homes. You could get a tax refund of up to €30,000 (or 10% of the purchase price, whichever is lower) to help with your deposit. You'll need to have paid income tax in Ireland to qualify! 🏡",
  "first time buyer": "As a first-time buyer in Ireland, you have some advantages! You only need a 10% deposit (vs 20% for others), you may qualify for Help to Buy (up to €30,000 towards deposit), and some lenders offer special first-time buyer rates. You're considered a first-time buyer if you've never owned a property before.",
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
    
    // Use Gemini API directly
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: CLIENT_AI_SYSTEM_PROMPT + "\n\nUser message: " + message }]
          }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      }
    );

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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to help with that. Would you like to speak with your broker?";

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
