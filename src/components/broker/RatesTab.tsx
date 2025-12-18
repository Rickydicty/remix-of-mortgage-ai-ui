import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Search, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Irish mortgage rate data based on CCPC data
const mortgageRates = [
  { lender: "Avant Money", type: "Variable", ltv: 80, rate: 3.09, apr: 3.16, greenRate: true },
  { lender: "Avant Money", type: "Variable", ltv: 90, rate: 3.29, apr: 3.36, greenRate: true },
  { lender: "AIB", type: "Variable", ltv: 50, rate: 3.75, apr: 3.83, greenRate: false },
  { lender: "AIB", type: "Variable", ltv: 80, rate: 3.95, apr: 4.04, greenRate: false },
  { lender: "AIB", type: "Fixed 3yr", ltv: 80, rate: 3.55, apr: 3.65, greenRate: false },
  { lender: "AIB", type: "Green Fixed 4yr", ltv: 80, rate: 3.25, apr: 3.35, greenRate: true },
  { lender: "Bank of Ireland", type: "Variable", ltv: 80, rate: 3.70, apr: 3.85, greenRate: false },
  { lender: "Bank of Ireland", type: "Fixed 3yr", ltv: 80, rate: 3.50, apr: 3.62, greenRate: false },
  { lender: "Bank of Ireland", type: "Green Fixed 5yr", ltv: 80, rate: 3.15, apr: 3.25, greenRate: true },
  { lender: "EBS", type: "Variable", ltv: 80, rate: 3.95, apr: 4.10, greenRate: false },
  { lender: "EBS", type: "Fixed 2yr", ltv: 80, rate: 3.60, apr: 3.75, greenRate: false },
  { lender: "Haven", type: "Variable", ltv: 80, rate: 3.95, apr: 4.10, greenRate: false },
  { lender: "Haven", type: "Fixed 3yr", ltv: 80, rate: 3.55, apr: 3.68, greenRate: false },
  { lender: "PTSB", type: "Variable", ltv: 80, rate: 4.00, apr: 4.15, greenRate: false },
  { lender: "PTSB", type: "Fixed 3yr", ltv: 80, rate: 3.60, apr: 3.72, greenRate: false },
  { lender: "PTSB", type: "Green Fixed 4yr", ltv: 80, rate: 3.20, apr: 3.30, greenRate: true },
  { lender: "ICS Mortgages", type: "Variable", ltv: 80, rate: 4.15, apr: 4.35, greenRate: false },
  { lender: "Finance Ireland", type: "Fixed 3yr", ltv: 80, rate: 3.75, apr: 3.90, greenRate: false },
];

interface ValidationError {
  field: string;
  message: string;
}

interface SearchResult {
  lender: string;
  type: string;
  rate: number;
  apr: number;
  monthlyPayment: number;
  totalCost: number;
  greenRate: boolean;
}

