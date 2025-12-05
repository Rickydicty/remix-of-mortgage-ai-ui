-- Allow brokers to insert documents for any user (for signature uploads)
CREATE POLICY "Brokers can insert documents for clients"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'broker'::app_role)
);