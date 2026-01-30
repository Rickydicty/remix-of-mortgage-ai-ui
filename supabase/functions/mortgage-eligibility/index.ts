import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EligibilityRequest {
  income1: number;
  income2?: number;
  creditHistory: 'good' | 'fair' | 'poor';
  monthlyCommitments: number;
  depositAmount: number;
  propertyValue: number;
  firstTimeBuyer: boolean;
  desiredTerm: number;
  residencyStatus: string;
  employmentType: string;
}

interface EligibilityResult {
  eligible: boolean;
  eligibilityScore: number;
  borrowingCapacityLow: number;
  borrowingCapacityHigh: number;
  estimatedMonthlyPayment: number;
  maxLTV: number;
  incomeMultiple: number;
  message: string;
  riskFactors: string[];
  recommendations: string[];
}

const evaluateEligibility = (data: EligibilityRequest): EligibilityResult => {
  const totalIncome = data.income1 + (data.income2 || 0);
  const riskFactors: string[] = [];
  const recommendations: string[] = [];
  
  // Irish Central Bank rules: 3.5x income multiple (4x for first-time buyers in some cases)
  const baseMultiplier = data.firstTimeBuyer ? 4 : 3.5;
  
  // Calculate borrowing capacity
  const maxBorrowing = totalIncome * baseMultiplier;
  const borrowingLow = Math.round(maxBorrowing * 0.9);
  const borrowingHigh = Math.round(maxBorrowing * 1.1);
  
  // LTV calculation (Irish rules: 90% FTB, 80% non-FTB)
  const maxLTV = data.firstTimeBuyer ? 90 : 80;
  const requiredDeposit = data.propertyValue * (1 - maxLTV / 100);
  const actualLTV = ((data.propertyValue - data.depositAmount) / data.propertyValue) * 100;
  
  // Calculate monthly payment at current avg rate (~3.4%)
  const loanAmount = (borrowingLow + borrowingHigh) / 2;
  const monthlyRate = 0.034 / 12;
  const numPayments = data.desiredTerm * 12;
  const monthlyPayment = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
  
  // Calculate eligibility score (0-100)
  let score = 70;
  
  // Credit history impact
  if (data.creditHistory === 'good') {
    score += 15;
  } else if (data.creditHistory === 'fair') {
    score += 5;
    riskFactors.push('Fair credit history may limit lender options');
    recommendations.push('Consider improving credit score before applying');
  } else if (data.creditHistory === 'poor') {
    score -= 20;
    riskFactors.push('Poor credit history - significant barrier to approval');
    recommendations.push('Work on credit repair for 6-12 months before applying');
  }
  
  // First-time buyer bonus
  if (data.firstTimeBuyer) {
    score += 5;
    recommendations.push('You may qualify for Help-to-Buy scheme (up to €30,000)');
  }
  
  // Debt-to-income ratio check
  const monthlyIncome = totalIncome / 12;
  const dtiRatio = data.monthlyCommitments / monthlyIncome;
  
  if (dtiRatio < 0.3) {
    score += 5;
  } else if (dtiRatio > 0.4) {
    score -= 10;
    riskFactors.push('High debt-to-income ratio');
    recommendations.push('Consider paying down existing debts before applying');
  }
  
  // Deposit adequacy
  if (data.depositAmount >= requiredDeposit) {
    score += 5;
    if (data.depositAmount >= data.propertyValue * 0.2) {
      score += 5;
      recommendations.push('Strong deposit - may qualify for better rates');
    }
  } else {
    score -= 15;
    riskFactors.push(`Deposit below required ${maxLTV}% LTV threshold`);
    recommendations.push(`You need €${Math.round(requiredDeposit - data.depositAmount).toLocaleString()} more deposit`);
  }
  
  // Residency status impact
  if (data.residencyStatus === 'other') {
    score -= 10;
    riskFactors.push('Non-standard residency status may limit options');
    recommendations.push('Some lenders have specific visa requirements');
  }
  
  // Employment stability
  if (data.employmentType === 'self-employed') {
    score -= 5;
    riskFactors.push('Self-employed applicants require 2-3 years accounts');
    recommendations.push('Ensure tax affairs are fully up to date');
  } else if (data.employmentType === 'contract') {
    score -= 3;
    riskFactors.push('Contract workers may face additional scrutiny');
  }
  
  // Cap score at 0-100
  score = Math.min(Math.max(score, 0), 100);
  
  // Determine eligibility (minimum 50%)
  const eligible = score >= 50;
  
  // Generate message
  let message: string;
  if (score >= 80) {
    message = 'Excellent eligibility - You should qualify with most lenders';
  } else if (score >= 60) {
    message = 'Good eligibility - Several lenders likely to approve';
  } else if (score >= 50) {
    message = 'Moderate eligibility - Some lenders may approve with conditions';
  } else {
    message = 'Below minimum eligibility threshold - See recommendations';
  }
  
  return {
    eligible,
    eligibilityScore: score,
    borrowingCapacityLow: borrowingLow,
    borrowingCapacityHigh: borrowingHigh,
    estimatedMonthlyPayment: monthlyPayment,
    maxLTV,
    incomeMultiple: baseMultiplier,
    message,
    riskFactors,
    recommendations,
  };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EligibilityRequest = await req.json();
    
    // Validate required fields
    if (!data.income1 || data.income1 <= 0) {
      return new Response(
        JSON.stringify({ error: "Valid income is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!data.propertyValue || data.propertyValue <= 0) {
      return new Response(
        JSON.stringify({ error: "Valid property value is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const result = evaluateEligibility(data);
    
    console.log("Eligibility check:", { 
      income: data.income1 + (data.income2 || 0),
      score: result.eligibilityScore,
      eligible: result.eligible 
    });
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Eligibility check error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to evaluate eligibility" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
