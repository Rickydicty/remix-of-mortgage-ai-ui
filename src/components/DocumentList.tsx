import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  filename: string;
  document_type: string;
  status: 'approved' | 'disapproved' | 'waiting';
  score: number;
  analysis_text: string;
  created_at: string;
  file_path: string;
}

interface DocumentListProps {
  refreshTrigger?: number;
}

export const DocumentList = ({ refreshTrigger }: DocumentListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as Document[]) || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'disapproved':
        return 'bg-red-500';
      case 'waiting':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Your Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No documents uploaded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Your Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg"
          >
            <div className="flex-1">
              <h4 className="font-medium">{doc.filename}</h4>
              <p className="text-sm text-muted-foreground capitalize">
                {doc.document_type.replace('_', ' ')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
              {doc.analysis_text && (
                <p className="text-sm mt-2 text-muted-foreground italic">
                  {doc.analysis_text}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <Badge className={`${getStatusColor(doc.status)} text-white`}>
                  {doc.status}
                </Badge>
                <p className="text-sm font-medium mt-1">
                  Score: {doc.score}/100
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(doc.file_path, doc.filename)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};