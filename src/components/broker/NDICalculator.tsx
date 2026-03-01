import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Calculator, AlertTriangle } from "lucide-react";

const NDICalculator = () => {
  // Property & Mortgage Details
  const [propertyValue, setPropertyValue] = useState<number>(0);
  const [mortgageRequested, setMortgageRequested] = useState<number>(0);
  const [termYears, setTermYears] = useState<number>(25);
  const [interestRate, setInterestRate] = useState<number>(4.25);
  const [paymentType, setPaymentType] = useState<string>("repayment");
  const [borrowerType, setBorrowerType] = useState<string>("individual");
  const [county, setCounty] = useState<string>("");

  // BTL Income (for investment properties)
  const [monthlyRent, setMonthlyRent] = useState<number>(0);

  // Applicant Income
  const [applicantStatus, setApplicantStatus] = useState<string>("single");
  const [numberOfChildren, setNumberOfChildren] = useState<number>(0);
  const [netMonthlySalary1, setNetMonthlySalary1] = useState<number>(0);
  const [otherNetIncome1, setOtherNetIncome1] = useState<number>(0);
  const [netMonthlySalary2, setNetMonthlySalary2] = useState<number>(0);
  const [otherNetIncome2, setOtherNetIncome2] = useState<number>(0);

  // Monthly Commitments
  const [maintenancePayments, setMaintenancePayments] = useState<number>(0);
  const [carLoans, setCarLoans] = useState<number>(0);
  const [hpLeases, setHpLeases] = useState<number>(0);
  const [otherCommitments, setOtherCommitments] = useState<number>(0);
  const [creditCardDebt, setCreditCardDebt] = useState<number>(0);

  // Other Mortgages
  const [otherMortgagePayments, setOtherMortgagePayments] = useState<number>(0);

  // Constants
  const STRESS_RATE_ADDITION = 2; // +2% for stress testing
  const RENT_MULTIPLIER = 1.2; // Net rent >= 1.2x mortgage payment for BTL
  const ASSUMED_RENT_RETENTION = 0.80; // 80% of gross rent assumed as net

  // Check if user has entered meaningful data
  const hasUserInput = useMemo(() => {
    return propertyValue > 0 || mortgageRequested > 0 || netMonthlySalary1 > 0 || monthlyRent > 0;
  }, [propertyValue, mortgageRequested, netMonthlySalary1, monthlyRent]);

  // Calculations
  const calculations = useMemo(() => {
    // LTV Calculation
    const ltv = propertyValue > 0 ? (mortgageRequested / propertyValue) * 100 : 0;
    const maxLoanAvailable = propertyValue * 0.9;

    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = termYears * 12;
    
    let monthlyMortgagePayment = 0;
    if (paymentType === "interest_only") {
      monthlyMortgagePayment = mortgageRequested * monthlyRate;
    } else {
      if (monthlyRate > 0 && totalPayments > 0) {
        monthlyMortgagePayment = mortgageRequested * 
          (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
          (Math.pow(1 + monthlyRate, totalPayments) - 1);
      }
    }

    const stressedRate = (interestRate + STRESS_RATE_ADDITION) / 100 / 12;
    let stressedMortgagePayment = 0;
    if (paymentType === "interest_only") {
      stressedMortgagePayment = mortgageRequested * stressedRate;
    } else {
      if (stressedRate > 0 && totalPayments > 0) {
        stressedMortgagePayment = mortgageRequested * 
          (stressedRate * Math.pow(1 + stressedRate, totalPayments)) / 
          (Math.pow(1 + stressedRate, totalPayments) - 1);
      }
    }

    const assumedNetRent = monthlyRent * ASSUMED_RENT_RETENTION;
    const rentCoverageRequired = monthlyMortgagePayment * RENT_MULTIPLIER;
    const stressTest1Pass = assumedNetRent >= rentCoverageRequired;
    const stressTest2Pass = assumedNetRent >= stressedMortgagePayment;

    const baseLivingExpense = applicantStatus === "joint" ? 1500 : 1000;
    const childExpense = numberOfChildren * 300;
    const totalLivingExpenses = baseLivingExpense + childExpense;

    const totalNetIncome = netMonthlySalary1 + otherNetIncome1 + netMonthlySalary2 + otherNetIncome2;

    const creditCardMonthly = creditCardDebt * 0.10;
    const totalCommitments = maintenancePayments + carLoans + hpLeases + otherCommitments + creditCardMonthly + otherMortgagePayments;

    const ndi = totalNetIncome - totalLivingExpenses - totalCommitments - stressedMortgagePayment;

    const dscr = monthlyMortgagePayment > 0 ? assumedNetRent / monthlyMortgagePayment : 0;

    const ltvPass = ltv <= 90;
    const loanPass = mortgageRequested <= maxLoanAvailable;
    const ndiPass = ndi >= 0;
    const overallPass = ltvPass && loanPass && (borrowerType === "btl" ? (stressTest1Pass && stressTest2Pass) : ndiPass);

    return {
      ltv, maxLoanAvailable, monthlyMortgagePayment, stressedMortgagePayment,
      assumedNetRent, rentCoverageRequired, stressTest1Pass, stressTest2Pass,
      totalLivingExpenses, totalNetIncome, totalCommitments, creditCardMonthly,
      ndi, dscr, ltvPass, loanPass, ndiPass, overallPass,
      stressedRate: interestRate + STRESS_RATE_ADDITION
    };
  }, [
    propertyValue, mortgageRequested, termYears, interestRate, paymentType,
    borrowerType, monthlyRent, applicantStatus, numberOfChildren,
    netMonthlySalary1, otherNetIncome1, netMonthlySalary2, otherNetIncome2,
    maintenancePayments, carLoans, hpLeases, otherCommitments, creditCardDebt,
    otherMortgagePayments
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const ResultBadge = ({ pass, label }: { pass: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {pass ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" />
      )}
      <span className={pass ? "text-success" : "text-destructive"}>{label}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">NDI Calculator</h3>
        <Badge variant="outline">v2.18</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property & Mortgage Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property & Mortgage Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Borrower Type</Label>
                  <Select value={borrowerType} onValueChange={setBorrowerType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual (PDH)</SelectItem>
                      <SelectItem value="btl">Buy-to-Let (BTL)</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>County</Label>
                  <Select value={county} onValueChange={setCounty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dublin">Dublin</SelectItem>
                      <SelectItem value="cork">Cork</SelectItem>
                      <SelectItem value="galway">Galway</SelectItem>
                      <SelectItem value="limerick">Limerick</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Market Value of Property (€)</Label>
                  <Input
                    type="number"
                    value={propertyValue || ""}
                    onChange={(e) => setPropertyValue(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mortgage Requested (€)</Label>
                  <Input
                    type="number"
                    value={mortgageRequested || ""}
                    onChange={(e) => setMortgageRequested(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Term (Years)</Label>
                  <Input
                    type="number"
                    value={termYears || ""}
                    onChange={(e) => setTermYears(Number(e.target.value))}
                    placeholder="25"
                    min={5}
                    max={35}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={interestRate || ""}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    placeholder="4.25"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="repayment">Repayment (Annuity)</SelectItem>
                      <SelectItem value="interest_only">Interest Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {borrowerType === "btl" && (
                  <div className="space-y-2">
                    <Label>Monthly Gross Rent (€)</Label>
                    <Input
                      type="number"
                      value={monthlyRent || ""}
                      onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Income Section - Only for Individual/Company */}
          {borrowerType !== "btl" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Income Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Applicant Status</Label>
                    <Select value={applicantStatus} onValueChange={setApplicantStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="joint">Joint Application</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Children</Label>
                    <Input
                      type="number"
                      value={numberOfChildren || ""}
                      onChange={(e) => setNumberOfChildren(Number(e.target.value))}
                      placeholder="0"
                      min={0}
                    />
                  </div>
                </div>

                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Applicant 1</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Net Monthly Salary (€)</Label>
                    <Input
                      type="number"
                      value={netMonthlySalary1 || ""}
                      onChange={(e) => setNetMonthlySalary1(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Other Net Monthly Income (€)</Label>
                    <Input
                      type="number"
                      value={otherNetIncome1 || ""}
                      onChange={(e) => setOtherNetIncome1(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {applicantStatus === "joint" && (
                  <>
                    <Separator />
                    <p className="text-sm font-medium text-muted-foreground">Applicant 2</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Net Monthly Salary (€)</Label>
                        <Input
                          type="number"
                          value={netMonthlySalary2 || ""}
                          onChange={(e) => setNetMonthlySalary2(Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Other Net Monthly Income (€)</Label>
                        <Input
                          type="number"
                          value={otherNetIncome2 || ""}
                          onChange={(e) => setOtherNetIncome2(Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Commitments Section */}
          {borrowerType !== "btl" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Commitments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maintenance Payments (€)</Label>
                    <Input
                      type="number"
                      value={maintenancePayments || ""}
                      onChange={(e) => setMaintenancePayments(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Car Loans (€)</Label>
                    <Input
                      type="number"
                      value={carLoans || ""}
                      onChange={(e) => setCarLoans(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>HP/Leases (€)</Label>
                    <Input
                      type="number"
                      value={hpLeases || ""}
                      onChange={(e) => setHpLeases(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Other Commitments (€)</Label>
                    <Input
                      type="number"
                      value={otherCommitments || ""}
                      onChange={(e) => setOtherCommitments(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credit Card Balance (€)</Label>
                    <Input
                      type="number"
                      value={creditCardDebt || ""}
                      onChange={(e) => setCreditCardDebt(Number(e.target.value))}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">10% used for stress testing</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Other Mortgage Payments (€)</Label>
                    <Input
                      type="number"
                      value={otherMortgagePayments || ""}
                      onChange={(e) => setOtherMortgagePayments(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="space-y-4">
          {/* Overall Result - only show when user has entered data */}
          {hasUserInput ? (
            <Card className={calculations.overallPass ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  {calculations.overallPass ? (
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  ) : (
                    <XCircle className="h-8 w-8 text-destructive" />
                  )}
                  <span className={`text-2xl font-bold ${calculations.overallPass ? "text-success" : "text-destructive"}`}>
                    {calculations.overallPass ? "PASS" : "FAIL"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-muted/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calculator className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Enter property and income details to see your result</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">LTV</span>
                <span className="font-semibold">{calculations.ltv.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Loan Available</span>
                <span className="font-semibold">{formatCurrency(calculations.maxLoanAvailable)}</span>
              </div>
              <Separator />
              <ResultBadge pass={calculations.ltvPass} label={calculations.ltvPass ? "LTV Pass" : "LTV Exceeds 90%"} />
              <ResultBadge pass={calculations.loanPass} label={calculations.loanPass ? "Loan Amount OK" : "Loan Exceeds Max"} />
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Payment</span>
                <span className="font-semibold">{formatCurrency(calculations.monthlyMortgagePayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stressed Rate (+2%)</span>
                <span className="font-semibold">{calculations.stressedRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stressed Payment</span>
                <span className="font-semibold">{formatCurrency(calculations.stressedMortgagePayment)}</span>
              </div>
            </CardContent>
          </Card>

          {/* BTL Stress Tests */}
          {borrowerType === "btl" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">BTL Stress Tests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assumed Net Rent (80%)</span>
                  <span className="font-semibold">{formatCurrency(calculations.assumedNetRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">1.2x Payment Required</span>
                  <span className="font-semibold">{formatCurrency(calculations.rentCoverageRequired)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DSCR</span>
                  <span className="font-semibold">{calculations.dscr.toFixed(2)}</span>
                </div>
                <Separator />
                <ResultBadge 
                  pass={calculations.stressTest1Pass} 
                  label={`Test 1: Net rent ≥ 1.2x payment`} 
                />
                <ResultBadge 
                  pass={calculations.stressTest2Pass} 
                  label={`Test 2: Net rent ≥ stressed payment`} 
                />
              </CardContent>
            </Card>
          )}

          {/* NDI Summary - For Individual */}
          {borrowerType !== "btl" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">NDI Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Net Income</span>
                  <span className="font-semibold">{formatCurrency(calculations.totalNetIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Living Expenses</span>
                  <span className="font-semibold text-destructive">-{formatCurrency(calculations.totalLivingExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Commitments</span>
                  <span className="font-semibold text-destructive">-{formatCurrency(calculations.totalCommitments)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stressed Mortgage</span>
                  <span className="font-semibold text-destructive">-{formatCurrency(calculations.stressedMortgagePayment)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Net Disposable Income</span>
                  <span className={`font-bold text-lg ${calculations.ndi >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(calculations.ndi)}
                  </span>
                </div>
                <ResultBadge pass={calculations.ndiPass} label={calculations.ndiPass ? "NDI Positive" : "NDI Negative"} />
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Strictly for broker use and illustrative purposes only. 
                  Final lending decisions are subject to full underwriting assessment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NDICalculator;
