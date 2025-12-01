import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search as SearchIcon } from "lucide-react";

const BrokerLibraryTab = () => {
  const [documentName, setDocumentName] = useState("");
  const [category, setCategory] = useState("all");
  const [uploadDateFrom, setUploadDateFrom] = useState("");
  const [uploadDateTo, setUploadDateTo] = useState("");

  // Sample documents data
  const documents = [
    { name: "BI- Application Form", description: "Required for ALL cases", category: "Brokers Ireland Mortgages Docs", datePosted: "11/03/2020 09:15:28" },
    { name: "BI- Salary Cert", description: "Accepted across all of our lenders", category: "Brokers Ireland Mortgages Docs", datePosted: "11/03/2020 09:16:03" },
    { name: "Cover memo sample", description: "", category: "Brokers Ireland Mortgages Docs", datePosted: "21/03/2024 12:56:18" },
    { name: "BPFI Salary cert", description: "", category: "Brokers Ireland Mortgages Docs", datePosted: "29/01/2025 13:51:51" },
    { name: "BOI calc - ( May 2025)", description: "", category: "Bank of Ireland", datePosted: "16/06/2025 12:24:42" },
    { name: "BOI- Editable application form", description: "", category: "Bank of Ireland", datePosted: "21/01/2025 11:04:00" },
    { name: "BOI- Cost of credit calc", description: "", category: "Bank of Ireland", datePosted: "22/01/2025 15:20:36" },
    { name: "BOI - CHANGE IN PROPOSAL", description: "", category: "Bank of Ireland", datePosted: "28/01/2025 12:13:56" },
    { name: "BOI- Fees&Charges", description: "", category: "Bank of Ireland", datePosted: "24/07/2024 08:40:41" },
    { name: "BOI- Document checklist", description: "", category: "Bank of Ireland", datePosted: "24/07/2024 08:42:14" },
  ];

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Searching...", { documentName, category, uploadDateFrom, uploadDateTo });
  };

  const handleReset = () => {
    setDocumentName("");
    setCategory("all");
    setUploadDateFrom("");
    setUploadDateTo("");
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Document Name and Category */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document name:</label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category:</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">-All-</SelectItem>
                    <SelectItem value="brokers-ireland">Brokers Ireland Mortgages Docs</SelectItem>
                    <SelectItem value="bank-of-ireland">Bank of Ireland</SelectItem>
                    <SelectItem value="aib">AIB</SelectItem>
                    <SelectItem value="ptsb">PTSB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Upload Date Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Date - from:</label>
                <Input
                  type="date"
                  value={uploadDateFrom}
                  onChange={(e) => setUploadDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">to:</label>
                <Input
                  type="date"
                  value={uploadDateTo}
                  onChange={(e) => setUploadDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Search and Reset Buttons */}
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSearch}>Search</Button>
              <Button variant="outline" onClick={handleReset}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date Posted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <a href="#" className="text-primary hover:underline">
                      {doc.name}
                    </a>
                  </TableCell>
                  <TableCell>{doc.description}</TableCell>
                  <TableCell>{doc.category}</TableCell>
                  <TableCell>{doc.datePosted}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerLibraryTab;
