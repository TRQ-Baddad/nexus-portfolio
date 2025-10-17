-- =====================================================
-- NEXUS PORTFOLIO - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Version: 1.0.0
-- Description: Production-ready schema for multi-chain crypto portfolio tracker
-- Features: RLS enabled, optimized indexes, audit logging, extensible design
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SECTION 1: CORE TABLES
-- =====================================================

-- Users table - Core user profiles with preferences and subscription data
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    plan TEXT NOT NULL DEFAULT 'Free' CHECK (plan IN ('Free', 'Pro')),
    role TEXT NOT NULL DEFAULT 'Customer' CHECK (role IN ('Customer', 'Administrator', 'Content Editor', 'Support Agent')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
    last_sign_in_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{
        "theme": "system",
        "language": "en",
        "currency": "USD",
        "dashboardLayout": ["tokens", "wallets", "ai_insights", "nfts_overview", "defi_summary"],
        "isPrivacyMode": false
    }'::jsonb,
    admin_dashboard_layout TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wallets table - User's connected blockchain wallets
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    nickname TEXT,
    blockchain TEXT NOT NULL CHECK (blockchain IN ('ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, address, blockchain)
);

-- Portfolio history - Track portfolio value over time for charts
CREATE TABLE IF NOT EXISTS portfolio_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value NUMERIC(20, 2) NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Whales table - Featured and custom whale wallets for tracking
CREATE TABLE IF NOT EXISTS whales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    blockchain TEXT NOT NULL CHECK (blockchain IN ('ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'base')),
    description TEXT,
    total_value NUMERIC(20, 2) DEFAULT 0,
    change_24h NUMERIC(10, 4) DEFAULT 0,
    is_custom BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(address, blockchain)
);

-- Token watchlist - User's tracked tokens
CREATE TABLE IF NOT EXISTS token_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coingecko_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, coingecko_id)
);

-- Announcements - System-wide announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'pro', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- =====================================================
-- SECTION 2: SUPPORT & ADMIN TABLES
-- =====================================================

-- Support tickets - Customer support system
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Closed')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket replies - Support conversation threads
CREATE TABLE IF NOT EXISTS ticket_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    is_admin_reply BOOLEAN NOT NULL DEFAULT false,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles - Admin role permissions system
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE CHECK (name IN ('Administrator', 'Content Editor', 'Support Agent')),
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings - Global application settings
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Service keys - API key management for external services
CREATE TABLE IF NOT EXISTS service_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_validated TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System events - System health monitoring and logs
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Operational', 'Degraded', 'Outage')),
    message TEXT,
    metric TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin logs - Audit trail for admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Whale segments - Grouped whale wallets (future feature support)
CREATE TABLE IF NOT EXISTS whale_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_predefined BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content articles - CMS for blog/educational content (future feature)
CREATE TABLE IF NOT EXISTS content_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name TEXT,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
    tags TEXT[],
    featured_image_url TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Experiments - A/B testing and feature flags (future feature)
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'feature_flag' CHECK (type IN ('feature_flag', 'ab_test')),
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Paused', 'Completed')),
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'pro', 'sample')),
    sample_rate NUMERIC(5, 2) DEFAULT 100.00 CHECK (sample_rate >= 0 AND sample_rate <= 100),
    config JSONB DEFAULT '{}'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automation rules - Automated workflows (future feature)
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('schedule', 'event', 'webhook')),
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    action_type TEXT NOT NULL CHECK (action_type IN ('email', 'notification', 'webhook', 'database')),
    action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SECTION 3: INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_blockchain ON wallets(blockchain);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);

