-- Add cover letter fields to application_form_data table
ALTER TABLE public.application_form_data
ADD COLUMN IF NOT EXISTS cover_letter_client_background TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_mortgage_purpose TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_mortgage_amount NUMERIC,
ADD COLUMN IF NOT EXISTS cover_letter_property_details TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_pra_details TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_bof_details TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_employment_summary TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_additional_info TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cover_letter_completed_at TIMESTAMP WITH TIME ZONE;