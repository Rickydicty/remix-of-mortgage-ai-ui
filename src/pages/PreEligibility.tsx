import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, TrendingUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const PreEligibility = () => {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  if (showResults) {
    const borrowingLow = 250000;
    const borrowingHigh = 320000;
    const monthlyPayment = 1450;
    const eligibilityScore = 85;

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
                  €{borrowingLow.toLocaleString()} - €{borrowingHigh.toLocaleString()}
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
                  €{monthlyPayment.toLocaleString()}
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
                <div className="text-5xl font-bold text-success">{eligibilityScore}%</div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success"
                      style={{ width: `${eligibilityScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Strong eligibility - You're likely to be approved by multiple lenders
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
            <Button size="lg" onClick={() => navigate("/signup")}>
              <TrendingUp className="mr-2 h-5 w-5" />
              Start Full Application
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Create an account to continue with your mortgage application
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
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/signup")}>Sign Up</Button>
          </div>
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

              <Button type="submit" size="lg" className="w-full">
                Get My Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreEligibility;