-- Portfolio history indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_id ON portfolio_history(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_timestamp ON portfolio_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_timestamp ON portfolio_history(user_id, timestamp DESC);

-- Whales indexes
CREATE INDEX IF NOT EXISTS idx_whales_is_featured ON whales(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_whales_is_custom ON whales(is_custom);
CREATE INDEX IF NOT EXISTS idx_whales_blockchain ON whales(blockchain);

-- Token watchlist indexes
CREATE INDEX IF NOT EXISTS idx_token_watchlist_user_id ON token_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_watchlist_coingecko_id ON token_watchlist(coingecko_id);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status) WHERE status = 'Active';
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- Ticket replies indexes
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_created ON ticket_replies(created_at ASC);

-- System events indexes
CREATE INDEX IF NOT EXISTS idx_system_events_service ON system_events(service);
CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_status ON system_events(status);

-- Admin logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- Content articles indexes
CREATE INDEX IF NOT EXISTS idx_content_articles_slug ON content_articles(slug);
CREATE INDEX IF NOT EXISTS idx_content_articles_status ON content_articles(status);
CREATE INDEX IF NOT EXISTS idx_content_articles_published ON content_articles(published_at DESC) WHERE status = 'Published';
CREATE INDEX IF NOT EXISTS idx_content_articles_tags ON content_articles USING GIN(tags);

-- Experiments indexes
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_type ON experiments(type);

-- Automation rules indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_rules_next_run ON automation_rules(next_run_at) WHERE is_active = true;

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE whales ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Users policies (simplified to avoid infinite recursion)
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage users" ON users FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Wallets policies
CREATE POLICY "Users can view their own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wallets" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wallets" ON wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wallets" ON wallets FOR DELETE USING (auth.uid() = user_id);

-- Portfolio history policies
CREATE POLICY "Users can view their own portfolio history" ON portfolio_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own portfolio history" ON portfolio_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Whales policies (public read for featured, admin write via service role)
CREATE POLICY "Anyone can view whales" ON whales FOR SELECT USING (true);
CREATE POLICY "Service role can manage whales" ON whales FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Token watchlist policies
CREATE POLICY "Users can view their own watchlist" ON token_watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to their watchlist" ON token_watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from their watchlist" ON token_watchlist FOR DELETE USING (auth.uid() = user_id);

-- Announcements policies
CREATE POLICY "Active announcements are public" ON announcements FOR SELECT USING (status = 'Active');
CREATE POLICY "Service role can manage announcements" ON announcements FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Support tickets policies
CREATE POLICY "Users can view their own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage tickets" ON support_tickets FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Ticket replies policies
CREATE POLICY "Users can view replies to their tickets" ON ticket_replies FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users can reply to their tickets" ON ticket_replies FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Service role can manage replies" ON ticket_replies FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Roles policies
CREATE POLICY "Authenticated users can view roles" ON roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role can manage roles" ON roles FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Settings policies
CREATE POLICY "Authenticated users can view settings" ON settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role can manage settings" ON settings FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Service keys policies (admin only via service role)
CREATE POLICY "Service role can manage service keys" ON service_keys FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- System events policies
CREATE POLICY "System can insert events" ON system_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage events" ON system_events FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Admin logs policies
CREATE POLICY "Users can create logs" ON admin_logs FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Service role can manage logs" ON admin_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Whale segments policies
CREATE POLICY "Users can view their segments" ON whale_segments FOR SELECT USING (auth.uid() = user_id OR is_predefined = true);
CREATE POLICY "Users can manage their segments" ON whale_segments FOR ALL USING (auth.uid() = user_id);

-- Content articles policies
CREATE POLICY "Published articles are public" ON content_articles FOR SELECT USING (status = 'Published');
CREATE POLICY "Service role can manage articles" ON content_articles FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Experiments policies
CREATE POLICY "Service role can manage experiments" ON experiments FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Automation rules policies
CREATE POLICY "Service role can manage automation" ON automation_rules FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SECTION 5: DATABASE FUNCTIONS (RPC)
-- =====================================================

-- Helper function to get user role (avoids infinite recursion in policies)
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'Customer'
  );
$$;

-- Function: Upgrade user to Pro plan
CREATE OR REPLACE FUNCTION upgrade_user_plan()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users 
    SET plan = 'Pro', updated_at = NOW()
    WHERE id = auth.uid();
END;
$$;

