-- Create signatures table to store e-signatures
CREATE TABLE IF NOT EXISTS public.signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  application_id UUID NOT NULL,
  signature_data TEXT NOT NULL,
  document_type TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Policies for signatures
CREATE POLICY "Users can view their own signatures" 
ON public.signatures 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signatures" 
ON public.signatures 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Brokers can view signatures for their assigned applications"
ON public.signatures
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications
    WHERE applications.id = signatures.application_id
    AND applications.assigned_broker_id = auth.uid()
  )
);