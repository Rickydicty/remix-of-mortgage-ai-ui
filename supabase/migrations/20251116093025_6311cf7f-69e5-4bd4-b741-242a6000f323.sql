-- Allow clients to view profiles of brokers assigned to their applications
CREATE POLICY "Clients can view their assigned broker profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.applications
    WHERE applications.assigned_broker_id = profiles.id
      AND applications.user_id = auth.uid()
  )
);