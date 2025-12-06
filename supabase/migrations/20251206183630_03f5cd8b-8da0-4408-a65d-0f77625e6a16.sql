-- Create loan_offers table
CREATE TABLE public.loan_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL,
  lender_name TEXT NOT NULL,
  offer_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  loan_term INTEGER NOT NULL,
  monthly_repayment NUMERIC,
  offer_type TEXT DEFAULT 'fixed',
  fixed_period INTEGER,
  total_repayment NUMERIC,
  offer_valid_until DATE,
  document_url TEXT,
  is_mock BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT loan_offers_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.loan_offers ENABLE ROW LEVEL SECURITY;

-- Clients can view loan offers for their applications
CREATE POLICY "Clients can view their loan offers"
ON public.loan_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = loan_offers.application_id
    AND applications.user_id = auth.uid()
  )
);

-- Brokers can view all loan offers
CREATE POLICY "Brokers can view all loan offers"
ON public.loan_offers
FOR SELECT
USING (has_role(auth.uid(), 'broker') OR has_role(auth.uid(), 'admin'));

-- Brokers can manage loan offers
CREATE POLICY "Brokers can manage loan offers"
ON public.loan_offers
FOR ALL
USING (has_role(auth.uid(), 'broker') OR has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_loan_offers_updated_at
BEFORE UPDATE ON public.loan_offers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();