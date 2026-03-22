import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, TrendingUp, Loader2, XCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const MIN_ELIGIBILITY_SCORE = 50;

const PreEligibility = () => {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedResults, setCalculatedResults] = useState({
    borrowingLow: 0,
    borrowingHigh: 0,
    monthlyPayment: 0,
    eligibilityScore: 0,
  });
  const [formData, setFormData] = useState({
    applicantType: "",
    employmentType: "",
    income1: "",
    income2: "",
    monthlyCommitments: "",
    depositAmount: "",
    propertyValue: "",
    residencyStatus: "",
    creditHistory: "",
    firstTimeBuyer: false,
    desiredTerm: [25],
    phone: "",
    email: "",
  });

  const [backendResult, setBackendResult] = useState<{
    riskFactors: string[];
    recommendations: string[];
  } | null>(null);

  const checkEligibilityBackend = async () => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase.functions.invoke('mortgage-eligibility', {
        body: {
          income1: parseFloat(formData.income1) || 0,
          income2: formData.income2 ? parseFloat(formData.income2) : undefined,
          creditHistory: formData.creditHistory || 'fair',
          monthlyCommitments: parseFloat(formData.monthlyCommitments) || 0,
          depositAmount: parseFloat(formData.depositAmount) || 0,
          propertyValue: parseFloat(formData.propertyValue) || 0,
          firstTimeBuyer: formData.firstTimeBuyer,
          desiredTerm: formData.desiredTerm[0],
          residencyStatus: formData.residencyStatus || 'citizen',
          employmentType: formData.employmentType || 'paye',
        }
      });

      if (error) throw error;
      
      return {
        borrowingLow: data.borrowingCapacityLow,
        borrowingHigh: data.borrowingCapacityHigh,
        monthlyPayment: data.estimatedMonthlyPayment,
        eligibilityScore: data.eligibilityScore,
        riskFactors: data.riskFactors || [],
        recommendations: data.recommendations || [],
      };
    } catch (error) {
      console.error("Backend eligibility check failed, using fallback:", error);
      // Fallback to local calculation
      return calculateResultsFallback();
    }
  };

  const calculateResultsFallback = () => {
    const income1 = parseFloat(formData.income1) || 0;
    const income2 = parseFloat(formData.income2) || 0;
    const totalIncome = income1 + income2;
    const commitments = parseFloat(formData.monthlyCommitments) || 0;
    const deposit = parseFloat(formData.depositAmount) || 0;
    
    const baseMultiplier = formData.firstTimeBuyer ? 4 : 3.5;
    const borrowingLow = Math.round(totalIncome * baseMultiplier * 0.9);
    const borrowingHigh = Math.round(totalIncome * baseMultiplier * 1.1);
    
    const loanAmount = (borrowingLow + borrowingHigh) / 2;
    const monthlyRate = 0.034 / 12;
    const numPayments = formData.desiredTerm[0] * 12;
    const monthlyPayment = Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    );
    
    let score = 70;
    if (formData.creditHistory === "good") score += 15;
    else if (formData.creditHistory === "fair") score += 5;
    else if (formData.creditHistory === "poor") score -= 20;
    if (formData.firstTimeBuyer) score += 5;
    if (commitments < totalIncome * 0.3 / 12) score += 5;
    if (deposit > parseFloat(formData.propertyValue) * 0.2) score += 5;
    if (formData.residencyStatus === "other") score -= 10;
    score = Math.min(Math.max(score, 0), 100);
    
    return { 
      borrowingLow, 
      borrowingHigh, 
      monthlyPayment, 
      eligibilityScore: score,
      riskFactors: [],
      recommendations: [],
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call backend API for eligibility check
      const results = await checkEligibilityBackend();
      
      // Store eligibility data in localStorage for use after signup
      const eligibilityData = {
        applicantType: formData.applicantType,
        employmentType: formData.employmentType,
        income1: parseFloat(formData.income1) || 0,
        income2: formData.income2 ? parseFloat(formData.income2) : null,
        monthlyCommitments: parseFloat(formData.monthlyCommitments) || 0,
        depositAmount: parseFloat(formData.depositAmount) || 0,
        propertyValue: parseFloat(formData.propertyValue) || 0,
        residencyStatus: formData.residencyStatus,
        creditHistory: formData.creditHistory,
        firstTimeBuyer: formData.firstTimeBuyer,
        desiredTerm: formData.desiredTerm[0],
        phone: formData.phone || null,
        email: formData.email || null,
        borrowingCapacityLow: results.borrowingLow,
        borrowingCapacityHigh: results.borrowingHigh,
        estimatedMonthlyPayment: results.monthlyPayment,
        eligibilityScore: results.eligibilityScore,
      };
      
      localStorage.setItem('pendingEligibilityData', JSON.stringify(eligibilityData));
      
      setCalculatedResults({
        borrowingLow: results.borrowingLow,
        borrowingHigh: results.borrowingHigh,
        monthlyPayment: results.monthlyPayment,
        eligibilityScore: results.eligibilityScore,
      });
      setBackendResult({
        riskFactors: results.riskFactors,
        recommendations: results.recommendations,
      });
      setShowResults(true);

      // Send signup email if eligible and email was provided
      if (results.eligibilityScore >= MIN_ELIGIBILITY_SCORE && formData.email) {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          const signupUrl = `${window.location.origin}/signup/client`;
          await supabase.functions.invoke('send-notification', {
            body: {
              notification_type: 'eligibility_signup_invite',
              recipient_email: formData.email,
              subject: 'Great news! You\'re eligible — Complete your sign up',
              html_content: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
                  </div>
                  <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px; color: #333;">You've passed our eligibility check with a score of <strong>${results.eligibilityScore}%</strong>!</p>
                    <p style="font-size: 14px; color: #666;">Your estimated borrowing capacity is <strong>€${results.borrowingLow.toLocaleString()} - €${results.borrowingHigh.toLocaleString()}</strong>.</p>
                    <p style="font-size: 14px; color: #666;">Complete your registration to start your mortgage application with a dedicated broker.</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${signupUrl}" style="background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                        Complete Your Sign Up →
                      </a>
                    </div>
                    <p style="font-size: 12px; color: #999; text-align: center;">
                      If you didn't request this, please ignore this email.
                    </p>
                  </div>
                </div>
              `,
            },
          });
          toast.success("We've sent a sign-up link to your email!");
        } catch (emailError) {
          console.error("Failed to send signup email:", emailError);
        }
      }
    } catch (error: any) {
      console.error("Error calculating eligibility:", error);
      toast.error("Failed to calculate eligibility. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEligible = calculatedResults.eligibilityScore >= MIN_ELIGIBILITY_SCORE;

  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">AI Mortgage Platform</span>
            </div>
            <Button variant="ghost" onClick={() => setShowResults(false)}>
              Back to Form
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Your Mortgage Quote</h1>
            <p className="text-xl text-muted-foreground">
              Based on your information, here's what we found
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Borrowing Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">
                  €{calculatedResults.borrowingLow.toLocaleString()} - €{calculatedResults.borrowingHigh.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Estimated range based on your income and commitments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Repayment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">
                  €{calculatedResults.monthlyPayment.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Approximate monthly payment at 3.4% over {formData.desiredTerm[0]} years
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Eligibility Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className={`text-5xl font-bold ${isEligible ? 'text-success' : 'text-destructive'}`}>
                  {calculatedResults.eligibilityScore}%
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isEligible ? 'bg-success' : 'bg-destructive'}`}
                      style={{ width: `${calculatedResults.eligibilityScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {calculatedResults.eligibilityScore >= 80 
                      ? "Strong eligibility - You're likely to be approved by multiple lenders"
                      : calculatedResults.eligibilityScore >= 60
                      ? "Good eligibility - Several lenders may approve your application"
                      : calculatedResults.eligibilityScore >= MIN_ELIGIBILITY_SCORE
                      ? "Moderate eligibility - Some lenders may consider your application"
                      : "Unfortunately, you don't meet the minimum eligibility requirements at this time"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors & Recommendations from Backend */}
          {backendResult && (backendResult.riskFactors.length > 0 || backendResult.recommendations.length > 0) && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {backendResult.riskFactors.length > 0 && (
                <Card className="border-warning/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {backendResult.riskFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-warning mt-1">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {backendResult.recommendations.length > 0 && (
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Lightbulb className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {backendResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-1">✓</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {isEligible ? (
            <>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Top Lender Matches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      name: "Bank of Ireland",
                      rate: "3.1%",
                      match: "95%",
                      notes: "Best rate for first-time buyers, flexible overpayments",
                    },
                    {
                      name: "AIB",
                      rate: "3.3%",
                      match: "92%",
                      notes: "Green mortgage discount available, fast processing",
                    },
                    {
                      name: "Haven",
                      rate: "3.5%",
                      match: "88%",
                      notes: "Competitive for high LTV, excellent customer service",
                    },
                  ].map((lender) => (
                    <div
                      key={lender.name}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{lender.name}</h3>
                        <p className="text-sm text-muted-foreground">{lender.notes}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{lender.rate}</div>
                        <div className="text-sm text-success font-medium">{lender.match} Match</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="text-center">
                {formData.email ? (
                  <>
                    <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg inline-block">
                      <p className="text-success font-medium">✉️ A sign-up link has been sent to {formData.email}</p>
                      <p className="text-sm text-muted-foreground mt-1">Check your inbox to complete registration</p>
                    </div>
                    <div>
                      <Button size="lg" variant="outline" onClick={() => navigate("/signup/client")}>
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Or Sign Up Here Directly
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button size="lg" onClick={() => navigate("/signup/client")}>
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Continue to Sign Up
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Create your account to start your mortgage application
                    </p>
                  </>
                )}
              </div>
            </>
          ) : (
            <Card className="mb-8 border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-6 w-6" />
                  Not Eligible at This Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Based on the information provided, you don't currently meet our minimum eligibility requirements. 
                  This could be due to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Credit history concerns</li>
                  <li>High debt-to-income ratio</li>
                  <li>Insufficient deposit amount</li>
                  <li>Residency/visa status requirements</li>
                </ul>
                <p className="text-muted-foreground">
                  We recommend speaking with a financial advisor to improve your eligibility before applying.
                </p>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setShowResults(false)}>
                    Update Information
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Return Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">AI Mortgage Platform</span>
          </div>
          <Button variant="outline" onClick={() => navigate("/login")}>
            Already have an account? Sign In
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Check Your Eligibility</h1>
          <p className="text-xl text-muted-foreground">
            Get an instant mortgage quote in under 5 minutes
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Complete this form to see if you qualify before creating an account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>
              All fields are required unless marked optional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="applicantType">Applicant Type</Label>
                  <Select
                    value={formData.applicantType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, applicantType: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="joint">Joint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, employmentType: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paye">PAYE</SelectItem>
                      <SelectItem value="self-employed">Self-employed</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="income1">Gross Annual Income (Applicant 1)</Label>
                  <Input
                    id="income1"
                    type="number"
                    placeholder="€50,000"
                    value={formData.income1}
                    onChange={(e) =>
                      setFormData({ ...formData, income1: e.target.value })
                    }
                    required
                  />
                </div>

                {formData.applicantType === "joint" && (
                  <div className="space-y-2">
                    <Label htmlFor="income2">Gross Annual Income (Applicant 2)</Label>
                    <Input
                      id="income2"
                      type="number"
                      placeholder="€45,000"
                      value={formData.income2}
                      onChange={(e) =>
                        setFormData({ ...formData, income2: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyCommitments">Monthly Commitments (€)</Label>
                <Input
                  id="monthlyCommitments"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.monthlyCommitments}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyCommitments: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include loans, credit cards, rent, etc.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount (€)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="€50,000"
                    value={formData.depositAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, depositAmount: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyValue">Property Value (€)</Label>
                  <Input
                    id="propertyValue"
                    type="number"
                    placeholder="€350,000"
                    value={formData.propertyValue}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyValue: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="residencyStatus">Residency/Visa Status</Label>
                  <Select
                    value={formData.residencyStatus}
                    onValueChange={(value) =>
                      setFormData({ ...formData, residencyStatus: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">Citizen</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                      <SelectItem value="work-permit">Work Permit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditHistory">Credit History</Label>
                  <Select
                    value={formData.creditHistory}
                    onValueChange={(value) =>
                      setFormData({ ...formData, creditHistory: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Mortgage Term: {formData.desiredTerm[0]} years</Label>
                <Slider
                  value={formData.desiredTerm}
                  onValueChange={(value) =>
                    setFormData({ ...formData, desiredTerm: value })
                  }
                  max={35}
                  min={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 years</span>
                  <span>35 years</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <Label htmlFor="firstTimeBuyer" className="font-medium">
                    First Time Buyer
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    First-time buyers may qualify for higher borrowing limits
                  </p>
                </div>
                <Switch
                  id="firstTimeBuyer"
                  checked={formData.firstTimeBuyer}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, firstTimeBuyer: checked })
                  }
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+353 123 456 789"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    Check My Eligibility
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreEligibility;
