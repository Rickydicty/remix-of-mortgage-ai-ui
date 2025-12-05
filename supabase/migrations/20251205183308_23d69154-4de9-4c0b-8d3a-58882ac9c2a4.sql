-- Allow brokers to upload documents to any user's folder
CREATE POLICY "Brokers can upload documents for clients"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND has_role(auth.uid(), 'broker'::app_role)
);

-- Allow brokers to read all documents
CREATE POLICY "Brokers can read all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND has_role(auth.uid(), 'broker'::app_role)
);

-- Allow brokers to update documents
CREATE POLICY "Brokers can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND has_role(auth.uid(), 'broker'::app_role)
);

-- Allow brokers to delete documents
CREATE POLICY "Brokers can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND has_role(auth.uid(), 'broker'::app_role)
);