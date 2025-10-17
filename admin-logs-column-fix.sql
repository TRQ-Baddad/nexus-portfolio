-- =====================================================
-- FIX ADMIN_LOGS TABLE - Add missing target_user_id column
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add target_user_id as an alias/alternative to target_id
ALTER TABLE admin_logs ADD COLUMN IF NOT EXISTS target_user_id UUID;

-- Create a trigger to keep both columns in sync
CREATE OR REPLACE FUNCTION sync_admin_logs_target()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync target_user_id with target_id
    IF NEW.target_user_id IS NOT NULL AND NEW.target_id IS NULL THEN
        NEW.target_id := NEW.target_user_id;
    END IF;
    IF NEW.target_id IS NOT NULL AND NEW.target_user_id IS NULL THEN
        NEW.target_user_id := NEW.target_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_admin_logs_target_columns ON admin_logs;
CREATE TRIGGER sync_admin_logs_target_columns
    BEFORE INSERT OR UPDATE ON admin_logs
    FOR EACH ROW
    EXECUTE FUNCTION sync_admin_logs_target();

-- Update existing rows to sync the columns
UPDATE admin_logs SET target_user_id = target_id WHERE target_id IS NOT NULL;

-- Verify
SELECT COUNT(*) as total_logs FROM admin_logs;
