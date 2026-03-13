import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive Irish Mortgage Document Knowledge Base
const DOCUMENT_KNOWLEDGE_BASE = `
🔐 AI MORTGAGE BROKER AGENT — DOCUMENT KNOWLEDGE BASE (IRELAND)

🧠 ROLE & AUTHORITY
You are an AI Mortgage Broker Assistant specialised in Irish mortgage documentation.
You analyse uploaded documents only.
You do NOT approve loans or make lending decisions.

Your job is to:
- Verify documents against Irish lender standards
- Extract key data
- Detect missing, invalid, or risky items
- Flag inconsistencies across documents
- Prepare the case for broker and lender review

Assume Irish lender norms (AIB, BOI, PTSB, Avant, ICS, Haven, etc.).

📁 DOCUMENT ANALYSIS RULES (GLOBAL)
For every document, you must check:
- Legibility (all pages present)
- Correct document type
- Validity period
- Name consistency
- Date relevance
- Completeness

🚫 Never assume missing information
🚫 Never infer income without evidence

🗂️ DOCUMENT KNOWLEDGE BASE (AUTHORITATIVE)

1️⃣ CERTIFIED ID
Expected: Passport OR Irish Driving Licence OR National ID
Standard:
- Valid (not expired)
- Clear photo & text
- Full legal name visible
- Date of birth visible
Extract: Full name, DOB, Expiry date
🚩 Flags:
- Expired ID
- Name mismatch vs application
- Cropped image
- Blurry / unreadable

2️⃣ PROOF OF ADDRESS
Expected: Utility bill, Bank statement, Government correspondence
Standard:
- Recent (lender-acceptable timeframe, typically within 3-6 months)
- Full address shown
- Matches application address
Extract: Address, Issue date
🚩 Flags:
- Too old
- PO Box
- Address mismatch
- Partial pages

3️⃣ BI / LENDER APPLICATION FORM
Expected: Completed application form, Signed (where applicable)
Standard:
- Matches declared income, employment, dependents
- No missing sections
Extract: Declared income, Employment type, Loan amount, Personal details
🚩 Flags:
- Mismatch vs payslips/accounts
- Missing signatures
- Incomplete sections

4️⃣ CURRENT ACCOUNT STATEMENTS (6 MONTHS)
Expected: Full statements, All pages, Continuous 6-month period
Standard:
- Salary credits visible
- Regular expenses
- No undisclosed loans
Extract: Salary lodgements, Rent/mortgage payments, Loan repayments, Gambling indicators
🚩 Flags (CRITICAL):
- Gambling transactions
- Returned / unpaid items
- Undeclared loans
- Heavy overdraft usage
- Large unexplained cash deposits

5️⃣ SAVINGS ACCOUNT STATEMENTS (6 MONTHS)
Expected: All savings accounts, Full statements
Standard:
- Deposit build-up visible
- Clear source of funds
Extract: Balance trend, Lump sums
🚩 Flags:
- Sudden large deposits
- Unexplained transfers
- No savings pattern

6️⃣ MARRIAGE CERTIFICATE (IF APPLICABLE)
Expected: Official certificate
Standard: Names match application
🚩 Flags:
- Declared married but missing
- Name mismatch

7️⃣ GIFT LETTER (IF GIFTED BOF)
Expected: Donor details, Gift amount, Confirmation of non-repayment
Standard: Lender-accepted format, Signed
Extract: Donor name, Relationship, Amount
🚩 Flags:
- Missing declaration
- Loan disguised as gift
- Unsigned letter

8️⃣ LOAN ACCOUNT STATEMENTS (6 MONTHS)
Expected: All personal loans, All credit facilities
Standard: Matches declared liabilities
Extract: Balances, Monthly repayments
🚩 Flags:
- Undeclared liabilities
- Arrears
- Missed payments

9️⃣ MORTGAGE STATEMENTS (12 MONTHS)
Expected: Existing mortgage history
Standard: Up-to-date, No arrears
Extract: Balance, Repayment history
🚩 Flags:
- Arrears
- Payment holidays
- Undisclosed mortgage

🔟 OTHER DOCUMENTS
Expected: Supporting evidence only
🚩 Flags:
- Unlabelled files
- Irrelevant uploads

👔 EMPLOYMENT-SPECIFIC DOCUMENTS

🟦 EMPLOYEE (PAYE)

11️⃣ PAYSLIPS (LAST 3 MONTHS)
Standard:
- Employer name visible
- Gross & net pay
- Consistent income
🚩 Flags:
- Variable income
- Mismatch with EDS
- Missing employer details
- Older than 3 months

12️⃣ EMPLOYMENT DETAIL SUMMARY (EDS)
Standard:
- Latest Revenue summary
- Employer + annual income
🚩 Flags:
- Income mismatch
- Multiple employers not disclosed

13️⃣ SALARY CERTIFICATE
Standard:
- Permanent role
- Probation status stated
- Signed by employer
🚩 Flags:
- On probation
- Temporary contract
- Unsigned

🟨 SELF-EMPLOYED

14️⃣ BUSINESS ACCOUNTS (2 YEARS)
Standard:
- Signed by accountant & client
- Stable profits
🚩 Flags:
- Declining profits
- One year only
- Unsigned accounts

15️⃣ FORM 11 (2 YEARS)
Standard:
- Filed
- Matches accounts
🚩 Flags:
- Missing year
- Mismatch with accounts

16️⃣ CHAPTER 4 NOTICES
Standard: Revenue assessed
🚩 Flags:
- Missing notices
- Income mismatch

17️⃣ BUSINESS BANK STATEMENTS (12 MONTHS)
Standard: Healthy cash flow
🚩 Flags:
- Personal spending through business
- Revenue arrears indicators

18️⃣ ROS PAYMENT & CHARGES
🚩 Flags:
- Outstanding Revenue debt
- Missed payments

19️⃣ TAX CLEARANCE CERTIFICATE
🚩 Flags:
- Expired
- Missing certificate

🔍 CROSS-DOCUMENT INTELLIGENCE (MANDATORY)
You must compare:
- Payslips ↔ EDS ↔ Bank statements
- Declared income ↔ actual lodgements
- Declared loans ↔ repayments
- Employment type ↔ documents uploaded
- Deposit source ↔ savings history

🚩 FLAG SEVERITY
🔴 HIGH: Misrepresentation, Revenue non-compliance, Undeclared liabilities, Gambling evidence, Missing mandatory docs
🟡 MEDIUM: Income volatility, Employment change, Clarifications needed
🟢 LOW: Formatting issues, Minor missing pages

🗣️ RESPONSE RULES
Client-Facing: Neutral, Clear, Actionable
Example: "We need clarification on a large deposit shown in your bank statement so we can continue."

Broker-Facing: Technical, Concise, Evidence-based

❌ ABSOLUTE LIMITS
- Never approve or reject
- Never estimate rates
- Never promise outcomes
- Never give legal/tax advice
- Always state: "All mortgage applications are subject to lender assessment and approval."
`;

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
  
  // Bank statement risk indicators
  gamblingTransactions?: boolean;
  returnedItems?: boolean;
  undeclaredLoans?: boolean;
  heavyOverdraftUsage?: boolean;
  unexplainedDeposits?: boolean;
  
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
  
  // Gift letter
  donorName?: string;
  donorRelationship?: string;
  giftAmount?: number;
  isSigned?: boolean;
  
  // Self-employed
  netProfit?: number;
  grossRevenue?: number;
  accountantSigned?: boolean;
  
  // Quality issues detected by AI
  qualityIssues?: string[];
  agentComment?: string;
  riskFlags?: string[];
  flagSeverity?: 'high' | 'medium' | 'low';
  
  // General
  missingPages?: boolean;
  dateRange?: { from: string; to: string };
  inconsistencies?: string[];
}

