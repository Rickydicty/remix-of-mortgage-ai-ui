-- Drop existing broker policies that allow viewing all data
DROP POLICY IF EXISTS "Brokers can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Brokers can update applications" ON public.applications;
DROP POLICY IF EXISTS "Brokers can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Brokers can update documents" ON public.documents;
DROP POLICY IF EXISTS "Brokers can insert documents for clients" ON public.documents;
DROP POLICY IF EXISTS "Brokers can view all form data" ON public.application_form_data;
DROP POLICY IF EXISTS "Brokers can update form data" ON public.application_form_data;
DROP POLICY IF EXISTS "Brokers can view all pre-eligibility data" ON public.pre_eligibility_data;
DROP POLICY IF EXISTS "Brokers can view all valuations" ON public.valuations;
DROP POLICY IF EXISTS "Brokers can manage valuations" ON public.valuations;
DROP POLICY IF EXISTS "Brokers can view all loan offers" ON public.loan_offers;
DROP POLICY IF EXISTS "Brokers can manage loan offers" ON public.loan_offers;
DROP POLICY IF EXISTS "Brokers can view client profiles" ON public.profiles;
DROP POLICY IF EXISTS "Brokers can view all AIP conditions" ON public.aip_conditions;
DROP POLICY IF EXISTS "Brokers can manage AIP conditions" ON public.aip_conditions;
DROP POLICY IF EXISTS "Brokers can view audit logs" ON public.aip_audit_logs;

-- Create new policies: Brokers can only see applications assigned to them
CREATE POLICY "Brokers can view assigned applications" 
ON public.applications 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker') AND assigned_broker_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Brokers can update assigned applications" 
ON public.applications 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'broker') AND assigned_broker_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
);

-- Brokers can only see documents for clients assigned to them
CREATE POLICY "Brokers can view assigned client documents" 
ON public.documents 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.user_id = documents.user_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Brokers can update assigned client documents" 
ON public.documents 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.user_id = documents.user_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Brokers can insert documents for assigned clients" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.user_id = documents.user_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Brokers can only see form data for applications assigned to them
CREATE POLICY "Brokers can view assigned form data" 
ON public.application_form_data 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = application_form_data.application_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Brokers can update assigned form data" 
ON public.application_form_data 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = application_form_data.application_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Brokers can only see pre-eligibility for assigned clients
CREATE POLICY "Brokers can view assigned pre-eligibility data" 
ON public.pre_eligibility_data 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.user_id = pre_eligibility_data.user_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Brokers can only see valuations for assigned applications
CREATE POLICY "Brokers can view assigned valuations" 
ON public.valuations 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = valuations.application_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Brokers can manage assigned valuations" 
ON public.valuations 
FOR ALL 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = valuations.application_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Brokers can only see loan offers for assigned applications
CREATE POLICY "Brokers can view assigned loan offers" 
ON public.loan_offers 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = loan_offers.application_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Brokers can manage assigned loan offers" 
ON public.loan_offers 
FOR ALL 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = loan_offers.application_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Brokers can only see profiles of assigned clients
CREATE POLICY "Brokers can view assigned client profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.user_id = profiles.id 
    AND applications.assigned_broker_id = auth.uid()
  )
);

-- Brokers can only see AIP conditions for assigned applications
CREATE POLICY "Brokers can view assigned AIP conditions" 
ON public.aip_conditions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = aip_conditions.application_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Brokers can manage assigned AIP conditions" 
ON public.aip_conditions 
FOR ALL 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = aip_conditions.application_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Brokers can only see audit logs for assigned applications
CREATE POLICY "Brokers can view assigned audit logs" 
ON public.aip_audit_logs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker') AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = aip_audit_logs.application_id 
    AND applications.assigned_broker_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);