-- Function: Refresh whale portfolio data (called by admin dashboard)
CREATE OR REPLACE FUNCTION refresh_whale_portfolio(whale_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This is a placeholder for future implementation
    -- In production, this would trigger a backend job to fetch fresh whale data
    UPDATE whales 
    SET updated_at = NOW()
    WHERE id = whale_id;
END;
$$;

-- Function: Clean old portfolio history (keep last 90 days)
CREATE OR REPLACE FUNCTION clean_old_portfolio_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM portfolio_history
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;

-- Function: Get user statistics (for admin dashboard)
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    pro_users BIGINT,
    free_users BIGINT,
    suspended_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_users,
        COUNT(*) FILTER (WHERE status = 'Active')::BIGINT as active_users,
        COUNT(*) FILTER (WHERE plan = 'Pro')::BIGINT as pro_users,
        COUNT(*) FILTER (WHERE plan = 'Free')::BIGINT as free_users,
        COUNT(*) FILTER (WHERE status = 'Suspended')::BIGINT as suspended_users
    FROM users;
END;
$$;

-- Function: Get recent activity feed (for admin dashboard)
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

-- Function: Get recent transactions (placeholder - returns empty for now)
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
    -- Returns empty set for now since transactions are not stored in DB
    -- They're fetched from blockchain APIs in real-time
    RETURN;
END;
$$;

-- Function: Get all transactions (placeholder)
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
    -- Returns empty set for now
    RETURN;
END;
$$;

-- =====================================================
-- SECTION 6: TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply update_updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whales_updated_at BEFORE UPDATE ON whales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whale_segments_updated_at BEFORE UPDATE ON whale_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_articles_updated_at BEFORE UPDATE ON content_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Trigger to create user profile automatically on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SECTION 7: STORAGE BUCKETS CONFIGURATION
-- =====================================================

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- SECTION 7B: TABLE ALIASES (VIEWS) FOR ADMIN DASHBOARD
-- =====================================================

-- Create view alias for automation_rules as automations
CREATE OR REPLACE VIEW automations AS SELECT * FROM automation_rules;

-- Create view alias for content_articles as articles  
CREATE OR REPLACE VIEW articles AS SELECT * FROM content_articles;

-- Grant permissions on views
GRANT SELECT, INSERT, UPDATE, DELETE ON automations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON articles TO authenticated, service_role;

-- =====================================================
-- SECTION 8: INITIAL SEED DATA
-- =====================================================

-- Insert default roles with permissions
INSERT INTO roles (name, permissions, description) VALUES
('Administrator', '{
    "User Management": ["view", "create", "edit", "delete", "impersonate"],
    "Whale Management": ["view", "create", "edit", "delete"],
    "Transactions": ["view"],
    "Content": ["view", "create", "edit", "delete"],
    "Announcements": ["view", "create", "edit", "delete"],
    "Support": ["view", "respond"],
    "Analytics": ["view"],
    "Reports": ["view", "export"],
    "System Health": ["view"],
    "Settings": ["view", "edit"],
    "Automations": ["view", "create", "edit", "delete"],
    "Experiments": ["view", "create", "edit", "delete"]
}'::jsonb, 'Full system access with all permissions'),

('Content Editor', '{
    "User Management": ["view"],
    "Content": ["view", "create", "edit", "delete"],
    "Announcements": ["view", "create", "edit"],
    "Analytics": ["view"]
}'::jsonb, 'Can manage content and announcements'),

('Support Agent', '{
    "User Management": ["view"],
    "Support": ["view", "respond"],
    "Transactions": ["view"]
}'::jsonb, 'Can handle customer support tickets')
ON CONFLICT (name) DO NOTHING;

-- Insert default application settings
INSERT INTO settings (id, value, description) VALUES
('appName', '"Nexus"'::jsonb, 'Application name displayed throughout the platform'),
('themeColors', '{
    "primary": "#2563EB",
    "secondary": "#9333EA",
    "success": "#10B981",
    "error": "#EF4444",
    "warning": "#F59E0B"
}'::jsonb, 'Brand theme colors'),
('maintenanceMode', 'false'::jsonb, 'Enable maintenance mode to restrict access'),
('signupEnabled', 'true'::jsonb, 'Allow new user registrations'),
('maxFreeWallets', '3'::jsonb, 'Maximum wallets for free plan users'),
('maxProWallets', '25'::jsonb, 'Maximum wallets for pro plan users')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- Insert sample featured whales (optional - remove if not needed)
INSERT INTO whales (name, address, blockchain, description, total_value, change_24h, is_custom, is_featured) VALUES
('Vitalik Buterin', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'ethereum', 'Ethereum co-founder and lead developer', 0, 0, false, true),
('Wintermute Trading', '0x00000000ae347930bd1e7b0f35588b92280f9e75', 'ethereum', 'Leading algorithmic trading firm in crypto', 0, 0, false, true),
('Justin Sun', 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7', 'solana', 'Founder of TRON and crypto entrepreneur', 0, 0, false, true)
ON CONFLICT (address, blockchain) DO NOTHING;

-- Insert default service keys (placeholders)
INSERT INTO service_keys (service_name, api_key, is_active) VALUES
('Moralis', 'not-configured', false),
('Helius', 'not-configured', false),
('CoinGecko', 'not-configured', true),
('Gemini', 'not-configured', false)
ON CONFLICT (service_name) DO NOTHING;

-- =====================================================
-- SCHEMA VERSION & COMPLETION
-- =====================================================

-- Insert schema version tracking
INSERT INTO settings (id, value, description) VALUES
('schemaVersion', '"1.0.0"'::jsonb, 'Current database schema version'),
('schemaCreatedAt', to_jsonb(NOW()), 'Schema creation timestamp')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
-- 
-- DEPLOYMENT NOTES:
-- 1. Run this schema in your Supabase SQL editor
-- 2. Ensure all extensions are enabled
-- 3. Verify RLS policies are active
-- 4. Test storage bucket permissions
-- 5. Set up environment variables for edge functions
--
-- MAINTENANCE:
-- - Run clean_old_portfolio_history() periodically via cron
-- - Monitor admin_logs for security auditing
-- - Review system_events for service health
--
-- EXTENSIBILITY:
-- - Add new tables as needed (migrations recommended)
-- - Extend permissions in roles table
-- - Add custom functions for business logic
-- - Create additional indexes for new query patterns
-- =====================================================
