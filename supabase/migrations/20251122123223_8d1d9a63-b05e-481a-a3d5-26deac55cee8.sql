-- Add AIP-related columns to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS aip_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS aip_approved_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS aip_max_term INTEGER,
ADD COLUMN IF NOT EXISTS aip_rate_range_min DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS aip_rate_range_max DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS aip_monthly_repayment DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS aip_issue_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS aip_validity_period INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS aip_lender_name TEXT,
ADD COLUMN IF NOT EXISTS aip_conditions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS aip_letter_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN applications.aip_status IS 'Status of AIP: pending, approved, declined, expired';
COMMENT ON COLUMN applications.aip_conditions IS 'Array of condition objects with type and description';
COMMENT ON COLUMN applications.aip_validity_period IS 'Validity period in days from issue date';