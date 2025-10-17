-- =====================================================
-- COMPLETE SERVICE KEYS FIX
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- Drop everything related to service_keys to start fresh
DROP TRIGGER IF EXISTS sync_service_keys_key_value ON service_keys;
DROP FUNCTION IF EXISTS sync_key_value() CASCADE;
DROP POLICY IF EXISTS "Service role can manage service keys" ON service_keys;
DROP TABLE IF EXISTS service_keys CASCADE;
DROP VIEW IF EXISTS service_keys_view CASCADE;

-- Recreate the table with proper schema
CREATE TABLE service_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL UNIQUE,
    api_key TEXT NOT NULL DEFAULT 'not-configured',
    key_value TEXT,
    is_active BOOLEAN DEFAULT false,
    last_validated TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create function to sync key_value with api_key
CREATE OR REPLACE FUNCTION sync_key_value()
RETURNS TRIGGER AS $$
BEGIN
    -- Always set key_value to match api_key
    NEW.key_value := NEW.api_key;
    -- Set updated_at
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER sync_service_keys_key_value
    BEFORE INSERT OR UPDATE ON service_keys
    FOR EACH ROW
    EXECUTE FUNCTION sync_key_value();

-- Enable RLS
ALTER TABLE service_keys ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to read (for admin dashboard)
CREATE POLICY "Authenticated users can view service keys" 
    ON service_keys FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- Allow service role to manage
CREATE POLICY "Service role can manage service keys" 
    ON service_keys FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role');

-- Allow authenticated users to update (for admin dashboard)
CREATE POLICY "Authenticated users can update service keys" 
    ON service_keys FOR UPDATE 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default service keys
INSERT INTO service_keys (service_name, api_key, is_active) VALUES
    ('Gemini', 'not-configured', false),
    ('Moralis', 'not-configured', false),
    ('Helius', 'not-configured', false),
    ('CoinGecko', 'not-configured', true)
ON CONFLICT (service_name) DO NOTHING;

-- Create a view for compatibility
CREATE OR REPLACE VIEW service_keys_view AS
SELECT 
    id, service_name, api_key, key_value,
    is_active, last_validated, created_at, updated_at
FROM service_keys;

-- Grant permissions
GRANT ALL ON service_keys TO authenticated, anon, service_role;
GRANT ALL ON service_keys_view TO authenticated, anon, service_role;

-- Create RPC function to update API keys by service name (avoids UUID issues)
CREATE OR REPLACE FUNCTION update_service_key(
    p_service_name TEXT,
    p_api_key TEXT,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS service_keys AS $$
DECLARE
    v_result service_keys;
BEGIN
    -- Update or insert the service key
    INSERT INTO service_keys (service_name, api_key, is_active)
    VALUES (p_service_name, p_api_key, COALESCE(p_is_active, false))
    ON CONFLICT (service_name) 
    DO UPDATE SET 
        api_key = EXCLUDED.api_key,
        is_active = COALESCE(p_is_active, service_keys.is_active),
        last_validated = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_service_key(TEXT, TEXT, BOOLEAN) TO authenticated, service_role;

-- Create another function to get all service keys (for easier querying)
CREATE OR REPLACE FUNCTION get_service_keys()
RETURNS SETOF service_keys AS $$
BEGIN
    RETURN QUERY SELECT * FROM service_keys ORDER BY service_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_service_keys() TO authenticated, service_role;

-- Verify the setup
SELECT 
    id, service_name, 
    CASE 
        WHEN api_key = 'not-configured' THEN 'not-configured'
        ELSE LEFT(api_key, 10) || '***'
    END as api_key_status,
    is_active, created_at
FROM service_keys
ORDER BY service_name;

-- =====================================================
-- DONE! Now refresh your admin dashboard
-- =====================================================
-- 
-- The admin dashboard can now use these RPC functions:
-- 
-- 1. To update a key:
--    SELECT update_service_key('Gemini', 'your-api-key-here', true);
-- 
-- 2. To get all keys:
--    SELECT * FROM get_service_keys();
--
-- =====================================================
