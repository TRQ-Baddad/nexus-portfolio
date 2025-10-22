-- =====================================================
-- ADMIN DASHBOARD COMPLETE FIX
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Fix Table Aliases
-- =====================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS automations CASCADE;
DROP VIEW IF EXISTS articles CASCADE;
DROP VIEW IF EXISTS logs CASCADE;

-- Create proper views with all columns
CREATE VIEW automations AS 
SELECT 
    id, name, description, trigger_type, trigger_config, 
    action_type, action_config, is_active, last_run_at, 
    next_run_at, run_count, created_at, updated_at
FROM automation_rules;

CREATE VIEW articles AS 
SELECT 
    id, title, slug, content, excerpt, author_id, author_name,
    status, tags, featured_image_url, published_at, created_at, updated_at
FROM content_articles;

CREATE VIEW logs AS 
SELECT 
    id, service as type, message as description, 
    status, metric, severity, timestamp as created_at,
    timestamp  -- Keep original timestamp column too
FROM system_events;

-- Create view for service_keys with column alias for compatibility
CREATE OR REPLACE VIEW public.service_keys_view AS
SELECT 
    id, service_name, api_key, api_key as key_value,
    is_active, last_validated, created_at, updated_at
FROM service_keys;

-- Grant permissions on views
GRANT ALL ON automations TO authenticated, anon, service_role;
GRANT ALL ON articles TO authenticated, anon, service_role;
GRANT ALL ON logs TO authenticated, anon, service_role;
GRANT ALL ON service_keys_view TO authenticated, anon, service_role;

-- =====================================================
-- PART 1B: Create Missing Tables
-- =====================================================

-- Service keys table for API key management
CREATE TABLE IF NOT EXISTS service_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    key_value TEXT,  -- Alias column for compatibility
    is_active BOOLEAN DEFAULT true,
    last_validated TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create trigger to keep key_value in sync with api_key
CREATE OR REPLACE FUNCTION sync_key_value()
RETURNS TRIGGER AS $$
BEGIN
    NEW.key_value := NEW.api_key;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_service_keys_key_value ON service_keys;
CREATE TRIGGER sync_service_keys_key_value
    BEFORE INSERT OR UPDATE OF api_key ON service_keys
    FOR EACH ROW
    EXECUTE FUNCTION sync_key_value();

-- Enable RLS on service_keys
ALTER TABLE service_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create it
DROP POLICY IF EXISTS "Service role can manage service keys" ON service_keys;
CREATE POLICY "Service role can manage service keys" ON service_keys 
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Insert default service key placeholders
INSERT INTO service_keys (service_name, api_key, is_active) VALUES
    ('Moralis', 'not-configured', false),
    ('Helius', 'not-configured', false),
    ('CoinGecko', 'not-configured', true),  -- CoinGecko free tier doesn't need key
    ('Gemini', 'not-configured', false)
ON CONFLICT (service_name) DO NOTHING;

-- =====================================================
-- PART 2: Add Missing RPC Functions
-- =====================================================

-- Get recent transactions (placeholder - transactions from blockchain APIs)
CREATE OR REPLACE FUNCTION get_recent_transactions()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    amount NUMERIC,
    type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Returns empty since transactions come from blockchain APIs, not DB
    RETURN;
END;
$$;

-- Get all transactions (placeholder)
CREATE OR REPLACE FUNCTION get_all_transactions(
    search_query TEXT DEFAULT NULL,
    type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    amount NUMERIC,
    type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN;
END;
$$;

-- Get recent activity feed
CREATE OR REPLACE FUNCTION get_recent_activity_feed()
RETURNS TABLE (
    id UUID,
    type TEXT,
    description TEXT,
    user_email TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.action as type,
        COALESCE(al.details->>'description', al.action) as description,
        u.email as user_email,
        al.created_at
    FROM admin_logs al
    LEFT JOIN users u ON u.id = al.admin_id
    ORDER BY al.created_at DESC
    LIMIT 50;
END;
$$;

-- =====================================================
-- PART 3: Enable RLS on views (if needed)
-- =====================================================

-- Views inherit RLS from base tables, but we can add explicit policies

-- =====================================================
-- PART 4: Set your account as Administrator
-- =====================================================
-- IMPORTANT: Replace 'your-email@example.com' with YOUR actual email address!

-- Update your account to Administrator
UPDATE users 
SET role = 'Administrator', plan = 'Pro', status = 'Active'
WHERE email = 'your-email@example.com';  -- ⚠️ REPLACE THIS!

-- Verify the update worked
SELECT id, email, name, role, plan, status 
FROM users 
WHERE email = 'your-email@example.com';  -- ⚠️ REPLACE THIS!

-- =====================================================
-- PART 5: Create sample data (optional - for testing)
-- =====================================================

-- Add a sample announcement
INSERT INTO announcements (title, message, type, status)
VALUES 
    ('Welcome to Nexus Portfolio', 'Your multi-chain crypto portfolio tracker is ready!', 'info', 'Active')
ON CONFLICT DO NOTHING;

-- Add a sample system event
INSERT INTO system_events (service, status, message, severity)
VALUES 
    ('Admin Dashboard', 'Operational', 'Admin dashboard initialized successfully', 'info')
ON CONFLICT DO NOTHING;

-- =====================================================
-- DONE! Refresh your admin dashboard now.
-- =====================================================
