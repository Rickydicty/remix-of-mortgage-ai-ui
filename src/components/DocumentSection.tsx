import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  filename: string;
  document_type: string;
  status: string;
  score: number | null;
  analysis_text: string | null;
  created_at: string;
  file_path: string;
}

interface DocumentSectionProps {
  title: string;
  description: string;
  documentType: string;
  documents: Document[];
  required: boolean;
}

export const DocumentSection = ({ 
  title, 
  description, 
  documentType, 
  documents,
  required 
}: DocumentSectionProps) => {
  const { toast } = useToast();
  const sectionDocs = documents.filter(doc => doc.document_type === documentType);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'disapproved':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'disapproved':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const hasApprovedDoc = sectionDocs.some(doc => doc.status === 'approved');

  return (
    <Card className={`border-2 ${hasApprovedDoc ? 'border-success/30' : required ? 'border-warning/30' : 'border-border'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {title}
              {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          </div>
          {hasApprovedDoc && (
            <CheckCircle2 className="h-6 w-6 text-success" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sectionDocs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
            <p className="text-sm">No documents uploaded yet</p>
            <p className="text-xs mt-1">Upload this document using the form above</p>
          </div>
        ) : (
          sectionDocs.map((doc) => (
            <div key={doc.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(doc.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(doc.status)}
                      <span className="capitalize">{doc.status}</span>
                    </div>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc.file_path, doc.filename)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {doc.analysis_text && (
                <div className={`p-3 rounded-md text-sm ${
                  doc.status === 'approved' 
                    ? 'bg-success/5 border border-success/20' 
                    : doc.status === 'disapproved'
                    ? 'bg-destructive/5 border border-destructive/20'
                    : 'bg-warning/5 border border-warning/20'
                }`}>
                  <p className="font-medium mb-1 flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                    AI Analysis {doc.score && `(Score: ${doc.score}/100)`}
                  </p>
                  <p className="text-muted-foreground">{doc.analysis_text}</p>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
