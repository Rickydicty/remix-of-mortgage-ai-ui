-- Add unique constraint on document_id for the agent_document_analysis table
-- This allows upsert operations to work correctly

ALTER TABLE public.agent_document_analysis
ADD CONSTRAINT agent_document_analysis_document_id_unique UNIQUE (document_id);