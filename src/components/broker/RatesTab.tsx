import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BrokerRatesTab = () => {
  // First Time Buyers state
  const [ftbHouseValue, setFtbHouseValue] = useState("");
  const [ftbMortgageAmount, setFtbMortgageAmount] = useState("");
  const [ftbTerm, setFtbTerm] = useState("");
  const [ftbBerRating, setFtbBerRating] = useState("");

  // Switchers state
  const [switcherHouseValue, setSwitcherHouseValue] = useState("");
  const [switcherOutstanding, setSwitcherOutstanding] = useState("");
  const [switcherTermRemaining, setSwitcherTermRemaining] = useState("");
  const [switcherMonthlyRepayment, setSwitcherMonthlyRepayment] = useState("");
  const [switcherBerRating, setSwitcherBerRating] = useState("");

  // Home Movers state
  const [moverNewHomeValue, setMoverNewHomeValue] = useState("");
  const [moverMortgageAmount, setMoverMortgageAmount] = useState("");
  const [moverTerm, setMoverTerm] = useState("");
  const [moverBerRating, setMoverBerRating] = useState("");

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
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "A3", label: "A3" },
    { value: "B1", label: "B1" },
    { value: "B2", label: "B2" },
    { value: "B3", label: "B3" },
    { value: "C1", label: "C1" },
    { value: "C2", label: "C2" },
    { value: "C3", label: "C3" },
    { value: "D1", label: "D1" },
    { value: "D2", label: "D2" },
    { value: "E1", label: "E1" },
    { value: "E2", label: "E2" },
    { value: "F", label: "F" },
    { value: "G", label: "G" },
    { value: "exempt", label: "BER Exempt" },
  ];

  const handleSearch = (type: string) => {
    console.log(`Searching for ${type} mortgage rates...`);
    // This would connect to a mortgage rate API or database
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
    placeholder 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    placeholder: string;
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
        className="pl-12 bg-background"
      />
    </div>
  );

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
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">I'm looking for a mortgage of:</Label>
                    <InfoTooltip content="Enter the amount you wish to borrow for your mortgage." />
                  </div>
                  <CurrencyInput
                    value={ftbMortgageAmount}
                    onChange={setFtbMortgageAmount}
                    placeholder="Enter how much you'd like to borrow"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Over a term of:</Label>
                    <InfoTooltip content="Select the length of time you want to repay your mortgage." />
                  </div>
                  <Select value={ftbTerm} onValueChange={setFtbTerm}>
                    <SelectTrigger className="bg-background">
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
                    <InfoTooltip content="Select the Building Energy Rating of the property. Green mortgages may offer better rates for energy-efficient homes." />
                  </div>
                  <Select value={ftbBerRating} onValueChange={setFtbBerRating}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a BER rating" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {berRatingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => handleSearch('first-time-buyers')}
                  size="lg"
                  className="px-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </TabsContent>

          {/* Switchers Tab */}
          <TabsContent value="switchers" className="mt-0">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-semibold">Search for a mortgage:</h3>
              
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
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Term remaining is:</Label>
                    <InfoTooltip content="Select the remaining term on your current mortgage or your desired new term." />
                  </div>
                  <Select value={switcherTermRemaining} onValueChange={setSwitcherTermRemaining}>
                    <SelectTrigger className="bg-background">
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
                    <InfoTooltip content="Enter your current monthly mortgage repayment amount." />
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
                    <InfoTooltip content="Select the Building Energy Rating of your property. Green mortgages may offer better rates for energy-efficient homes." />
                  </div>
                  <Select value={switcherBerRating} onValueChange={setSwitcherBerRating}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a BER rating" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {berRatingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => handleSearch('switchers')}
                  size="lg"
                  className="px-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </TabsContent>

          {/* Home Movers Tab */}
          <TabsContent value="home-movers" className="mt-0">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-semibold">Search for a mortgage:</h3>
              
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
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">My new mortgage amount is:</Label>
                    <InfoTooltip content="Enter the mortgage amount you need for your new home." />
                  </div>
                  <CurrencyInput
                    value={moverMortgageAmount}
                    onChange={setMoverMortgageAmount}
                    placeholder="Enter how much you'd like to borrow"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Over a term of:</Label>
                    <InfoTooltip content="Select the length of time you want to repay your mortgage." />
                  </div>
                  <Select value={moverTerm} onValueChange={setMoverTerm}>
                    <SelectTrigger className="bg-background">
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
                    <InfoTooltip content="Select the Building Energy Rating of the property. Green mortgages may offer better rates for energy-efficient homes." />
                  </div>
                  <Select value={moverBerRating} onValueChange={setMoverBerRating}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a BER rating" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {berRatingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => handleSearch('home-movers')}
                  size="lg"
                  className="px-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default BrokerRatesTab;
