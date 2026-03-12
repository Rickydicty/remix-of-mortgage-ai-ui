-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON public.documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own applications
CREATE POLICY "Users can delete their own applications"
ON public.applications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own form data
CREATE POLICY "Users can delete their own form data"
ON public.application_form_data
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own signatures
CREATE POLICY "Users can delete their own signatures"
ON public.signatures
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);