interface AnalysisResponse {
  score: number;
  analysis: string;
  status: 'approved' | 'disapproved' | 'pending';
  extractedData: ExtractedData;
}

const DOCUMENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  certified_id: "Government-issued photo ID such as passport, Irish driving licence, or national ID card. Must show full legal name, clear photo, date of birth, and be valid (not expired).",
  proof_of_address: "Utility bill, bank statement, or government correspondence showing current residential address. Must be dated within last 3-6 months and show full address.",
  cover_letter: "A formal cover letter explaining the mortgage application case and client situation.",
  application_form: "Completed BI/lender mortgage application form. Must be fully completed with all sections filled and signed where applicable.",
  payslips: "Official payslips from employer showing gross pay, net pay, deductions, employer name. Must be from last 3 months consecutively.",
  current_account_statements: "Bank statements from current/checking account showing 6 months of transactions, salary credits, regular expenses, and account holder details.",
  savings_account_statements: "Savings account statements showing 6 months of balance history, deposit build-up, and source of funds for deposit.",
  employment_summary: "Employment Detail Summary (EDS) from Revenue showing employer names, annual income, and tax year details.",
  salary_cert: "Salary certificate from employer confirming permanent role, salary, employment start date, and probation status. Must be signed by employer.",
  marriage_certificate: "Official marriage certificate showing names of both spouses matching application details.",
  self_employed_docs: "Business accounts (2 years minimum), Form 11s, Chapter 4 notices, signed by accountant and client with stable/consistent profits.",
  ros_payment_charges: "ROS (Revenue Online Service) payment history showing no outstanding Revenue debt or missed payments.",
  tax_clearance: "Valid Tax Clearance Certificate from Revenue. Must not be expired.",
  gift_letter: "Letter confirming gift of funds for deposit with donor name, relationship, gift amount, and signed confirmation that it is non-repayable.",
  loan_account_statements: "Statements from all personal loan accounts and credit facilities showing 6 months of repayment history, balances, and monthly payments.",
  mortgage_statements: "Existing mortgage statements showing 12 months of repayment history, current balance, and no arrears or payment holidays.",
  business_bank_statements: "Business bank statements showing 12 months of healthy cash flow with no personal spending through business or Revenue arrears indicators.",
  other: "Any other supporting document relevant to the mortgage application."
};

