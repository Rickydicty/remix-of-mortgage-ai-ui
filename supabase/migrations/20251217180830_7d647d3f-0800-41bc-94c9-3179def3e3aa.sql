-- Create admin_approvals table to track pending client actions
CREATE TABLE public.admin_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL, -- 'document_upload', 'message', 'form_update', 'signature', 'valuation', 'cover_letter'
  entity_id UUID NOT NULL, -- ID of the document, message, etc.
  entity_table TEXT NOT NULL, -- 'documents', 'messages', 'application_form_data', 'signatures', 'valuations'
  client_id UUID NOT NULL,
  application_id UUID REFERENCES public.applications(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID, -- admin who reviewed
  reviewed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- store additional context
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_approvals ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to approvals"
ON public.admin_approvals
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Clients can view their own approval statuses
CREATE POLICY "Clients can view their own approvals"
ON public.admin_approvals
FOR SELECT
USING (auth.uid() = client_id);

-- System can insert approvals (for triggers)
CREATE POLICY "System can insert approvals"
ON public.admin_approvals
FOR INSERT
WITH CHECK (true);

-- Add approval_status column to documents table
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add approval_status column to messages table  
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add approval_status column to signatures table
ALTER TABLE public.signatures ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add approval_status column to valuations table
ALTER TABLE public.valuations ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add approval_status to application_form_data
ALTER TABLE public.application_form_data ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Create index for faster queries
CREATE INDEX idx_admin_approvals_status ON public.admin_approvals(status);
CREATE INDEX idx_admin_approvals_client ON public.admin_approvals(client_id);
CREATE INDEX idx_documents_approval_status ON public.documents(approval_status);
CREATE INDEX idx_messages_approval_status ON public.messages(approval_status);