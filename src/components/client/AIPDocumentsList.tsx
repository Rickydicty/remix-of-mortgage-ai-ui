import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Document {
  id: string;
  filename: string;
  file_path: string;
  document_type: string;
  created_at: string;
  status: string;
}

interface AIPDocumentsListProps {
  applicationId?: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  aip_letter: "AIP Letter",
  underwriting_appendix: "Underwriting Appendix",
  supplementary_forms: "Supplementary Forms",
  valuation_report: "Valuation Report",
  condition_document: "Condition Supporting Document",
  lender_communication: "Lender Communication",
};

export function AIPDocumentsList({ applicationId }: AIPDocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (applicationId) {
      fetchDocuments();
    }
  }, [applicationId]);

  const fetchDocuments = async () => {
    if (!applicationId) return;

    try {
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("user_id")
        .eq("id", applicationId)
        .single();

      if (appError) throw appError;

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", application.user_id)
        .in("document_type", [
          "aip_letter",
          "underwriting_appendix",
          "supplementary_forms",
          "valuation_report",
          "condition_document",
          "lender_communication",
        ])
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    setDownloading(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">
          No AIP documents available yet. Your broker will upload relevant documents here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
              </p>
              <p className="text-xs text-muted-foreground">
                {doc.filename} • {format(new Date(doc.created_at), "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(doc)}
            disabled={downloading === doc.id}
          >
            {downloading === doc.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
