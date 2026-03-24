-- ============================================
-- Medi Health - Supabase Tables
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Encrypted Data Table (stores encrypted reports)
CREATE TABLE IF NOT EXISTS encrypted_data (
  encryption_id TEXT PRIMARY KEY,
  data_type TEXT NOT NULL CHECK (data_type IN ('text', 'image')),
  encrypted_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_encrypted_data_created_at ON encrypted_data(created_at DESC);

-- Disable RLS for encrypted_data (backend handles auth)
ALTER TABLE encrypted_data ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service key (backend-only access)
CREATE POLICY "Allow all for service role" ON encrypted_data
  FOR ALL USING (true) WITH CHECK (true);


-- 2. Encryption History Table (stores doctor's encryption log)
DROP TABLE IF EXISTS encryption_history;

CREATE TABLE encryption_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  report_type TEXT NOT NULL,
  encryption_type TEXT NOT NULL CHECK (encryption_type IN ('text', 'image')),
  master_key TEXT NOT NULL,
  encryption_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX idx_history_doctor_id ON encryption_history(doctor_id);
CREATE INDEX idx_history_created_at ON encryption_history(created_at DESC);

-- Enable RLS but allow all (backend handles authentication)
ALTER TABLE encryption_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for encryption_history" ON encryption_history
  FOR ALL USING (true) WITH CHECK (true);
