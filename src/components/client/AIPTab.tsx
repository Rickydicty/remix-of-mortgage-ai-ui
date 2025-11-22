import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Calendar, MessageSquare, User, FileCheck } from "lucide-react";
import { formatDistanceToNow, addDays, format } from "date-fns";

interface AIPData {
  aip_status: string;
  aip_approved_amount: number | null;
  aip_max_term: number | null;
  aip_rate_range_min: number | null;
  aip_rate_range_max: number | null;
  aip_monthly_repayment: number | null;
  aip_issue_date: string | null;
  aip_validity_period: number;
  aip_lender_name: string | null;
  aip_conditions: Array<{ type: string; description: string }>;
  aip_letter_url: string | null;
  application_number: string;
}

interface AIPTabProps {
  aipData: AIPData | null;
  brokerProfile: { full_name: string | null; email: string | null } | null;
  onNavigateToDocuments: () => void;
  onOpenMessaging: () => void;
}

const AIPTab = ({ aipData, brokerProfile, onNavigateToDocuments, onOpenMessaging }: AIPTabProps) => {
  if (!aipData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">AIP data not available yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your application needs to reach the AIP stage to view this information
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'declined':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'expired':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const expiryDate = aipData.aip_issue_date 
    ? addDays(new Date(aipData.aip_issue_date), aipData.aip_validity_period)
    : null;

  const isExpired = expiryDate && expiryDate < new Date();

  // Generic conditions always shown
  const genericConditions = [
    "Subject to property valuation",
    "Subject to proof of income verification",
    "Subject to standard underwriting review"
  ];

  // Map internal conditions to plain language
  const mapConditionToPlainLanguage = (condition: { type: string; description: string }) => {
    const mapping: { [key: string]: string } = {
      'payslips': 'Provide updated payslips',
      'bank_statements': 'Provide 6-month bank statements',
      'proof_of_deposit': 'Provide proof of deposit',
      'valuation_required': 'Property valuation required',
    };
    return mapping[condition.type] || condition.description;
  };

  const handleDownloadLetter = () => {
    if (aipData.aip_letter_url) {
      window.open(aipData.aip_letter_url, '_blank');
    } else {
      alert('AIP letter is being generated. Please check back later.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top AIP Status Panel */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Agreement in Principle Status</span>
            <Badge className={getStatusColor(isExpired ? 'expired' : aipData.aip_status)}>
              {isExpired ? 'Expired' : aipData.aip_status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Application ID</p>
              <p className="font-semibold">{aipData.application_number}</p>
            </div>
            {aipData.aip_lender_name && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lender</p>
                <p className="font-semibold">{aipData.aip_lender_name}</p>
              </div>
            )}
            {aipData.aip_issue_date && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Issue Date</p>
                <p className="font-semibold">{format(new Date(aipData.aip_issue_date), 'dd MMM yyyy')}</p>
              </div>
            )}
            {expiryDate && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
                <p className="font-semibold">{format(expiryDate, 'dd MMM yyyy')}</p>
                <p className="text-xs text-muted-foreground">
                  {isExpired ? 'Expired' : `Expires ${formatDistanceToNow(expiryDate, { addSuffix: true })}`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AIP Summary */}
      {aipData.aip_status === 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>AIP Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {aipData.aip_approved_amount 
                    ? `£${aipData.aip_approved_amount.toLocaleString()}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Maximum Term</p>
                <p className="text-2xl font-bold">
                  {aipData.aip_max_term ? `${aipData.aip_max_term} years` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Indicative Rate Range</p>
                <p className="text-xl font-semibold">
                  {aipData.aip_rate_range_min && aipData.aip_rate_range_max
                    ? `${aipData.aip_rate_range_min}% - ${aipData.aip_rate_range_max}%`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Repayment</p>
                <p className="text-xl font-semibold">
                  {aipData.aip_monthly_repayment 
                    ? `£${aipData.aip_monthly_repayment.toLocaleString()}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AIP Conditions */}
      {aipData.aip_status === 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              AIP Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                This AIP is subject to the following conditions:
              </p>
              <ul className="space-y-2">
                {genericConditions.map((condition, idx) => (
                  <li key={`generic-${idx}`} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{condition}</span>
                  </li>
                ))}
                {aipData.aip_conditions.map((condition, idx) => (
                  <li key={`custom-${idx}`} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{mapConditionToPlainLanguage(condition)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AIP Letter Download */}
      {aipData.aip_status === 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>AIP Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Agreement in Principle Letter</p>
                <p className="text-sm text-muted-foreground">
                  Official AIP certificate with watermark
                </p>
              </div>
              <Button onClick={handleDownloadLetter}>
                <Download className="h-4 w-4 mr-2" />
                Download Letter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {aipData.aip_status === 'approved' && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={onNavigateToDocuments}
              >
                <Upload className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Upload Remaining Documents</p>
                  <p className="text-xs text-muted-foreground">Complete your application</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                disabled={!aipData.aip_issue_date}
              >
                <Calendar className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Book Valuation</p>
                  <p className="text-xs text-muted-foreground">
                    {aipData.aip_issue_date ? 'Schedule property valuation' : 'Available after AIP issued'}
                  </p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={onOpenMessaging}
              >
                <MessageSquare className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-semibold">Chat with Broker</p>
                  <p className="text-xs text-muted-foreground">Get help from your broker</p>
                </div>
              </Button>

              {brokerProfile && (
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-sm">Your Broker</p>
                      <p className="text-sm">{brokerProfile.full_name || 'Assigned Broker'}</p>
                      <p className="text-xs text-muted-foreground">{brokerProfile.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending/Declined States */}
      {aipData.aip_status === 'pending' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">AIP Under Review</h3>
              <p className="text-muted-foreground">
                Your Agreement in Principle is being processed. Your broker will update you once it's ready.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {aipData.aip_status === 'declined' && (
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="font-semibold text-lg mb-2 text-destructive">AIP Not Approved</h3>
              <p className="text-muted-foreground mb-4">
                Unfortunately, the AIP was not approved at this time. Please contact your broker for more information and next steps.
              </p>
              <Button onClick={onOpenMessaging}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Broker
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Restriction Warning */}
      <Card className="border-warning bg-warning/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Upload className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-medium text-sm">Document Upload Restricted</p>
              <p className="text-xs text-muted-foreground">
                Document uploads are not available on the AIP tab. Please use the "Documents & Conditions" tab to upload files.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPTab;
