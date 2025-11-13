-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('approved', 'disapproved', 'waiting')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  analysis_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
  ON public.documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert their own documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Brokers can view all documents
CREATE POLICY "Brokers can view all documents"
  ON public.documents
  FOR SELECT
  USING (has_role(auth.uid(), 'broker'::app_role));

-- Brokers can update document status
CREATE POLICY "Brokers can update documents"
  ON public.documents
  FOR UPDATE
  USING (has_role(auth.uid(), 'broker'::app_role));

-- Admins have full access
CREATE POLICY "Admins have full access to documents"
  ON public.documents
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage policies for documents
CREATE POLICY "Users can upload their own documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Brokers can view all documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'broker'::app_role
    )
  );

CREATE POLICY "Admins can manage all documents"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )
  );