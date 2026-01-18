-- Add policy to allow authenticated users to create their own applications
CREATE POLICY "Users can create their own applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);