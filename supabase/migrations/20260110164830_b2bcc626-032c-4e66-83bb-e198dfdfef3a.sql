-- Add justification and structured review fields to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS client_justification TEXT,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewer_justification TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2);

-- Add comment explaining the fields
COMMENT ON COLUMN public.documents.client_justification IS 'Client explanation/justification for the document (e.g., why only 2 months of statements)';
COMMENT ON COLUMN public.documents.flag_reason IS 'Reason the document was flagged by AI (e.g., missing_pages, date_mismatch, low_quality)';
COMMENT ON COLUMN public.documents.reviewer_justification IS 'Broker/reviewer explanation for approval or rejection';
COMMENT ON COLUMN public.documents.reviewed_by IS 'User ID of the reviewer who made the decision';
COMMENT ON COLUMN public.documents.reviewed_at IS 'Timestamp when the document was reviewed';
COMMENT ON COLUMN public.documents.confidence_score IS 'AI confidence score for the document analysis';