-- Add column to track if progress email has been sent
ALTER TABLE public.application_form_data 
ADD COLUMN IF NOT EXISTS progress_email_sent BOOLEAN DEFAULT false;

-- Add notification type for form progress
INSERT INTO public.notification_settings (notification_type, recipient_email, description, enabled)
VALUES ('form_progress', 'support@yourkey.ie', 'When a client reaches 50% form completion', true)
ON CONFLICT (notification_type) DO NOTHING;