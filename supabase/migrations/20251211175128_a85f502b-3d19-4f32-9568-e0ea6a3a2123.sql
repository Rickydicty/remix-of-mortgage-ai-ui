-- Create notification settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  recipient_email TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage notification settings
CREATE POLICY "Admins can view notification settings"
ON public.notification_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage notification settings"
ON public.notification_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default notification settings
INSERT INTO public.notification_settings (notification_type, enabled, recipient_email, description) VALUES
  ('new_client_signup', true, 'admin@example.com', 'When a new client signs up'),
  ('document_uploaded', true, 'admin@example.com', 'When a client uploads a document'),
  ('application_submitted', true, 'admin@example.com', 'When an application is submitted'),
  ('aip_status_change', true, 'admin@example.com', 'When AIP status changes'),
  ('signature_completed', true, 'admin@example.com', 'When a client completes a signature'),
  ('message_received', false, 'admin@example.com', 'When a new message is received');