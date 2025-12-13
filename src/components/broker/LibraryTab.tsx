import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search as SearchIcon, Download, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Document {
  id: string;
  filename: string;
  document_type: string;
  file_path: string;
  status: string;
  analysis_text: string | null;
  created_at: string;
  user_id: string;
}

const BrokerLibraryTab = () => {
  const [documentName, setDocumentName] = useState("");
  const [category, setCategory] = useState("all");
  const [uploadDateFrom, setUploadDateFrom] = useState("");
  const [uploadDateTo, setUploadDateTo] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
      setFilteredDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...documents];

    // Filter by document name
    if (documentName) {
      filtered = filtered.filter((doc) =>
        doc.filename.toLowerCase().includes(documentName.toLowerCase())
      );
    }

    // Filter by category (document type)
    if (category && category !== "all") {
      filtered = filtered.filter((doc) => doc.document_type === category);
    }

    // Filter by date range
    if (uploadDateFrom) {
      filtered = filtered.filter(
        (doc) => new Date(doc.created_at) >= new Date(uploadDateFrom)
      );
    }

    if (uploadDateTo) {
      filtered = filtered.filter(
        (doc) => new Date(doc.created_at) <= new Date(uploadDateTo)
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleReset = () => {
    setDocumentName("");
    setCategory("all");
    setUploadDateFrom("");
    setUploadDateTo("");
    setAiQuery("");
    setAiSuggestion("");
    setFilteredDocuments(documents);
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;

    setAiSearching(true);
    setAiSuggestion("");

    try {
      const { data, error } = await supabase.functions.invoke('library-ai-search', {
        body: { query: aiQuery, documents }
      });

      if (error) throw error;

      if (data.results) {
        setFilteredDocuments(data.results);
      }
      
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
      }

      if (data.intent === 'upload') {
        toast.info("Upload action detected - use the Documents tab to upload files");
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast.error("AI search failed");
    } finally {
      setAiSearching(false);
    }
  };

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const getCategoryLabel = (docType: string) => {
    const labels: Record<string, string> = {
      proof_of_id: "Proof of ID",
      proof_of_address: "Proof of Address",
      proof_of_income: "Proof of Income",
      bank_statements: "Bank Statements",
      employment_contract: "Employment Contract",
    };
    return labels[docType] || docType;
  };

  // Get unique document types for category filter
  const documentTypes = Array.from(new Set(documents.map((doc) => doc.document_type)));

  return (
    <div className="space-y-6">
      {/* AI Search Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder='Try: "Show me Haven AIP checklist" or "BOI valuation form"'
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
            />
            <Button onClick={handleAiSearch} disabled={aiSearching || !aiQuery.trim()}>
              {aiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-2">Ask AI</span>
            </Button>
          </div>
          {aiSuggestion && (
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {aiSuggestion}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Manual Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Manual Search
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
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getCategoryLabel(type)}
                      </SelectItem>
                    ))}
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
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date Posted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.filename}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === "approved"
                            ? "bg-success/10 text-success"
                            : doc.status === "rejected"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </TableCell>
                    <TableCell>{getCategoryLabel(doc.document_type)}</TableCell>
                    <TableCell>
                      {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(doc.file_path, doc.filename)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerLibraryTab;
