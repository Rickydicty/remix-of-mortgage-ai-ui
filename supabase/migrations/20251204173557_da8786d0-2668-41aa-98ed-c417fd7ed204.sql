-- Create application_form_data table to store detailed application form fields
CREATE TABLE public.application_form_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  application_id UUID REFERENCES public.applications(id),
  
  -- Personal Details - Applicant 1
  app1_title TEXT,
  app1_forenames TEXT,
  app1_surname TEXT,
  app1_other_names TEXT,
  app1_gender TEXT,
  app1_date_of_birth DATE,
  app1_nationality TEXT DEFAULT 'Irish',
  app1_pps_number TEXT,
  app1_marital_status TEXT,
  app1_no_of_children INTEGER DEFAULT 0,
  app1_children_ages TEXT,
  app1_phone TEXT,
  app1_email TEXT,
  app1_address TEXT,
  app1_years_at_address INTEGER,
  
  -- Personal Details - Applicant 2 (for joint applications)
  app2_enabled BOOLEAN DEFAULT false,
  app2_is_guarantor BOOLEAN DEFAULT false,
  app2_title TEXT,
  app2_forenames TEXT,
  app2_surname TEXT,
  app2_other_names TEXT,
  app2_gender TEXT,
  app2_date_of_birth DATE,
  app2_nationality TEXT DEFAULT 'Irish',
  app2_pps_number TEXT,
  app2_marital_status TEXT,
  app2_no_of_children INTEGER DEFAULT 0,
  app2_children_ages TEXT,
  app2_phone TEXT,
  app2_email TEXT,
  app2_address TEXT,
  app2_years_at_address INTEGER,
  
  -- Income - Applicant 1
  app1_gross_salary NUMERIC DEFAULT 0,
  app1_salary_frequency TEXT DEFAULT 'annual',
  app1_overtime NUMERIC DEFAULT 0,
  app1_overtime_frequency TEXT DEFAULT 'annual',
  app1_bonuses NUMERIC DEFAULT 0,
  app1_bonuses_frequency TEXT DEFAULT 'annual',
  app1_commissions NUMERIC DEFAULT 0,
  app1_commissions_frequency TEXT DEFAULT 'annual',
  app1_other_income NUMERIC DEFAULT 0,
  app1_other_income_frequency TEXT DEFAULT 'annual',
  app1_other_income_details TEXT,
  app1_lodger_income NUMERIC DEFAULT 0,
  app1_residential_investment_income NUMERIC DEFAULT 0,
  app1_other_household_income NUMERIC DEFAULT 0,
  
  -- Income - Applicant 2
  app2_gross_salary NUMERIC DEFAULT 0,
  app2_salary_frequency TEXT DEFAULT 'annual',
  app2_overtime NUMERIC DEFAULT 0,
  app2_overtime_frequency TEXT DEFAULT 'annual',
  app2_bonuses NUMERIC DEFAULT 0,
  app2_bonuses_frequency TEXT DEFAULT 'annual',
  app2_commissions NUMERIC DEFAULT 0,
  app2_commissions_frequency TEXT DEFAULT 'annual',
  app2_other_income NUMERIC DEFAULT 0,
  app2_other_income_frequency TEXT DEFAULT 'annual',
  app2_other_income_details TEXT,
  app2_lodger_income NUMERIC DEFAULT 0,
  app2_residential_investment_income NUMERIC DEFAULT 0,
  
  -- Financial & Credit History
  monthly_commitments NUMERIC DEFAULT 0,
  existing_loans NUMERIC DEFAULT 0,
  credit_cards NUMERIC DEFAULT 0,
  savings NUMERIC DEFAULT 0,
  credit_history TEXT,
  has_ccj BOOLEAN DEFAULT false,
  ccj_details TEXT,
  has_arrears BOOLEAN DEFAULT false,
  arrears_details TEXT,
  
  -- Mortgage Details
  property_value NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  loan_amount NUMERIC DEFAULT 0,
  mortgage_term INTEGER DEFAULT 25,
  mortgage_type TEXT,
  first_time_buyer BOOLEAN DEFAULT false,
  help_to_buy BOOLEAN DEFAULT false,
  
  -- Property Details
  property_type TEXT,
  property_address TEXT,
  ber_rating TEXT,
  year_built INTEGER,
  property_new_or_secondhand TEXT,
  estimated_closing_date DATE,
  
  -- Alternative Lending
  has_other_mortgage BOOLEAN DEFAULT false,
  other_mortgage_details TEXT,
  has_missed_repayments BOOLEAN DEFAULT false,
  missed_repayments_details TEXT,
  has_judgements BOOLEAN DEFAULT false,
  judgements_details TEXT,
  
  -- Additional Security
  security_lending_institution TEXT,
  security_market_value NUMERIC,
  security_current_loan_balance NUMERIC,
  security_monthly_repayment NUMERIC,
  security_address TEXT,
  security_type TEXT,
  
  -- Declarations/Notes
  broker_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_form_data ENABLE ROW LEVEL SECURITY;

-- Users can view their own form data
CREATE POLICY "Users can view their own form data"
ON public.application_form_data
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own form data
CREATE POLICY "Users can insert their own form data"
ON public.application_form_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own form data
CREATE POLICY "Users can update their own form data"
ON public.application_form_data
FOR UPDATE
USING (auth.uid() = user_id);

-- Brokers can view all form data
CREATE POLICY "Brokers can view all form data"
ON public.application_form_data
FOR SELECT
USING (has_role(auth.uid(), 'broker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Brokers can update form data
CREATE POLICY "Brokers can update form data"
ON public.application_form_data
FOR UPDATE
USING (has_role(auth.uid(), 'broker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Admins have full access
CREATE POLICY "Admins have full access to form data"
ON public.application_form_data
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_application_form_data_updated_at
BEFORE UPDATE ON public.application_form_data
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();