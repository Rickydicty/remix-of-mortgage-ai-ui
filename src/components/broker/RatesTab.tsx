import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const BrokerRatesTab = () => {
  // Mortgage Rates filters
  const [rateType, setRateType] = useState("variable");
  const [loanTerm, setLoanTerm] = useState("25");
  const [interestOnly, setInterestOnly] = useState("both");
  const [businessType, setBusinessType] = useState("both");
  const [lender, setLender] = useState("all");
  const [loanType, setLoanType] = useState("residential");
  const [loanAmount, setLoanAmount] = useState("250000");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [preparedFor, setPreparedFor] = useState("");

  // Repayment Calculator
  const [calcLoanAmount, setCalcLoanAmount] = useState("");
  const [calcTerm, setCalcTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("annuity");
  const [annualRate, setAnnualRate] = useState("");
  const [discountPeriod, setDiscountPeriod] = useState("");
  const [discountRate, setDiscountRate] = useState("");
  const [interestOnlyPeriod, setInterestOnlyPeriod] = useState("");
  const [calculatedResult, setCalculatedResult] = useState<number | null>(null);

  // Mock mortgage rates data
  const mockRates = [
    { lender: "Avant Money", loanType: "Variable (<=80% LTV (Flex Mortgage))", ltv: "80", apr: "3.16", rate: "3.09", cpt: "4.79", cost: "1,198", date: "10-11-25", intrOnly: "N" },
    { lender: "Avant Money", loanType: "Variable (>80% LTV (Flex Mortgage))", ltv: "90", apr: "3.36", rate: "3.29", cpt: "4.89", cost: "1,223", date: "10-11-25", intrOnly: "N" },
    { lender: "AIB", loanType: "Variable (LTV <=50%)", ltv: "50", apr: "3.83", rate: "3.75", cpt: "5.14", cost: "1,285", date: "24-10-25", intrOnly: "N" },
    { lender: "EBS", loanType: "Variable (LTV <=50%)", ltv: "50", apr: "3.90", rate: "3.75", cpt: "5.14", cost: "1,285", date: "24-10-25", intrOnly: "N" },
    { lender: "Haven", loanType: "Variable (LTV <=50%)", ltv: "50", apr: "3.90", rate: "3.75", cpt: "5.14", cost: "1,285", date: "24-10-25", intrOnly: "N" },
    { lender: "AIB", loanType: "Variable (LTV >50% <=80%)", ltv: "80", apr: "4.04", rate: "3.95", cpt: "5.25", cost: "1,313", date: "24-10-25", intrOnly: "N" },
    { lender: "EBS", loanType: "Variable (LTV >50% <=80%)", ltv: "80", apr: "4.10", rate: "3.95", cpt: "5.25", cost: "1,313", date: "24-10-25", intrOnly: "N" },
    { lender: "Haven", loanType: "Variable (LTV >50% <=80%)", ltv: "80", apr: "4.10", rate: "3.95", cpt: "5.25", cost: "1,313", date: "24-10-25", intrOnly: "N" },
  ];

  const calculateRepayment = () => {
    if (!calcLoanAmount || !calcTerm || !annualRate) return;
    
    const principal = parseFloat(calcLoanAmount);
    const years = parseFloat(calcTerm);
    const rate = parseFloat(annualRate) / 100 / 12;
    const payments = years * 12;
    
    if (paymentMethod === "annuity") {
      const monthlyPayment = principal * (rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1);
      setCalculatedResult(monthlyPayment);
    } else {
      const monthlyPayment = principal * rate;
      setCalculatedResult(monthlyPayment);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rates">Mortgage Rates</TabsTrigger>
          <TabsTrigger value="calculator">Repayment Calculator</TabsTrigger>
          <TabsTrigger value="consolidated">Consolidated Loans</TabsTrigger>
        </TabsList>

        {/* Mortgage Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Mortgage Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rateType">Rate Type</Label>
                  <Select value={rateType} onValueChange={setRateType}>
                    <SelectTrigger id="rateType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="variable">Variable</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loanTerm">Loan Term</Label>
                  <Select value={loanTerm} onValueChange={setLoanTerm}>
                    <SelectTrigger id="loanTerm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Years</SelectItem>
                      <SelectItem value="15">15 Years</SelectItem>
                      <SelectItem value="20">20 Years</SelectItem>
                      <SelectItem value="25">25 Years</SelectItem>
                      <SelectItem value="30">30 Years</SelectItem>
                      <SelectItem value="35">35 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestOnly">Interest Only</Label>
                  <Select value={interestOnly} onValueChange={setInterestOnly}>
                    <SelectTrigger id="interestOnly">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger id="businessType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner-occupied">Owner Occupied</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lender">Lender</Label>
                  <Select value={lender} onValueChange={setLender}>
                    <SelectTrigger id="lender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="avant">Avant Money</SelectItem>
                      <SelectItem value="aib">AIB</SelectItem>
                      <SelectItem value="ebs">EBS</SelectItem>
                      <SelectItem value="haven">Haven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loanType">Loan Type</Label>
                  <Select value={loanType} onValueChange={setLoanType}>
                    <SelectTrigger id="loanType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="250000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="preparedFor">Prepared For</Label>
                  <Input
                    id="preparedFor"
                    value={preparedFor}
                    onChange={(e) => setPreparedFor(e.target.value)}
                    placeholder="Client name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lender</TableHead>
                      <TableHead>Loan Type</TableHead>
                      <TableHead>LTV</TableHead>
                      <TableHead>APR</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>CPT</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Intr Only</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockRates.map((rate, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{rate.lender}</TableCell>
                        <TableCell>{rate.loanType}</TableCell>
                        <TableCell>{rate.ltv}</TableCell>
                        <TableCell>{rate.apr}</TableCell>
                        <TableCell className="font-bold text-primary">{rate.rate}</TableCell>
                        <TableCell>{rate.cpt}</TableCell>
                        <TableCell>{rate.cost}</TableCell>
                        <TableCell>{rate.date}</TableCell>
                        <TableCell>{rate.intrOnly}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Repayment Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Repayment Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="calcLoanAmount">Loan Amount</Label>
                  <Input
                    id="calcLoanAmount"
                    type="number"
                    value={calcLoanAmount}
                    onChange={(e) => setCalcLoanAmount(e.target.value)}
                    placeholder="Enter loan amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calcTerm">Term [years]</Label>
                  <Input
                    id="calcTerm"
                    type="number"
                    value={calcTerm}
                    onChange={(e) => setCalcTerm(e.target.value)}
                    placeholder="Enter term in years"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="annuity" id="annuity" />
                        <Label htmlFor="annuity" className="font-normal">Annuity</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="interest-only" id="interest-only" />
                        <Label htmlFor="interest-only" className="font-normal">Interest Only</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annualRate">Annual Rate [%]</Label>
                  <Input
                    id="annualRate"
                    type="number"
                    step="0.01"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    placeholder="Enter annual rate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPeriod">Discount Period [months]</Label>
                  <Input
                    id="discountPeriod"
                    type="number"
                    value={discountPeriod}
                    onChange={(e) => setDiscountPeriod(e.target.value)}
                    placeholder="Enter discount period"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountRate">Discount Rate [%]</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    step="0.01"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    placeholder="Enter discount rate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestOnlyPeriod">Interest Only Period [months]</Label>
                  <Input
                    id="interestOnlyPeriod"
                    type="number"
                    value={interestOnlyPeriod}
                    onChange={(e) => setInterestOnlyPeriod(e.target.value)}
                    placeholder="Enter interest only period"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Button onClick={calculateRepayment} size="lg">
                  Calculate
                </Button>
              </div>

              {calculatedResult && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Estimated Monthly Payment</p>
                  <p className="text-3xl font-bold text-primary">
                    €{calculatedResult.toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consolidated Loans Tab */}
        <TabsContent value="consolidated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consolidated Loans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicantName">Applicant name</Label>
                  <Input id="applicantName" placeholder="Enter applicant name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicantAddress">Applicant address</Label>
                  <Input id="applicantAddress" placeholder="Enter applicant address" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Existing loans to be consolidated</h3>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Detail</TableHead>
                        <TableHead>Amount remaining</TableHead>
                        <TableHead>Monthly payment</TableHead>
                        <TableHead>Interest rate [%]</TableHead>
                        <TableHead>Term remaining [months]</TableHead>
                        <TableHead>Cost of credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Total:</TableCell>
                        <TableCell>70.00</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>70.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">New mortgage details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" placeholder="Enter description" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consolidatedLoanAmount">Loan Amount</Label>
                    <Input id="consolidatedLoanAmount" type="number" placeholder="Enter amount" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consolidatedAPR">APR [%]</Label>
                    <Input id="consolidatedAPR" type="number" step="0.01" placeholder="Enter APR" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consolidatedTerm">Term [years]</Label>
                    <Input id="consolidatedTerm" type="number" placeholder="Enter term" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total repaid:</p>
                    <p className="text-lg font-semibold">-</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Cost of credit:</p>
                    <p className="text-lg font-semibold">-</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="default">Calculate cost</Button>
                  <Button variant="outline">Print</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerRatesTab;
