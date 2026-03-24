-- ============================================
-- FIX: Update RLS Policies for Medi Health
-- Run this in Supabase SQL Editor
-- ============================================

-- Fix encryption_history table
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Doctors can view own history" ON encryption_history;
DROP POLICY IF EXISTS "Doctors can insert own history" ON encryption_history;
DROP POLICY IF EXISTS "Doctors can delete own history" ON encryption_history;
DROP POLICY IF EXISTS "Allow all for encryption_history" ON encryption_history;
DROP POLICY IF EXISTS "Allow all operations on encryption_history" ON encryption_history;

-- Remove FK constraint to auth.users if it exists
-- (the doctor_id should just be a UUID without FK since we insert via service/anon key)
ALTER TABLE encryption_history DROP CONSTRAINT IF EXISTS encryption_history_doctor_id_fkey;

-- Ensure doctor_id accepts UUID text
ALTER TABLE encryption_history ALTER COLUMN doctor_id TYPE TEXT;

-- Permissive policy (backend handles auth)
CREATE POLICY "Enable all for encryption_history" ON encryption_history
  FOR ALL USING (true) WITH CHECK (true);

-- Fix encrypted_data table
DROP POLICY IF EXISTS "Allow all for service role" ON encrypted_data;
DROP POLICY IF EXISTS "Allow all operations on encrypted_data" ON encrypted_data;

CREATE POLICY "Enable all for encrypted_data" ON encrypted_data
  FOR ALL USING (true) WITH CHECK (true);

-- Fix users table - add service role policy so backend can insert
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;
CREATE POLICY "Service role can do everything" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- Verify
SELECT 'RLS policies updated successfully!' AS message;
