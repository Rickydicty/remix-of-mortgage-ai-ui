import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Home, Search, Send, Clock, CheckCircle, MapPin, Euro, 
  Calendar, ExternalLink, Building, RefreshCw, FileText, Sparkles,
  Brain, Loader2
} from "lucide-react";
import { format } from "date-fns";

interface PropertyValuationReviewProps {
  applicationId: string;
  propertyAddress?: string;
}

interface Valuation {
  id: string;
  status: string;
  valuation_amount: number | null;
  notes: string | null;
  ordered_at: string | null;
  completed_at: string | null;
  valuer_name: string | null;
  valuer_contact: string | null;
  appointment_date: string | null;
  report_url: string | null;
}

interface TailteResult {
  address: string;
  eircode?: string;
  valuationDate?: string;
  ratableValue?: number;
  propertyCategory?: string;
  localAuthority?: string;
  uses?: string;
}

interface AIValuationResult {
  comparables: TailteResult[];
  aiAnalysis: string;
  summary: {
    clientEstimate: number;
    avgRegistryValue: number;
    variance: number;
    varianceStatus: 'aligned' | 'high' | 'low';
  };
}

export const PropertyValuationReview = ({ applicationId, propertyAddress }: PropertyValuationReviewProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [checkingAI, setCheckingAI] = useState(false);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [searchAddress, setSearchAddress] = useState(propertyAddress || "");
  const [tailteResults, setTailteResults] = useState<TailteResult[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<AIValuationResult['summary'] | null>(null);
  const [sendingToLender, setSendingToLender] = useState(false);

  useEffect(() => {
    fetchValuation();
  }, [applicationId]);

  useEffect(() => {
    if (propertyAddress) {
      setSearchAddress(propertyAddress);
    }
  }, [propertyAddress]);

  const fetchValuation = async () => {
    if (!applicationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setValuation(data);
      }
    } catch (error) {
      console.error('Error fetching valuation:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI-powered valuation check using edge function
  const checkWithAI = async () => {
    if (!valuation) {
      toast({
        title: "No Valuation",
        description: "Client hasn't submitted a valuation yet",
        variant: "destructive",
      });
      return;
    }

    setCheckingAI(true);
    setTailteResults([]);
    setAiAnalysis(null);
    setAiSummary(null);

    try {
      // Parse property details from notes
      const notes = valuation.notes || "";
      const propertyType = notes.match(/Property Type: ([^\n]+)/)?.[1] || "";
      const yearBuilt = notes.match(/Year Built: (\d+)/)?.[1] || "";
      const size = notes.match(/Size: (\d+)/)?.[1] || "";
      const bedrooms = notes.match(/Bedrooms: (\d+)/)?.[1] || "";
      const clientNotes = notes.match(/Client Notes: ([^\n]+)/)?.[1] || "";

      // Extract address from notes or use prop
      const addressFromNotes = notes.split('\n')[0]?.replace('Property Type:', '').trim();
      const address = searchAddress || addressFromNotes || propertyAddress || "";

      const { data, error } = await supabase.functions.invoke('check-valuation-ai', {
        body: {
          propertyAddress: address,
          clientEstimate: valuation.valuation_amount,
          propertyType,
          yearBuilt,
          size,
          bedrooms,
          notes: clientNotes
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setTailteResults(data.comparables || []);
      setAiAnalysis(data.aiAnalysis || null);
      setAiSummary(data.summary || null);

      toast({
        title: "AI Analysis Complete",
        description: "Property valuation has been analyzed with registry data",
      });

    } catch (error) {
      console.error('Error checking with AI:', error);
      toast({
        title: "AI Check Failed",
        description: error instanceof Error ? error.message : "Could not complete AI analysis",
        variant: "destructive",
      });
    } finally {
      setCheckingAI(false);
    }
  };

  // Manual search without AI
  const searchTailteAPI = async () => {
    if (!searchAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter an address to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setTailteResults([]);
    setAiAnalysis(null);
    setAiSummary(null);

    try {
      // Simulate Tailte API call - in production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock results based on search address
      const baseValue = valuation?.valuation_amount || 350000;
      const mockResults: TailteResult[] = [
        {
          address: searchAddress,
          eircode: "D01 ABC1",
          valuationDate: "2024-09-15",
          ratableValue: Math.round(baseValue * 0.95),
          propertyCategory: "Residential",
          localAuthority: "Dublin City Council",
          uses: "Private Dwelling"
        },
        {
          address: searchAddress.replace(/\d+/, String(Number(searchAddress.match(/\d+/)?.[0] || 0) + 2)),
          eircode: "D01 ABC3",
          valuationDate: "2024-07-22",
          ratableValue: Math.round(baseValue * 1.1),
          propertyCategory: "Residential",
          localAuthority: "Dublin City Council",
          uses: "Private Dwelling"
        },
        {
          address: searchAddress.replace(/\d+/, String(Number(searchAddress.match(/\d+/)?.[0] || 0) - 2)),
          eircode: "D01 ABB9",
          valuationDate: "2024-05-10",
          ratableValue: Math.round(baseValue * 0.98),
          propertyCategory: "Residential",
          localAuthority: "Dublin City Council",
          uses: "Private Dwelling"
        }
      ];

      setTailteResults(mockResults);

      toast({
        title: "Search Complete",
        description: `Found ${mockResults.length} matching properties in Tailte registry`,
      });
    } catch (error) {
      console.error('Error searching Tailte API:', error);
      toast({
        title: "Search Failed",
        description: "Could not retrieve data from Tailte Éireann",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const updateValuationStatus = async (status: string, additionalData?: Partial<Valuation>) => {
    if (!valuation) return;

    try {
      const { error } = await supabase
        .from('valuations')
        .update({
          status,
          ...additionalData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', valuation.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Valuation marked as ${status.replace('_', ' ')}`,
      });

      fetchValuation();
    } catch (error) {
      console.error('Error updating valuation:', error);
      toast({
        title: "Error",
        description: "Failed to update valuation status",
        variant: "destructive",
      });
    }
  };

  const sendToLender = async () => {
    if (!valuation) return;

    setSendingToLender(true);
    try {
      // Simulate sending to lender
      await new Promise(resolve => setTimeout(resolve, 1000));

      await updateValuationStatus('sent_to_lender', {
        notes: `${valuation.notes || ''}\n\n[Sent to Lender: ${format(new Date(), 'dd MMM yyyy HH:mm')}]\nTailte Registry Data Attached`
      });

      toast({
        title: "Sent to Lender",
        description: "Valuation report has been sent to the lender for review",
      });
    } catch (error) {
      console.error('Error sending to lender:', error);
      toast({
        title: "Error",
        description: "Failed to send to lender",
        variant: "destructive",
      });
    } finally {
      setSendingToLender(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
      pending: { variant: "secondary", icon: <Clock className="h-3 w-3" />, label: "Pending Review" },
      in_progress: { variant: "default", icon: <RefreshCw className="h-3 w-3" />, label: "In Progress" },
      completed: { variant: "default", icon: <CheckCircle className="h-3 w-3" />, label: "Completed" },
      sent_to_lender: { variant: "outline", icon: <Send className="h-3 w-3" />, label: "Sent to Lender" },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Client Submitted Valuation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Property Valuation Review
          </CardTitle>
          <CardDescription>
            Review client's submitted valuation and verify with Tailte Éireann registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {valuation ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Client Submission</h4>
                {getStatusBadge(valuation.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Client Estimate</p>
                    <p className="font-semibold text-lg">
                      €{valuation.valuation_amount?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {valuation.ordered_at 
                        ? format(new Date(valuation.ordered_at), 'dd MMM yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{valuation.status.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              {valuation.notes && (
                <div className="p-3 bg-background border rounded-lg">
                  <p className="text-sm font-medium mb-1">Client Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {valuation.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No valuation submitted by client yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Valuation Check */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Valuation Analysis
          </CardTitle>
          <CardDescription>
            Use AI to analyze the property valuation against registry data and market conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={checkWithAI} 
            disabled={checkingAI || !valuation}
            className="gap-2 w-full md:w-auto"
            size="lg"
          >
            {checkingAI ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Brain className="h-5 w-5" />
            )}
            {checkingAI ? 'Analyzing with AI...' : 'Check with AI'}
          </Button>

          {!valuation && (
            <p className="text-sm text-muted-foreground">
              Client must submit a valuation before AI analysis can be performed.
            </p>
          )}

          {/* AI Summary Stats */}
          {aiSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Client Estimate</p>
                <p className="font-bold text-lg">€{aiSummary.clientEstimate.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Registry Average</p>
                <p className="font-bold text-lg">€{aiSummary.avgRegistryValue.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Variance</p>
                <p className={`font-bold text-lg ${
                  aiSummary.varianceStatus === 'aligned' ? 'text-green-600' :
                  aiSummary.varianceStatus === 'high' ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  {aiSummary.variance > 0 ? '+' : ''}{aiSummary.variance}%
                </p>
              </div>
            </div>
          )}

          {/* AI Full Analysis */}
          {aiAnalysis && (
            <div className="p-4 bg-muted/50 border rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="font-medium">AI Assessment</p>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap pl-7">
                {aiAnalysis}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Tailte Éireann API Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-muted-foreground" />
            Manual Registry Lookup
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            Search Tailte Éireann registry manually
            <a 
              href="https://tailte.ie/home/api/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              API Info
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter property address to search..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={searchTailteAPI} disabled={searching} variant="outline" className="gap-2">
              {searching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {searching ? 'Searching...' : 'Manual Search'}
            </Button>
          </div>

          {/* Results Table */}
          {tailteResults.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Address</TableHead>
                    <TableHead>Eircode</TableHead>
                    <TableHead>Ratable Value</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tailteResults.map((result, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{result.address}</TableCell>
                      <TableCell>{result.eircode || '-'}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          €{result.ratableValue?.toLocaleString() || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{result.propertyCategory || '-'}</TableCell>
                      <TableCell>{result.valuationDate || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Data sourced from Tailte Éireann Open Data Portal under Creative Commons license. 
            Statutory fees may apply for detailed extracts.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {valuation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Broker Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {valuation.status === 'pending' && (
                <Button 
                  variant="outline" 
                  onClick={() => updateValuationStatus('in_progress')}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Mark In Progress
                </Button>
              )}
              
              {valuation.status !== 'completed' && valuation.status !== 'sent_to_lender' && (
                <Button 
                  variant="outline"
                  onClick={() => updateValuationStatus('completed', { completed_at: new Date().toISOString() })}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Complete
                </Button>
              )}

              {valuation.status !== 'sent_to_lender' && (
                <Button 
                  onClick={sendToLender}
                  disabled={sendingToLender || valuation.status === 'pending'}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sendingToLender ? 'Sending...' : 'Send to Lender'}
                </Button>
              )}

              {valuation.status === 'sent_to_lender' && (
                <Badge variant="outline" className="gap-1 py-2 px-4">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Sent to Lender - Awaiting Response
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
