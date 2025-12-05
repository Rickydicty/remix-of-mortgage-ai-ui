import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PenTool, FileText, CheckCircle2, Clock, Loader2, Download } from 'lucide-react';
import { SignatureDialog } from '@/components/SignatureDialog';

interface Document {
  id: string;
  filename: string;
  file_path: string;
  document_type: string;
  status: string;
  created_at: string;
}

interface Signature {
  id: string;
  document_type: string;
  signed_at: string;
}

interface Application {
  id: string;
  status: string;
}

interface ESignaturesTabProps {
  application: Application | null;
  onSignatureComplete: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  aip_letter: 'AIP Letter',
  mortgage_application: 'Mortgage Application',
};

export function ESignaturesTab({ application, onSignatureComplete }: ESignaturesTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [signatureDialog, setSignatureDialog] = useState({ open: false, documentType: '' });
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (application?.id) {
      fetchData();
    }
  }, [application?.id]);

  const fetchData = async () => {
    if (!application?.id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch documents pending signature
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .in('document_type', ['aip_letter', 'mortgage_application'])
        .order('created_at', { ascending: false });

      setDocuments(docs || []);

      // Fetch existing signatures
      const { data: sigs } = await supabase
        .from('signatures')
        .select('*')
        .eq('application_id', application.id);

      setSignatures(sigs || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    setDownloading(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Document downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    } finally {
      setDownloading(null);
    }
  };

  const isDocumentSigned = (docType: string) => {
    return signatures.some(sig => 
      sig.document_type.toLowerCase().replace(/ /g, '_') === docType ||
      sig.document_type === DOCUMENT_TYPE_LABELS[docType]
    );
  };

  const handleSignatureComplete = () => {
    fetchData();
    onSignatureComplete();
  };

  const canSign = application?.status === 'aip_pending' || application?.status === 'aip';

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // No documents and not in AIP stage
  if (!canSign && documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            E-Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <PenTool className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No documents to sign</p>
            <p className="text-sm mt-2">
              Signature requests will appear when your application reaches AIP stage
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            E-Signatures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Documents requiring signature */}
          {documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Documents for Signature</h4>
              {documents.map((doc) => {
                const isSigned = isDocumentSigned(doc.document_type);
                const signature = signatures.find(sig => 
                  sig.document_type.toLowerCase().replace(/ /g, '_') === doc.document_type ||
                  sig.document_type === DOCUMENT_TYPE_LABELS[doc.document_type]
                );

                return (
                  <div
                    key={doc.id}
                    className={`p-4 border rounded-lg ${isSigned ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${isSigned ? 'bg-success/20' : 'bg-warning/20'}`}>
                          {isSigned ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <Clock className="h-5 w-5 text-warning" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.filename} • Uploaded {format(new Date(doc.created_at), 'dd MMM yyyy')}
                          </p>
                          {isSigned && signature && (
                            <Badge variant="outline" className="mt-2 bg-success/10 text-success border-success/20">
                              Signed on {format(new Date(signature.signed_at), 'dd MMM yyyy HH:mm')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc)}
                          disabled={downloading === doc.id}
                        >
                          {downloading === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              View
                            </>
                          )}
                        </Button>
                        {!isSigned && (
                          <Button
                            size="sm"
                            onClick={() => setSignatureDialog({ 
                              open: true, 
                              documentType: DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type 
                            })}
                          >
                            <PenTool className="h-4 w-4 mr-1" />
                            Sign
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No documents yet but in AIP stage */}
          {documents.length === 0 && canSign && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Waiting for broker to upload documents</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your broker will upload the AIP documents for you to sign
              </p>
            </div>
          )}

          {/* Summary of signed documents */}
          {signatures.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Signature Summary</h4>
              <div className="space-y-2">
                {signatures.map((sig) => (
                  <div key={sig.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>{sig.document_type}</span>
                    <span className="text-muted-foreground">
                      - {format(new Date(sig.signed_at), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
              {documents.every(doc => isDocumentSigned(doc.document_type)) && documents.length > 0 && (
                <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="text-sm text-success font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    All documents signed! Awaiting broker approval.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Dialog */}
      {application && (
        <SignatureDialog
          open={signatureDialog.open}
          onOpenChange={(open) => setSignatureDialog({ ...signatureDialog, open })}
          documentType={signatureDialog.documentType}
          applicationId={application.id}
          onSignatureComplete={handleSignatureComplete}
        />
      )}
    </>
  );
}
