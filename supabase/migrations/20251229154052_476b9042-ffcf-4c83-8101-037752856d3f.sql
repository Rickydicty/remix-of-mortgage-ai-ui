-- Create application_journey_state table to track client mortgage journey
CREATE TABLE public.application_journey_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  
  -- Current state
  current_state TEXT NOT NULL DEFAULT 'NOT_STARTED',
  previous_state TEXT,
  state_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Document completion tracking
  documents_submitted JSONB DEFAULT '[]'::jsonb,
  documents_required JSONB DEFAULT '["certified_id", "proof_of_address", "payslips", "current_account_statements", "employment_summary", "salary_cert"]'::jsonb,
  documents_completion_percentage INTEGER DEFAULT 0,
  
  -- Milestones
  docs_started_at TIMESTAMP WITH TIME ZONE,
  docs_complete_at TIMESTAMP WITH TIME ZONE,
  ai_review_started_at TIMESTAMP WITH TIME ZONE,
  human_review_requested_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- AI Decision metadata
  last_evaluation_at TIMESTAMP WITH TIME ZONE,
  evaluation_notes TEXT,
  blockers JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_journey_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own journey state"
  ON public.application_journey_state
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Brokers can view assigned journey states"
  ON public.application_journey_state
  FOR SELECT
  USING (
    (has_role(auth.uid(), 'broker') AND EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_journey_state.application_id
      AND applications.assigned_broker_id = auth.uid()
    ))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins have full access to journey states"
  ON public.application_journey_state
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage journey states"
  ON public.application_journey_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create state change history table
CREATE TABLE public.application_state_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger_reason TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_state_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for history
CREATE POLICY "Clients can view their own state history"
  ON public.application_state_history
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_state_history.application_id
    AND applications.user_id = auth.uid()
  ));

CREATE POLICY "Brokers can view assigned state history"
  ON public.application_state_history
  FOR SELECT
  USING (
    (has_role(auth.uid(), 'broker') AND EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_state_history.application_id
      AND applications.assigned_broker_id = auth.uid()
    ))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert state history"
  ON public.application_state_history
  FOR INSERT
  WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_journey_state_application ON public.application_journey_state(application_id);
CREATE INDEX idx_journey_state_client ON public.application_journey_state(client_id);
CREATE INDEX idx_journey_state_current ON public.application_journey_state(current_state);
CREATE INDEX idx_state_history_application ON public.application_state_history(application_id);