import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface Lender {
  name: string;
  maxLTV: number;
  typicalRate: string;
  processingTime: string;
  status: "preferred" | "active" | "limited";
  specialties: string[];
}

const mockLenders: Lender[] = [
  {
    name: "PTSB",
    maxLTV: 90,
    typicalRate: "3.75% - 4.25%",
    processingTime: "2-3 weeks",
    status: "preferred",
    specialties: ["First-time buyers", "Green mortgages", "Switching"]
  },
  {
    name: "Haven Mortgages",
    maxLTV: 90,
    typicalRate: "3.95% - 4.45%",
    processingTime: "3-4 weeks",
    status: "active",
    specialties: ["Standard residential", "Investment properties", "Self-employed"]
  },
  {
    name: "The Mortgage Store – by Bank of Ireland",
    maxLTV: 90,
    typicalRate: "3.70% - 4.30%",
    processingTime: "2-4 weeks",
    status: "preferred",
    specialties: ["Competitive rates", "Fast processing", "Green mortgages"]
  },
  {
    name: "ICS Mortgages",
    maxLTV: 80,
    typicalRate: "4.15% - 4.65%",
    processingTime: "3-5 weeks",
    status: "active",
    specialties: ["Flexible terms", "Self-build", "Older properties"]
  },
  {
    name: "Nua Money",
    maxLTV: 85,
    typicalRate: "3.85% - 4.35%",
    processingTime: "2-3 weeks",
    status: "limited",
    specialties: ["Digital-first", "Quick decisions", "Straightforward cases"]
  }
];

const BrokerLenderComparisonTab = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preferred":
        return <Badge className="bg-success/10 text-success border-success/20">Preferred</Badge>;
      case "active":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>;
      case "limited":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Limited</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Lender Comparison</h2>
        <p className="text-muted-foreground">
          Compare mortgage lenders to find the best fit for your clients
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockLenders.length}</p>
                <p className="text-sm text-muted-foreground">Active Lenders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockLenders.filter(l => l.status === "preferred").length}
                </p>
                <p className="text-sm text-muted-foreground">Preferred Lenders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">3.70%</p>
                <p className="text-sm text-muted-foreground">Best Rate Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lender Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lender Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Max LTV</TableHead>
                  <TableHead>Rate Range</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLenders.map((lender) => (
                  <TableRow key={lender.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{lender.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lender.status)}</TableCell>
                    <TableCell>{lender.maxLTV}%</TableCell>
                    <TableCell className="font-mono text-sm">{lender.typicalRate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{lender.processingTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lender.specialties.slice(0, 2).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {lender.specialties.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lender.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Individual Lender Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockLenders.map((lender) => (
          <Card key={lender.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{lender.name}</CardTitle>
                {getStatusBadge(lender.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Max LTV</p>
                  <p className="text-lg font-bold">{lender.maxLTV}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rate Range</p>
                  <p className="text-sm font-semibold">{lender.typicalRate}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Processing Time</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm">{lender.processingTime}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-2">Specialties</p>
                <div className="flex flex-wrap gap-1">
                  {lender.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button className="w-full" variant="outline">
                Use for Application
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BrokerLenderComparisonTab;
