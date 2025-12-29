-- Add milestone-based notification types
INSERT INTO notification_settings (notification_type, recipient_email, description, enabled) VALUES
('journey_started', 'admin@example.com', 'When a new client starts their application (first document)', true),
('docs_complete', 'admin@example.com', 'When client completes all required documents', true),
('human_review_needed', 'admin@example.com', 'When AI flags application for human review', true),
('application_approved', 'admin@example.com', 'When application is approved', true),
('application_rejected', 'admin@example.com', 'When application is rejected', true)
ON CONFLICT DO NOTHING;