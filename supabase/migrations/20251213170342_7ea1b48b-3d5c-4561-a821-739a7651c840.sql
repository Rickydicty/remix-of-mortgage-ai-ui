-- Add INSERT policy for clients to create valuations for their applications
CREATE POLICY "Clients can insert valuations for their applications"
ON public.valuations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE applications.id = application_id 
    AND applications.user_id = auth.uid()
  )
);