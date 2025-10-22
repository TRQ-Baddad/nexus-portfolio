-- Create token price cache table
CREATE TABLE IF NOT EXISTS token_price_cache (
    token_id TEXT PRIMARY KEY,
    price_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cache expiry queries
CREATE INDEX IF NOT EXISTS idx_token_price_cache_cached_at ON token_price_cache(cached_at);

-- Auto-cleanup old cache entries (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_price_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM token_price_cache
    WHERE cached_at < NOW() - INTERVAL '1 hour';
END;
$$;
