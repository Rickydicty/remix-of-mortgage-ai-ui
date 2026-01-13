-- Add policy for brokers to INSERT form data for their assigned clients
CREATE POLICY "Brokers can insert form data for assigned clients"
ON public.application_form_data
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'broker'::app_role) AND 
   EXISTS (
     SELECT 1 FROM applications 
     WHERE applications.id = application_id 
     AND applications.assigned_broker_id = auth.uid()
   ))
  OR has_role(auth.uid(), 'admin'::app_role)
);