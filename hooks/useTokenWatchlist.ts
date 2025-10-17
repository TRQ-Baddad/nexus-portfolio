import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { WatchlistToken } from '../types';

export const useTokenWatchlist = (enabled: boolean, userIdOverride?: string) => {
    const [watchlist, setWatchlist] = useState<WatchlistToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWatchlist = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);

        try {
            let userId = userIdOverride;
            if (!userId) {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id;
            }
            if (!userId) throw new Error("User not authenticated.");

            const { data: watchlistData, error: dbError } = await supabase
                .from('token_watchlist')
                .select('coingecko_id')
                .eq('user_id', userId);
            
            if (dbError) throw dbError;
            if (watchlistData.length === 0) {
                setWatchlist([]);
                setLoading(false);
                return;
            }

            const tokenIds = watchlistData.map(item => item.coingecko_id).join(',');
            
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${tokenIds}`);
            if (!response.ok) throw new Error('Failed to fetch token data from CoinGecko.');

            const marketData = await response.json();

            const formattedWatchlist: WatchlistToken[] = marketData.map((d: any) => ({
                id: d.id,
                symbol: d.symbol.toUpperCase(),
                name: d.name,
                price: d.current_price,
                change24h: d.price_change_percentage_24h,
                logoUrl: d.image,
                marketCap: d.market_cap,
                totalVolume: d.total_volume,
            }));

            setWatchlist(formattedWatchlist);

        } catch (err: any) {
            setError(err.message || 'Could not load watchlist.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [enabled, userIdOverride]);

    useEffect(() => {
        if (enabled) {
            fetchWatchlist();
        }
    }, [enabled, fetchWatchlist]);

    const addToWatchlist = useCallback(async (token: { id: string; symbol: string }) => {
        let userId = userIdOverride;
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }
        if (!userId) return;

        const { error } = await supabase.from('token_watchlist').insert({
            user_id: userId,
            coingecko_id: token.id,
            symbol: token.symbol.toUpperCase(),
        });
        if (error) throw error;
        await fetchWatchlist(); // Refresh to get full data
    }, [userIdOverride, fetchWatchlist]);

    const removeFromWatchlist = useCallback(async (coingeckoId: string) => {
        let userId = userIdOverride;
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }
        if (!userId) return;
        
        const { error } = await supabase.from('token_watchlist').delete()
            .eq('user_id', userId)
            .eq('coingecko_id', coingeckoId);
        
        if (error) throw error;
        setWatchlist(prev => prev.filter(t => t.id !== coingeckoId));
    }, [userIdOverride]);

    return { watchlist, loading, error, addToWatchlist, removeFromWatchlist, refreshWatchlist: fetchWatchlist };
};
