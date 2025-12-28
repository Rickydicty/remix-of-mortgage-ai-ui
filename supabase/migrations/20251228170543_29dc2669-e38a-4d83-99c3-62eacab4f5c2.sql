-- Create table for AI agent analysis results
CREATE TABLE public.agent_document_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  
  -- Extracted data
  extracted_data JSONB DEFAULT '{}'::jsonb,
  
  -- Risk assessment
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_flags JSONB DEFAULT '[]'::jsonb,
  
  -- AI commentary
  broker_commentary TEXT,
  client_explanation TEXT,
  
  -- Quality assessment
  quality_issues JSONB DEFAULT '[]'::jsonb,
  completeness_score INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for overall application AI analysis
CREATE TABLE public.agent_application_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE,
  client_id UUID NOT NULL,
  
  -- Overall risk assessment
  overall_risk_level TEXT NOT NULL DEFAULT 'pending' CHECK (overall_risk_level IN ('pending', 'low', 'medium', 'high')),
  aggregated_flags JSONB DEFAULT '[]'::jsonb,
  
  -- Eligibility estimation
  estimated_approval_amount NUMERIC,
  estimated_monthly_payment NUMERIC,
  estimated_interest_range JSONB,
  
  -- Program matching
  recommended_programs JSONB DEFAULT '[]'::jsonb,
  
  -- Lender readiness
  submission_ready BOOLEAN DEFAULT false,
  open_items JSONB DEFAULT '[]'::jsonb,
  readiness_score INTEGER DEFAULT 0,
  
  -- Agent summary
  broker_summary TEXT,
  client_summary TEXT,
  
  -- Status
  last_analysis_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  requires_human_review BOOLEAN DEFAULT false,
  handoff_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for agent-client conversations
CREATE TABLE public.agent_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  
  role TEXT NOT NULL CHECK (role IN ('agent', 'client', 'system')),
  message TEXT NOT NULL,
  
  -- Message metadata
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'document_request', 'status_update', 'flag_explanation', 'handoff')),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for agent action logs
CREATE TABLE public.agent_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  
  -- What triggered it
  trigger_type TEXT CHECK (trigger_type IN ('document_upload', 'scheduled', 'manual', 'status_change')),
  
  -- Results
  result JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_application_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_document_analysis
CREATE POLICY "Brokers can view assigned analysis" ON public.agent_document_analysis
  FOR SELECT USING (
    (has_role(auth.uid(), 'broker') AND EXISTS (
      SELECT 1 FROM applications WHERE applications.id = agent_document_analysis.application_id 
      AND applications.assigned_broker_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert analysis" ON public.agent_document_analysis
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update analysis" ON public.agent_document_analysis
  FOR UPDATE USING (true);

-- RLS policies for agent_application_analysis
CREATE POLICY "Brokers can view assigned app analysis" ON public.agent_application_analysis
  FOR SELECT USING (
    (has_role(auth.uid(), 'broker') AND EXISTS (
      SELECT 1 FROM applications WHERE applications.id = agent_application_analysis.application_id 
      AND applications.assigned_broker_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Clients can view their app analysis" ON public.agent_application_analysis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM applications WHERE applications.id = agent_application_analysis.application_id 
    AND applications.user_id = auth.uid())
  );

CREATE POLICY "System can manage app analysis" ON public.agent_application_analysis
  FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for agent_conversations
CREATE POLICY "Clients can view their conversations" ON public.agent_conversations
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert messages" ON public.agent_conversations
  FOR INSERT WITH CHECK (auth.uid() = client_id AND role = 'client');

CREATE POLICY "Brokers can view assigned conversations" ON public.agent_conversations
  FOR SELECT USING (
    (has_role(auth.uid(), 'broker') AND EXISTS (
      SELECT 1 FROM applications WHERE applications.id = agent_conversations.application_id 
      AND applications.assigned_broker_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert agent messages" ON public.agent_conversations
  FOR INSERT WITH CHECK (role IN ('agent', 'system'));

CREATE POLICY "System can update conversations" ON public.agent_conversations
  FOR UPDATE USING (true);

-- RLS policies for agent_action_logs
CREATE POLICY "Brokers can view assigned logs" ON public.agent_action_logs
  FOR SELECT USING (
    (has_role(auth.uid(), 'broker') AND EXISTS (
      SELECT 1 FROM applications WHERE applications.id = agent_action_logs.application_id 
      AND applications.assigned_broker_id = auth.uid()
    )) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert logs" ON public.agent_action_logs
  FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_agent_document_analysis_updated_at
  BEFORE UPDATE ON public.agent_document_analysis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_agent_application_analysis_updated_at
  BEFORE UPDATE ON public.agent_application_analysis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();