const BrokerRatesTab = () => {
  // First Time Buyers state
  const [ftbHouseValue, setFtbHouseValue] = useState("");
  const [ftbMortgageAmount, setFtbMortgageAmount] = useState("");
  const [ftbTerm, setFtbTerm] = useState("");
  const [ftbBerRating, setFtbBerRating] = useState("");
  const [ftbErrors, setFtbErrors] = useState<ValidationError[]>([]);
  const [ftbResults, setFtbResults] = useState<SearchResult[]>([]);

  // Switchers state
  const [switcherHouseValue, setSwitcherHouseValue] = useState("");
  const [switcherOutstanding, setSwitcherOutstanding] = useState("");
  const [switcherTermRemaining, setSwitcherTermRemaining] = useState("");
  const [switcherMonthlyRepayment, setSwitcherMonthlyRepayment] = useState("");
  const [switcherBerRating, setSwitcherBerRating] = useState("");
  const [switcherErrors, setSwitcherErrors] = useState<ValidationError[]>([]);
  const [switcherResults, setSwitcherResults] = useState<SearchResult[]>([]);

  // Home Movers state
  const [moverNewHomeValue, setMoverNewHomeValue] = useState("");
  const [moverMortgageAmount, setMoverMortgageAmount] = useState("");
  const [moverTerm, setMoverTerm] = useState("");
  const [moverBerRating, setMoverBerRating] = useState("");
  const [moverErrors, setMoverErrors] = useState<ValidationError[]>([]);
  const [moverResults, setMoverResults] = useState<SearchResult[]>([]);

  const termOptions = [
    { value: "5", label: "5 Years" },
    { value: "10", label: "10 Years" },
    { value: "15", label: "15 Years" },
    { value: "20", label: "20 Years" },
    { value: "25", label: "25 Years" },
    { value: "30", label: "30 Years" },
    { value: "35", label: "35 Years" },
  ];

  const berRatingOptions = [
    { value: "A1", label: "A1", isGreen: true },
    { value: "A2", label: "A2", isGreen: true },
    { value: "A3", label: "A3", isGreen: true },
    { value: "B1", label: "B1", isGreen: true },
    { value: "B2", label: "B2", isGreen: true },
    { value: "B3", label: "B3", isGreen: true },
    { value: "C1", label: "C1", isGreen: false },
    { value: "C2", label: "C2", isGreen: false },
    { value: "C3", label: "C3", isGreen: false },
    { value: "D1", label: "D1", isGreen: false },
    { value: "D2", label: "D2", isGreen: false },
    { value: "E1", label: "E1", isGreen: false },
    { value: "E2", label: "E2", isGreen: false },
    { value: "F", label: "F", isGreen: false },
    { value: "G", label: "G", isGreen: false },
    { value: "exempt", label: "BER Exempt", isGreen: false },
  ];

  const isGreenBER = (ber: string): boolean => {
    return ["A1", "A2", "A3", "B1", "B2", "B3"].includes(ber);
  };

  const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    const payments = years * 12;
    if (monthlyRate === 0) return principal / payments;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);
  };

  const validateAndSearch = (
    type: 'ftb' | 'switcher' | 'mover',
    houseValue: string,
    mortgageAmount: string,
    term: string,
    berRating: string,
    isFirstTimeBuyer: boolean = false
  ) => {
    const errors: ValidationError[] = [];
    const house = parseFloat(houseValue) || 0;
    const mortgage = parseFloat(mortgageAmount) || 0;
    const years = parseInt(term) || 0;

    // Required field validation
    if (!houseValue) {
      errors.push({ field: 'houseValue', message: 'House value is required' });
    }
    if (!mortgageAmount) {
      errors.push({ field: 'mortgageAmount', message: 'Mortgage amount is required' });
    }
    if (!term) {
      errors.push({ field: 'term', message: 'Mortgage term is required' });
    }
    if (!berRating) {
      errors.push({ field: 'berRating', message: 'BER rating is required' });
    }

    // Value validation
    if (house > 0 && house < 50000) {
      errors.push({ field: 'houseValue', message: 'House value seems too low' });
    }
    if (mortgage > 0 && mortgage < 20000) {
      errors.push({ field: 'mortgageAmount', message: 'Mortgage amount seems too low (minimum €20,000)' });
    }

    // LTV validation
    if (house > 0 && mortgage > 0) {
      const ltv = (mortgage / house) * 100;
      const maxLTV = isFirstTimeBuyer ? 90 : 80;
      
      if (mortgage > house) {
        errors.push({ 
          field: 'mortgageAmount', 
          message: "LTV - You can't borrow more than the value of your home" 
        });
      } else if (ltv > maxLTV) {
        errors.push({ 
          field: 'mortgageAmount', 
          message: `LTV - Maximum ${maxLTV}% loan-to-value allowed${isFirstTimeBuyer ? ' for first time buyers' : ''}. Your LTV is ${ltv.toFixed(1)}%` 
        });
      }
    }

    // Term validation
    if (years > 0 && years < 5) {
      errors.push({ field: 'term', message: 'Minimum mortgage term is 5 years' });
    }
    if (years > 35) {
      errors.push({ field: 'term', message: 'Maximum mortgage term is 35 years' });
    }

    // Set errors based on type
    if (type === 'ftb') {
      setFtbErrors(errors);
      if (errors.length === 0) {
        const results = searchMortgages(mortgage, house, years, berRating);
        setFtbResults(results);
      } else {
        setFtbResults([]);
      }
    } else if (type === 'switcher') {
      setSwitcherErrors(errors);
      if (errors.length === 0) {
        const results = searchMortgages(mortgage, house, years, berRating);
        setSwitcherResults(results);
      } else {
        setSwitcherResults([]);
      }
    } else {
      setMoverErrors(errors);
      if (errors.length === 0) {
        const results = searchMortgages(mortgage, house, years, berRating);
        setMoverResults(results);
      } else {
        setMoverResults([]);
      }
    }
  };

  const searchMortgages = (mortgage: number, house: number, years: number, berRating: string): SearchResult[] => {
    const ltv = (mortgage / house) * 100;
    const isGreen = isGreenBER(berRating);

    // Filter rates by LTV
    const eligibleRates = mortgageRates.filter(rate => {
      if (ltv <= rate.ltv) {
        // If green BER, include green rates. Otherwise exclude green-only rates
        if (rate.greenRate && !isGreen) return false;
        return true;
      }
      return false;
    });

    // Calculate monthly payments and total costs
    const results: SearchResult[] = eligibleRates.map(rate => {
      const monthlyPayment = calculateMonthlyPayment(mortgage, rate.rate, years);
      const totalCost = monthlyPayment * years * 12;
      
      return {
        lender: rate.lender,
        type: rate.type,
        rate: rate.rate,
        apr: rate.apr,
        monthlyPayment,
        totalCost,
        greenRate: rate.greenRate,
      };
    });

    // Sort by rate
    return results.sort((a, b) => a.rate - b.rate);
  };

  const InfoTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-primary cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-popover text-popover-foreground">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const CurrencyInput = ({ 
    value, 
    onChange, 
    placeholder,
    hasError = false
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    placeholder: string;
    hasError?: boolean;
  }) => (
    <div className="relative flex items-center">
      <span className="absolute left-0 flex items-center justify-center w-10 h-full bg-primary text-primary-foreground rounded-l-md font-semibold text-sm">
        €
      </span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`pl-12 bg-background ${hasError ? 'border-destructive ring-destructive/20 ring-2' : ''}`}
      />
    </div>
  );

  const ErrorAlert = ({ errors }: { errors: ValidationError[] }) => {
    if (errors.length === 0) return null;
    
    return (
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>*There are some problems with the information you have provided:</AlertTitle>
        <AlertDescription>
          <ul className="list-none space-y-1 mt-2">
            {errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  const ResultsTable = ({ results, mortgage }: { results: SearchResult[], mortgage: number }) => {
    if (results.length === 0) return null;

    return (
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Mortgage Rates Found ({results.length} options)</h3>
          <a 
            href="https://www.ccpc.ie/consumers/money-tools/mortgage-comparisons/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Data source: CCPC <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lender</TableHead>
                <TableHead>Rate Type</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>APR</TableHead>
                <TableHead>Monthly Payment</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {result.lender}
                      {result.greenRate && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                          Green
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{result.type}</TableCell>
                  <TableCell className="font-bold text-primary">{result.rate.toFixed(2)}%</TableCell>
                  <TableCell>{result.apr.toFixed(2)}%</TableCell>
                  <TableCell>€{result.monthlyPayment.toFixed(2)}</TableCell>
                  <TableCell>€{result.totalCost.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          * Rates shown are indicative and based on publicly available information. Contact lenders directly for exact quotes.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <Tabs defaultValue="first-time-buyers" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0 bg-muted">
            <TabsTrigger 
              value="first-time-buyers" 
              className="rounded-none rounded-t-md data-[state=active]:bg-card data-[state=active]:border-b-0 px-6 py-3"
            >
              First time buyers
            </TabsTrigger>
            <TabsTrigger 
              value="switchers"
              className="rounded-none rounded-t-md data-[state=active]:bg-card data-[state=active]:border-b-0 px-6 py-3"
            >
              Switchers
            </TabsTrigger>
            <TabsTrigger 
              value="home-movers"
              className="rounded-none rounded-t-md data-[state=active]:bg-card data-[state=active]:border-b-0 px-6 py-3"
            >
              Home movers
            </TabsTrigger>
          </TabsList>

          {/* First Time Buyers Tab */}
          <TabsContent value="first-time-buyers" className="mt-0">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-semibold">Search for a mortgage:</h3>
              
              <ErrorAlert errors={ftbErrors} />
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">The house value is:</Label>
                    <InfoTooltip content="Enter the total value of the property you wish to purchase." />
                  </div>
                  <CurrencyInput
                    value={ftbHouseValue}
                    onChange={setFtbHouseValue}
                    placeholder="Enter the value of your property"
                    hasError={ftbErrors.some(e => e.field === 'houseValue')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">I'm looking for a mortgage of:</Label>
                    <InfoTooltip content="Enter the amount you wish to borrow. First time buyers can borrow up to 90% of the property value." />
                  </div>
                  <CurrencyInput
                    value={ftbMortgageAmount}
                    onChange={setFtbMortgageAmount}
                    placeholder="Enter how much you'd like to borrow"
                    hasError={ftbErrors.some(e => e.field === 'mortgageAmount')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Over a term of:</Label>
                    <InfoTooltip content="Select the length of time you want to repay your mortgage." />
                  </div>
                  <Select value={ftbTerm} onValueChange={setFtbTerm}>
                    <SelectTrigger className={`bg-background ${ftbErrors.some(e => e.field === 'term') ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select a mortgage term" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {termOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">The property's BER is:</Label>
                    <InfoTooltip content="Select the Building Energy Rating. Properties rated A1-B3 may qualify for Green mortgage rates with lower interest." />
                  </div>
                  <Select value={ftbBerRating} onValueChange={setFtbBerRating}>
                    <SelectTrigger className={`bg-background ${ftbErrors.some(e => e.field === 'berRating') ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select a BER rating" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {berRatingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} {option.isGreen && '🌱'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => validateAndSearch('ftb', ftbHouseValue, ftbMortgageAmount, ftbTerm, ftbBerRating, true)}
                  size="lg"
                  className="px-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <ResultsTable results={ftbResults} mortgage={parseFloat(ftbMortgageAmount) || 0} />
            </CardContent>
          </TabsContent>

          {/* Switchers Tab */}
          <TabsContent value="switchers" className="mt-0">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-semibold">Search for a mortgage:</h3>
              
              <ErrorAlert errors={switcherErrors} />
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">The house value is:</Label>
                    <InfoTooltip content="Enter the current market value of your property." />
                  </div>
                  <CurrencyInput
                    value={switcherHouseValue}
                    onChange={setSwitcherHouseValue}
                    placeholder="Enter the value of your property"
                    hasError={switcherErrors.some(e => e.field === 'houseValue')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">The mortgage outstanding is:</Label>
                    <InfoTooltip content="Enter the remaining balance on your current mortgage." />
                  </div>
                  <CurrencyInput
                    value={switcherOutstanding}
                    onChange={setSwitcherOutstanding}
                    placeholder="Enter outstanding mortgage amount"
                    hasError={switcherErrors.some(e => e.field === 'mortgageAmount')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Term remaining is:</Label>
                    <InfoTooltip content="Select the remaining term on your current mortgage or your desired new term." />
                  </div>
                  <Select value={switcherTermRemaining} onValueChange={setSwitcherTermRemaining}>
                    <SelectTrigger className={`bg-background ${switcherErrors.some(e => e.field === 'term') ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select a mortgage term" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {termOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">My current monthly repayment is:</Label>
                    <InfoTooltip content="Enter your current monthly mortgage repayment amount for comparison." />
                  </div>
                  <CurrencyInput
                    value={switcherMonthlyRepayment}
                    onChange={setSwitcherMonthlyRepayment}
                    placeholder="Current monthly mortgage repayment"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">The property's BER is:</Label>
                    <InfoTooltip content="Select the Building Energy Rating. Properties rated A1-B3 may qualify for Green mortgage rates." />
                  </div>
                  <Select value={switcherBerRating} onValueChange={setSwitcherBerRating}>
                    <SelectTrigger className={`bg-background ${switcherErrors.some(e => e.field === 'berRating') ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select a BER rating" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {berRatingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} {option.isGreen && '🌱'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => validateAndSearch('switcher', switcherHouseValue, switcherOutstanding, switcherTermRemaining, switcherBerRating, false)}
                  size="lg"
                  className="px-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <ResultsTable results={switcherResults} mortgage={parseFloat(switcherOutstanding) || 0} />
            </CardContent>
          </TabsContent>

          {/* Home Movers Tab */}
          <TabsContent value="home-movers" className="mt-0">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-semibold">Search for a mortgage:</h3>
              
              <ErrorAlert errors={moverErrors} />
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">The value of my new home is:</Label>
                    <InfoTooltip content="Enter the value of the property you wish to purchase." />
                  </div>
                  <CurrencyInput
                    value={moverNewHomeValue}
                    onChange={setMoverNewHomeValue}
                    placeholder="Enter the value of the property"
                    hasError={moverErrors.some(e => e.field === 'houseValue')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">My new mortgage amount is:</Label>
                    <InfoTooltip content="Enter the mortgage amount you need. Home movers can borrow up to 80% of the property value." />
                  </div>
                  <CurrencyInput
                    value={moverMortgageAmount}
                    onChange={setMoverMortgageAmount}
                    placeholder="Enter how much you'd like to borrow"
                    hasError={moverErrors.some(e => e.field === 'mortgageAmount')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Over a term of:</Label>
                    <InfoTooltip content="Select the length of time you want to repay your mortgage." />
                  </div>
                  <Select value={moverTerm} onValueChange={setMoverTerm}>
                    <SelectTrigger className={`bg-background ${moverErrors.some(e => e.field === 'term') ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select a mortgage term" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {termOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">The property's BER is:</Label>
                    <InfoTooltip content="Select the Building Energy Rating. Properties rated A1-B3 may qualify for Green mortgage rates." />
                  </div>
                  <Select value={moverBerRating} onValueChange={setMoverBerRating}>
                    <SelectTrigger className={`bg-background ${moverErrors.some(e => e.field === 'berRating') ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select a BER rating" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {berRatingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} {option.isGreen && '🌱'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => validateAndSearch('mover', moverNewHomeValue, moverMortgageAmount, moverTerm, moverBerRating, false)}
                  size="lg"
                  className="px-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <ResultsTable results={moverResults} mortgage={parseFloat(moverMortgageAmount) || 0} />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default BrokerRatesTab;