// Define extraction schema based on document type
function getExtractionTool(documentType: string) {
  const baseProperties: Record<string, any> = {
    missingPages: { type: "boolean", description: "Whether pages appear to be missing from the document" },
    inconsistencies: { type: "array", items: { type: "string" }, description: "Any inconsistencies or red flags found" },
    qualityIssues: { 
      type: "array", 
      items: { type: "string" }, 
      description: "Quality issues: blurry/unreadable, expired, incomplete/missing pages, cropped/cut off, name mismatch, date mismatch, missing signature, outdated" 
    },
    riskFlags: {
      type: "array",
      items: { type: "string" },
      description: "Risk flags detected: gambling transactions, returned items, undeclared loans, heavy overdraft, unexplained deposits, income mismatch, probation, declining profits, etc."
    },
    flagSeverity: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: "Severity: HIGH (misrepresentation, gambling, undeclared liabilities), MEDIUM (income volatility, employment change), LOW (formatting issues)"
    },
    agentComment: { 
      type: "string", 
      description: "Specific actionable comment for the client explaining what needs attention. Be clear and neutral." 
    }
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
      ppsNumber: { type: "string", description: "PPS number if visible" },
      dateRange: { 
        type: "object", 
        properties: { 
          from: { type: "string" }, 
          to: { type: "string" } 
        } 
      }
    },
    current_account_statements: {
      avgBalance: { type: "number", description: "Average account balance over the statement period" },
      endingBalance: { type: "number", description: "Closing balance at end of statement" },
      totalDeposits: { type: "number", description: "Total deposits/credits during period" },
      totalWithdrawals: { type: "number", description: "Total withdrawals/debits during period" },
      bankName: { type: "string", description: "Name of the bank" },
      accountType: { type: "string", description: "Type of account" },
      gamblingTransactions: { type: "boolean", description: "Are there gambling transactions visible?" },
      returnedItems: { type: "boolean", description: "Are there returned/unpaid items?" },
      undeclaredLoans: { type: "boolean", description: "Are there loan repayments not declared?" },
      heavyOverdraftUsage: { type: "boolean", description: "Is there heavy overdraft usage?" },
      unexplainedDeposits: { type: "boolean", description: "Are there large unexplained cash deposits?" },
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
      unexplainedDeposits: { type: "boolean", description: "Are there sudden large unexplained deposits?" },
      savingsPattern: { type: "boolean", description: "Is there a consistent savings pattern visible?" },
      dateRange: { 
        type: "object", 
        properties: { 
          from: { type: "string" }, 
          to: { type: "string" } 
        } 
      }
    },
    certified_id: {
      fullName: { type: "string", description: "Full legal name as shown on ID - MUST extract this" },
      dateOfBirth: { type: "string", description: "Date of birth (YYYY-MM-DD format)" },
      documentNumber: { type: "string", description: "ID/passport/CNIC number - MUST extract this" },
      idType: { type: "string", enum: ["passport", "drivers_license", "national_id", "other"], description: "Type of ID document" },
      expiryDate: { type: "string", description: "Expiry date if visible (YYYY-MM-DD)" },
      issueDate: { type: "string", description: "Issue date if visible (YYYY-MM-DD)" },
      nationality: { type: "string", description: "Nationality/citizenship/country of issue" },
      issuingAuthority: { type: "string", description: "Issuing authority or country (e.g., Pakistan, Ireland, NADRA)" },
      isExpired: { type: "boolean", description: "Has this ID expired based on expiry date?" },
      gender: { type: "string", description: "Gender if shown on ID" },
      address: { type: "string", description: "Address if shown on ID document" }
    },
    proof_of_address: {
      fullName: { type: "string", description: "Name on the document" },
      address: { type: "string", description: "Full address shown" },
      documentDate: { type: "string", description: "Date of the document (YYYY-MM-DD)" },
      utilityProvider: { type: "string", description: "Utility/service provider name" },
      isRecent: { type: "boolean", description: "Is the document dated within acceptable timeframe (3-6 months)?" }
    },
    employment_summary: {
      income: { type: "number", description: "Total annual income" },
      employer: { type: "string", description: "Employer name" },
      taxYear: { type: "string", description: "Tax year covered" },
      taxPaid: { type: "number", description: "Total tax paid" },
      ppsNumber: { type: "string", description: "PPS number" },
      multipleEmployers: { type: "boolean", description: "Are multiple employers shown?" }
    },
    salary_cert: {
      income: { type: "number", description: "Annual salary confirmed" },
      employer: { type: "string", description: "Employer name" },
      employmentType: { type: "string", enum: ["permanent", "contract", "part-time", "temporary"] },
      startDate: { type: "string", description: "Employment start date" },
      onProbation: { type: "boolean", description: "Is the employee on probation?" },
      isSigned: { type: "boolean", description: "Is the certificate signed by employer?" }
    },
    loan_account_statements: {
      loanBalance: { type: "number", description: "Outstanding loan balance" },
      monthlyPayment: { type: "number", description: "Monthly repayment amount" },
      lender: { type: "string", description: "Lender name" },
      interestRate: { type: "number", description: "Interest rate" },
      hasArrears: { type: "boolean", description: "Are there arrears or missed payments?" },
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
      address: { type: "string", description: "Property address" },
      hasArrears: { type: "boolean", description: "Are there any arrears?" },
      hasPaymentHolidays: { type: "boolean", description: "Are there payment holidays shown?" }
    },
    tax_clearance: {
      taxYear: { type: "string", description: "Tax year" },
      ppsNumber: { type: "string", description: "PPS number" },
      totalIncome: { type: "number", description: "Total income declared" },
      taxPaid: { type: "number", description: "Total tax paid" },
      isExpired: { type: "boolean", description: "Has the certificate expired?" }
    },
    gift_letter: {
      donorName: { type: "string", description: "Name of the gift donor" },
      donorRelationship: { type: "string", description: "Relationship to applicant" },
      giftAmount: { type: "number", description: "Amount of gift in EUR" },
      isSigned: { type: "boolean", description: "Is the letter signed?" },
      confirmsNonRepayable: { type: "boolean", description: "Does it confirm the gift is non-repayable?" }
    },
    self_employed_docs: {
      income: { type: "number", description: "Net profit/income" },
      taxYear: { type: "string", description: "Tax/accounting year" },
      totalIncome: { type: "number", description: "Gross revenue/turnover" },
      accountantSigned: { type: "boolean", description: "Are accounts signed by accountant?" },
      clientSigned: { type: "boolean", description: "Are accounts signed by client?" },
      profitTrend: { type: "string", enum: ["increasing", "stable", "declining"], description: "Profit trend over years" }
    },
    business_bank_statements: {
      avgBalance: { type: "number", description: "Average balance" },
      endingBalance: { type: "number", description: "Closing balance" },
      healthyCashFlow: { type: "boolean", description: "Is cash flow healthy?" },
      personalSpending: { type: "boolean", description: "Is there personal spending through business?" },
      revenueArrearsIndicators: { type: "boolean", description: "Are there Revenue arrears indicators?" },
      dateRange: { 
        type: "object", 
        properties: { 
          from: { type: "string" }, 
          to: { type: "string" } 
        } 
      }
    },
    ros_payment_charges: {
      outstandingDebt: { type: "boolean", description: "Is there outstanding Revenue debt?" },
      missedPayments: { type: "boolean", description: "Are there missed payments?" }
    },
    marriage_certificate: {
      spouseName1: { type: "string", description: "First spouse name" },
      spouseName2: { type: "string", description: "Second spouse name" },
      marriageDate: { type: "string", description: "Date of marriage (YYYY-MM-DD)" },
      namesMatchApplication: { type: "boolean", description: "Do names match the application?" }
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
      description: `Extract structured data from a ${documentType} document for Irish mortgage application processing`,
      parameters: {
        type: "object",
        properties: {
          score: { type: "number", description: "Document quality score 0-100" },
          analysis: { type: "string", description: "Brief analysis of the document for broker" },
          clientMessage: { type: "string", description: "Neutral, clear message for client about the document status" },
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

// Helper: sleep for ms
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to call Gemini API with retry on rate limits
async function callGeminiWithRetry(url: string, body: any, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return response;
    }

    if (response.status === 429 && attempt < maxRetries) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(5000 * Math.pow(2, attempt), 30000);
      console.log(`Rate limited (429), waiting ${waitMs / 1000}s before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitMs);
      continue;
    }

    // For non-retryable errors, throw immediately
    const status = response.status;
    console.error(`Gemini API failed with status ${status}`);
    throw new Error(`GEMINI_ERROR_${status}`);
  }
  throw new Error('GEMINI_ERROR_429_MAX_RETRIES');
}

// Helper to call Gemini API with a specific key
async function callGeminiForClassification(apiKey: string, classificationPrompt: string, imageBase64: string, mimeType: string): Promise<string> {
  const response = await callGeminiWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      contents: [{
        parts: [
          { text: classificationPrompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.1,
      },
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toLowerCase() || 'other';
}

// Auto-detect document type from image with fallback
async function detectDocumentType(imageBase64: string, mimeType: string): Promise<string> {
  const geminiPrimary = Deno.env.get('GEMINI_API_KEY');
  const geminiBackup = Deno.env.get('GEMINI_API_KEY_BACKUP');
  
  const classificationPrompt = `You are a document classifier for Irish mortgage applications. 
Classify the document into ONE of these categories:
- certified_id (passport, driving licence, national ID card)
- proof_of_address (utility bill, bank statement used as address proof, government letter)
- payslips (employer payslip showing salary)
- current_account_statements (bank current account statements)
- savings_account_statements (savings account statements)
- employment_summary (Revenue Employment Detail Summary / EDS)
- salary_cert (Salary Certificate from employer)
- marriage_certificate (marriage cert)
- self_employed_docs (business accounts, audited accounts)
- form_11 (Form 11 tax returns)
- chapter_4 (Chapter 4 notices)
- business_bank_statements (business bank statements)
- ros_payment_charges (ROS payment/charges form)
- tax_clearance (Tax Clearance Certificate)
- gift_letter (gift letter for deposit)
- loan_account_statements (personal loan statements)
- mortgage_statements (existing mortgage statements)
- application_form (mortgage application form)
- other (if none of the above)

Return ONLY the category name, nothing else.

Classify this document:`;

  // Try primary Gemini key
  if (geminiPrimary) {
    try {
      console.log('Trying document classification with primary Gemini key...');
      const detected = await callGeminiForClassification(geminiPrimary, classificationPrompt, imageBase64, mimeType);
      const validTypes = Object.keys(DOCUMENT_TYPE_DESCRIPTIONS);
      return validTypes.includes(detected) ? detected : 'other';
    } catch (e) {
      console.error('Primary Gemini failed:', e);
    }
  }

  // Try backup Gemini key
  if (geminiBackup) {
    try {
      console.log('Trying document classification with backup Gemini key...');
      const detected = await callGeminiForClassification(geminiBackup, classificationPrompt, imageBase64, mimeType);
      const validTypes = Object.keys(DOCUMENT_TYPE_DESCRIPTIONS);
      return validTypes.includes(detected) ? detected : 'other';
    } catch (e) {
      console.error('Backup Gemini failed:', e);
    }
  }

  // If all providers fail, return 'other' and let the user manually categorize
  console.error('All AI providers failed for classification, defaulting to "other"');
  return 'other';
}

// Helper to call Gemini API for document analysis
async function callGeminiForAnalysis(apiKey: string, systemPrompt: string, userPrompt: string, imageBase64: string, mimeType: string): Promise<any> {
  const response = await callGeminiWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      contents: [{
        parts: [
          { text: systemPrompt + "\n\n" + userPrompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.3,
      },
    }
  );

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Try to extract JSON from the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No JSON found in response');
}

async function analyzeDocumentWithAI(imageBase64: string, mimeType: string, documentType: string, autoDetect: boolean = false): Promise<AnalysisResponse & { detectedType?: string }> {
  const geminiPrimary = Deno.env.get('GEMINI_API_KEY');
  const geminiBackup = Deno.env.get('GEMINI_API_KEY_BACKUP');
  
  if (!geminiPrimary && !geminiBackup) {
    throw new Error('No Gemini API keys configured');
  }
  
  // Auto-detect document type if requested
  let finalDocType = documentType;
  if (autoDetect || documentType === 'auto') {
    console.log('Auto-detecting document type...');
    finalDocType = await detectDocumentType(imageBase64, mimeType);
    console.log('Detected document type:', finalDocType);
  }
  
  const expectedDocDescription = DOCUMENT_TYPE_DESCRIPTIONS[finalDocType] || "Unknown document type";
  
  const systemPrompt = `${DOCUMENT_KNOWLEDGE_BASE}

You are analyzing this document: "${finalDocType}"
Expected: ${expectedDocDescription}

DOCUMENT QUALITY CHECKS - Look for these issues:
- BLURRY/UNREADABLE: Is the document blurry, pixelated, or hard to read?
- EXPIRED: For IDs/passports/certificates, check if the expiry date has passed
- INCOMPLETE/MISSING PAGES: Are pages missing? (e.g., "Page 1 of 3" but only page 1 provided)
- CROPPED/CUT OFF: Is important information cut off at edges?
- NAME MISMATCH: Does the name on document match expected applicant name?
- DATE ISSUES: Are dates inconsistent or outside acceptable ranges?
- MISSING SIGNATURE: For documents requiring signatures, is it signed?
- OUTDATED: For payslips, check if older than 3 months. For bank statements, check for 6-month coverage.
- WRONG FORMAT: Screenshot instead of original PDF, photo of screen, etc.

CRITICAL FLAGS TO DETECT:
🔴 HIGH SEVERITY:
- Gambling transactions in bank statements
- Undeclared loans/liabilities
- Revenue non-compliance indicators
- Misrepresentation of income
- Missing mandatory documents
- Expired ID documents

🟡 MEDIUM SEVERITY:
- Income volatility
- Recent employment changes
- On probation
- Declining business profits

🟢 LOW SEVERITY:
- Minor formatting issues
- Minor missing pages

EXTRACTION RULES - CRITICAL:
- You MUST extract ALL visible data fields - do not leave fields empty if data is visible
- For ID documents: ALWAYS extract fullName, dateOfBirth, documentNumber, nationality, expiryDate
- For financial figures, use EUR
- For dates, use YYYY-MM-DD format
- If a field IS visible on the document, you MUST extract it
- Only omit fields that are genuinely not present on the document
- For ID cards/passports: Read ALL text carefully including numbers, dates, names

AGENT COMMENT - CRITICAL:
- Provide a specific, actionable comment for the client
- Be neutral and clear, not alarming
- Examples:
  - "We need clarification on a large deposit shown in your bank statement so we can continue."
  - "This passport has expired. Please upload a valid, non-expired passport."
  - "The payslip is from over 3 months ago. Please upload your most recent payslips."

SCORING GUIDE:
- 0-10: Random image, meme, selfie, or completely unrelated content
- 10-30: A real document but WRONG TYPE
- 30-50: Correct document type but has serious quality issues or HIGH severity flags
- 50-70: Correct document type, readable, MEDIUM severity issues
- 70-90: Correct document type, good quality, LOW severity or minor issues only
- 90-100: Perfect document - correct type, high quality, all details visible, no issues

IMPORTANT: Return a JSON object with score, analysis, extractedData, flags, and agentComment.`;


  const userPrompt = `Analyze this "${documentType}" document for an Irish mortgage application. 

CRITICAL INSTRUCTIONS:
1. CAREFULLY READ ALL TEXT on the document including names, numbers, dates
2. EXTRACT ALL VISIBLE DATA into the extractedData object
3. For ID documents: You MUST extract fullName, dateOfBirth, documentNumber, nationality, expiryDate, issuingAuthority
4. DO NOT return empty fields if data is visible on the document
5. Apply the Document Knowledge Base standards
6. Detect any flags (HIGH/MEDIUM/LOW severity)

Expected document type: ${expectedDocDescription}

Return a JSON object with:
1. score: A quality score (0-100)
2. analysis: Technical analysis for broker
3. extractedData: ALL extracted data fields - populate every field you can see on the document
4. flags: Any risk flags detected (array of strings)
5. agentComment: A helpful message for the client

Remember: Read the document carefully and extract ALL visible information.`;

  let parsedResult: any = null;
  let lastError: Error | null = null;

  // Try primary Gemini key
  if (geminiPrimary) {
    try {
      console.log('Trying document analysis with primary Gemini key...');
      parsedResult = await callGeminiForAnalysis(geminiPrimary, systemPrompt, userPrompt, imageBase64, mimeType);
      console.log('Primary Gemini succeeded');
    } catch (e) {
      console.error('Primary Gemini failed:', e);
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  // Try backup Gemini key if primary failed
  if (!parsedResult && geminiBackup) {
    try {
      console.log('Trying document analysis with backup Gemini key...');
      parsedResult = await callGeminiForAnalysis(geminiBackup, systemPrompt, userPrompt, imageBase64, mimeType);
      console.log('Backup Gemini succeeded');
    } catch (e) {
      console.error('Backup Gemini failed:', e);
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  // If all providers failed, throw a user-friendly error
  if (!parsedResult) {
    console.error('All AI providers failed for document analysis');
    throw new Error('AI_TEMPORARILY_UNAVAILABLE: All AI services are busy. Please try again in a few moments.');
  }

  // Employment Detail Summary (EDS) tax-year validation:
  // must be from current or previous tax year; otherwise force broker review.
  if (finalDocType === 'employment_summary') {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    const taxYearRaw = parsedResult?.extractedData?.taxYear;
    const taxYearNum = typeof taxYearRaw === 'string'
      ? Number((taxYearRaw.match(/\d{4}/)?.[0] ?? NaN))
      : (typeof taxYearRaw === 'number' ? taxYearRaw : NaN);

    const isValid = taxYearNum === currentYear || taxYearNum === previousYear;

    if (!Number.isFinite(taxYearNum) || !isValid) {
      parsedResult.score = 65;
      parsedResult.extractedData = parsedResult.extractedData || {};
      parsedResult.extractedData.flagSeverity = 'medium';
      parsedResult.extractedData.qualityIssues = Array.from(new Set([
        ...(parsedResult.extractedData.qualityIssues || []),
        'EDS tax year is not current or previous tax year'
      ]));
      parsedResult.extractedData.riskFlags = Array.from(new Set([
        ...(parsedResult.extractedData.riskFlags || []),
        'Outdated Employment Detail Summary (EDS)'
      ]));

      const yearText = Number.isFinite(taxYearNum) ? `${taxYearNum}` : 'an unknown year';
      parsedResult.extractedData.agentComment =
        `This Employment Detail Summary appears to be for ${yearText}. Please upload your Revenue EDS for ${previousYear} or ${currentYear}.`;

      parsedResult.analysis =
        `EDS tax year validation: extracted ${yearText}; required ${previousYear} or ${currentYear}. Marked for broker review.`;
    }
  }

  // Process the parsed result - use valid status values from documents_status_check constraint
  let status: 'approved' | 'disapproved' | 'pending';
  if (parsedResult.score >= 70) {
    status = 'approved';
  } else if (parsedResult.score < 50) {
    status = 'disapproved';
  } else {
    status = 'pending';
  }

  return {
    score: parsedResult.score || 50,
    analysis: parsedResult.analysis || 'Document analyzed',
    status,
    extractedData: parsedResult.extractedData || {},
    detectedType: finalDocType
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
    const autoDetect = formData.get('autoDetect') === 'true';

    if (!file || !documentType) {
      return new Response(JSON.stringify({ error: 'Missing file or documentType' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing file:', file.name, 'Type:', documentType, 'AutoDetect:', autoDetect);

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

    // Analyze with AI - extract structured data (with optional auto-detection)
    const analysis = await analyzeDocumentWithAI(base64Image, file.type, documentType, autoDetect);
    
    // Use detected type if auto-detection was enabled
    const finalDocumentType = analysis.detectedType || documentType;

    console.log('Extracted data:', JSON.stringify(analysis.extractedData, null, 2));
    console.log('Final document type:', finalDocumentType);

    // Save document to database with detected type
    const { data: document, error: dbError } = await supabaseClient
      .from('documents')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        document_type: finalDocumentType,
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
      // Determine risk level based on flags
      let riskLevel = 'low';
      const extractedData = analysis.extractedData;
      if (extractedData.flagSeverity === 'high' || 
          extractedData.gamblingTransactions || 
          extractedData.undeclaredLoans ||
          analysis.score < 50) {
        riskLevel = 'high';
      } else if (extractedData.flagSeverity === 'medium' || analysis.score < 70) {
        riskLevel = 'medium';
      }

      const { error: analysisError } = await serviceClient
        .from('agent_document_analysis')
        .upsert({
          document_id: document.id,
          application_id: application.id,
          client_id: user.id,
          extracted_data: analysis.extractedData,
          risk_level: riskLevel,
          risk_flags: extractedData.riskFlags || extractedData.inconsistencies || [],
          quality_issues: extractedData.qualityIssues || (analysis.score < 70 ? ['Document quality below threshold'] : []),
          completeness_score: analysis.score,
          broker_commentary: extractedData.agentComment || analysis.analysis,
          client_explanation: extractedData.agentComment || 'Document received and analyzed.'
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
      extractedData: analysis.extractedData,
      detectedType: analysis.detectedType
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
