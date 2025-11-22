-- Add AIP management fields to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS aip_submitted_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aip_approved_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aip_turnaround_hours INTEGER,
ADD COLUMN IF NOT EXISTS aip_assigned_underwriter TEXT,
ADD COLUMN IF NOT EXISTS aip_ai_prediction JSONB,
ADD COLUMN IF NOT EXISTS aip_underwriter_notes TEXT,
ADD COLUMN IF NOT EXISTS aip_internal_messages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS aip_risk_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS aip_eligibility_score INTEGER,
ADD COLUMN IF NOT EXISTS aip_affordability_data JSONB;

-- Create table for AIP conditions with severity
CREATE TABLE IF NOT EXISTS aip_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- info, warning, critical
  status TEXT NOT NULL DEFAULT 'pending', -- satisfied, pending, flagged, missing
  assigned_to TEXT, -- broker or client
  document_ids JSONB DEFAULT '[]'::jsonb,
  override_reason TEXT,
  overridden_by UUID,
  overridden_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for AIP audit logs
CREATE TABLE IF NOT EXISTS aip_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  actor_id UUID,
  actor_type TEXT, -- broker, ai, system, client
  changes JSONB,
  document_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for valuation workflow
CREATE TABLE IF NOT EXISTS valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, ordered, scheduled, completed, failed
  valuer_name TEXT,
  valuer_contact TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE,
  report_url TEXT,
  valuation_amount DECIMAL(12,2),
  ordered_by UUID,
  ordered_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE aip_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aip_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

-- RLS policies for aip_conditions
CREATE POLICY "Brokers can view all AIP conditions"
  ON aip_conditions FOR SELECT
  USING (has_role(auth.uid(), 'broker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can manage AIP conditions"
  ON aip_conditions FOR ALL
  USING (has_role(auth.uid(), 'broker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for aip_audit_logs
CREATE POLICY "Brokers can view audit logs"
  ON aip_audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'broker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
  ON aip_audit_logs FOR INSERT
  WITH CHECK (true);

-- RLS policies for valuations
CREATE POLICY "Brokers can view all valuations"
  ON valuations FOR SELECT
  USING (has_role(auth.uid(), 'broker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can manage valuations"
  ON valuations FOR ALL
  USING (has_role(auth.uid(), 'broker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view their valuations"
  ON valuations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = valuations.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_aip_conditions_updated_at
  BEFORE UPDATE ON aip_conditions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_valuations_updated_at
  BEFORE UPDATE ON valuations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Comments
COMMENT ON TABLE aip_conditions IS 'Stores AIP conditions with severity and document mapping';
COMMENT ON TABLE aip_audit_logs IS 'Comprehensive audit trail for all AIP actions';
COMMENT ON TABLE valuations IS 'Tracks property valuation workflow';