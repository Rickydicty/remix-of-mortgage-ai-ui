import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PreEligibility = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const calculateResults = () => {
    const income1 = parseFloat(formData.income1) || 0;
    const income2 = parseFloat(formData.income2) || 0;
    const totalIncome = income1 + income2;
    const commitments = parseFloat(formData.monthlyCommitments) || 0;
    const deposit = parseFloat(formData.depositAmount) || 0;
    
    // Simple calculation based on income multiplier
    const baseMultiplier = formData.firstTimeBuyer ? 4 : 3.5;
    const borrowingLow = Math.round(totalIncome * baseMultiplier * 0.9);
    const borrowingHigh = Math.round(totalIncome * baseMultiplier * 1.1);
    
    // Calculate monthly payment at 3.4% interest
    const loanAmount = (borrowingLow + borrowingHigh) / 2;
    const monthlyRate = 0.034 / 12;
    const numPayments = formData.desiredTerm[0] * 12;
    const monthlyPayment = Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    );
    
    // Calculate eligibility score
    let score = 70;
    if (formData.creditHistory === "good") score += 15;
    else if (formData.creditHistory === "fair") score += 5;
    if (formData.firstTimeBuyer) score += 5;
    if (commitments < totalIncome * 0.3 / 12) score += 5;
    if (deposit > parseFloat(formData.propertyValue) * 0.2) score += 5;
    score = Math.min(score, 100);
    
    return { borrowingLow, borrowingHigh, monthlyPayment, eligibilityScore: score };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to submit");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const results = calculateResults();
      
      const { error } = await supabase
        .from('pre_eligibility_data')
        .insert({
          user_id: user.id,
          applicant_type: formData.applicantType,
          employment_type: formData.employmentType,
          income_1: parseFloat(formData.income1) || 0,
          income_2: formData.income2 ? parseFloat(formData.income2) : null,
          monthly_commitments: parseFloat(formData.monthlyCommitments) || 0,
          deposit_amount: parseFloat(formData.depositAmount) || 0,
          property_value: parseFloat(formData.propertyValue) || 0,
          residency_status: formData.residencyStatus,
          credit_history: formData.creditHistory,
          first_time_buyer: formData.firstTimeBuyer,
          desired_term: formData.desiredTerm[0],
          phone: formData.phone || null,
          email: formData.email || null,
          borrowing_capacity_low: results.borrowingLow,
          borrowing_capacity_high: results.borrowingHigh,
          estimated_monthly_payment: results.monthlyPayment,
          eligibility_score: results.eligibilityScore,
        });
      
      if (error) throw error;
      
      setCalculatedResults(results);
      setShowResults(true);
      toast.success("Your eligibility data has been saved!");
    } catch (error: any) {
      console.error("Error saving pre-eligibility data:", error);
      toast.error("Failed to save your data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <div className="text-5xl font-bold text-success">{calculatedResults.eligibilityScore}%</div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success"
                      style={{ width: `${calculatedResults.eligibilityScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {calculatedResults.eligibilityScore >= 80 
                      ? "Strong eligibility - You're likely to be approved by multiple lenders"
                      : calculatedResults.eligibilityScore >= 60
                      ? "Good eligibility - Several lenders may approve your application"
                      : "Moderate eligibility - Consider improving your credit profile"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
            <Button size="lg" onClick={() => navigate("/dashboard/client")}>
              <TrendingUp className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Continue to your dashboard to complete your mortgage application
            </p>
          </div>
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
          <Button variant="outline" onClick={() => navigate("/dashboard/client")}>
            Go to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Check Your Eligibility</h1>
          <p className="text-xl text-muted-foreground">
            Get an instant mortgage quote in under 5 minutes
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
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="adverse">Adverse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <Label htmlFor="firstTimeBuyer" className="text-base font-medium">
                    First Time Buyer?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Check if this is your first property purchase
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

              <div className="space-y-4">
                <Label>Desired Term: {formData.desiredTerm[0]} years</Label>
                <Slider
                  value={formData.desiredTerm}
                  onValueChange={(value) =>
                    setFormData({ ...formData, desiredTerm: value })
                  }
                  min={5}
                  max={35}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 years</span>
                  <span>35 years</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+353 XXX XXXX"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Get My Quote
                    <ArrowRight className="ml-2 h-5 w-5" />
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