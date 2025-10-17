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
    status, metric, severity, timestamp as created_at
FROM system_events;

-- Grant permissions on views
GRANT ALL ON automations TO authenticated, anon, service_role;
GRANT ALL ON articles TO authenticated, anon, service_role;
GRANT ALL ON logs TO authenticated, anon, service_role;

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

-- Update your account (CHANGE THE EMAIL if different!)
UPDATE users 
SET role = 'Administrator', plan = 'Pro', status = 'Active'
WHERE email = 'vfx.tariq@gmail.com';

-- Verify
SELECT id, email, name, role, plan, status FROM users WHERE email = 'vfx.tariq@gmail.com';

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
