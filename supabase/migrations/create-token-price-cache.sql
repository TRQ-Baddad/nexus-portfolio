-- =====================================================
-- Token Price Cache Table
-- Used by fetch-token-prices Edge Function for caching
-- =====================================================

-- Create token price cache table
CREATE TABLE IF NOT EXISTS token_price_cache (
    token_id TEXT PRIMARY KEY,
    price_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cache expiry queries
CREATE INDEX IF NOT EXISTS idx_token_price_cache_cached_at ON token_price_cache(cached_at);

-- Enable Row Level Security
ALTER TABLE token_price_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_price_cache
-- Allow public read access (prices are public data)
CREATE POLICY "Anyone can read token prices" 
ON token_price_cache FOR SELECT 
USING (true);

-- Only service role can insert/update (Edge Functions)
CREATE POLICY "Service role can manage cache" 
ON token_price_cache FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

-- Auto-cleanup old cache entries (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_price_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM token_price_cache
    WHERE cached_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Optional: Create a scheduled job to run cleanup
-- Run this separately if you want automated cleanup:
-- SELECT cron.schedule('cleanup-token-cache', '0 * * * *', 'SELECT cleanup_old_price_cache()');

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION cleanup_old_price_cache() TO service_role;
