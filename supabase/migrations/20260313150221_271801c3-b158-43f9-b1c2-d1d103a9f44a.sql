
ALTER TABLE public.admin_approvals DROP CONSTRAINT IF EXISTS admin_approvals_application_id_fkey;
ALTER TABLE public.admin_approvals ADD CONSTRAINT admin_approvals_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.agent_action_logs DROP CONSTRAINT IF EXISTS agent_action_logs_application_id_fkey;
ALTER TABLE public.agent_action_logs ADD CONSTRAINT agent_action_logs_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.agent_conversations DROP CONSTRAINT IF EXISTS agent_conversations_application_id_fkey;
ALTER TABLE public.agent_conversations ADD CONSTRAINT agent_conversations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.agent_document_analysis DROP CONSTRAINT IF EXISTS agent_document_analysis_application_id_fkey;
ALTER TABLE public.agent_document_analysis ADD CONSTRAINT agent_document_analysis_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.agent_application_analysis DROP CONSTRAINT IF EXISTS agent_application_analysis_application_id_fkey;
ALTER TABLE public.agent_application_analysis ADD CONSTRAINT agent_application_analysis_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.aip_audit_logs DROP CONSTRAINT IF EXISTS aip_audit_logs_application_id_fkey;
ALTER TABLE public.aip_audit_logs ADD CONSTRAINT aip_audit_logs_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.aip_conditions DROP CONSTRAINT IF EXISTS aip_conditions_application_id_fkey;
ALTER TABLE public.aip_conditions ADD CONSTRAINT aip_conditions_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.application_form_data DROP CONSTRAINT IF EXISTS application_form_data_application_id_fkey;
ALTER TABLE public.application_form_data ADD CONSTRAINT application_form_data_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.application_journey_state DROP CONSTRAINT IF EXISTS application_journey_state_application_id_fkey;
ALTER TABLE public.application_journey_state ADD CONSTRAINT application_journey_state_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.application_state_history DROP CONSTRAINT IF EXISTS application_state_history_application_id_fkey;
ALTER TABLE public.application_state_history ADD CONSTRAINT application_state_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.signatures DROP CONSTRAINT IF EXISTS signatures_application_id_fkey;
ALTER TABLE public.signatures ADD CONSTRAINT signatures_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.loan_offers DROP CONSTRAINT IF EXISTS loan_offers_application_id_fkey;
ALTER TABLE public.loan_offers ADD CONSTRAINT loan_offers_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.valuations DROP CONSTRAINT IF EXISTS valuations_application_id_fkey;
ALTER TABLE public.valuations ADD CONSTRAINT valuations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_application_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;
