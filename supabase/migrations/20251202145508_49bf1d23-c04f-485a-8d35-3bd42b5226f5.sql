-- Create pre-eligibility data table
CREATE TABLE public.pre_eligibility_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  applicant_type TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  income_1 NUMERIC NOT NULL,
  income_2 NUMERIC,
  monthly_commitments NUMERIC NOT NULL,
  deposit_amount NUMERIC NOT NULL,
  property_value NUMERIC NOT NULL,
  residency_status TEXT NOT NULL,
  credit_history TEXT NOT NULL,
  first_time_buyer BOOLEAN NOT NULL DEFAULT false,
  desired_term INTEGER NOT NULL DEFAULT 25,
  phone TEXT,
  email TEXT,
  borrowing_capacity_low NUMERIC,
  borrowing_capacity_high NUMERIC,
  estimated_monthly_payment NUMERIC,
  eligibility_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pre_eligibility_data ENABLE ROW LEVEL SECURITY;

-- Users can view their own pre-eligibility data
CREATE POLICY "Users can view their own pre-eligibility data"
ON public.pre_eligibility_data
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own pre-eligibility data
CREATE POLICY "Users can insert their own pre-eligibility data"
ON public.pre_eligibility_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pre-eligibility data
CREATE POLICY "Users can update their own pre-eligibility data"
ON public.pre_eligibility_data
FOR UPDATE
USING (auth.uid() = user_id);

-- Brokers can view all pre-eligibility data
CREATE POLICY "Brokers can view all pre-eligibility data"
ON public.pre_eligibility_data
FOR SELECT
USING (has_role(auth.uid(), 'broker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_pre_eligibility_data_updated_at
BEFORE UPDATE ON public.pre_eligibility_data
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();