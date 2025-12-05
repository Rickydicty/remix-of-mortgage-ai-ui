-- Drop the existing check constraint and add a new one with pending_signature
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE public.documents ADD CONSTRAINT documents_status_check 
CHECK (status IN ('pending', 'approved', 'disapproved', 'pending_signature', 'signed'));