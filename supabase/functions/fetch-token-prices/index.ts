import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { ids } = await req.json()
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('Missing or invalid "ids" parameter')
    }

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = Date.now()
    const results: Record<string, any> = {}
    const idsToFetch: string[] = []

    // Check cache first
    const { data: cachedPrices } = await supabase
      .from('token_price_cache')
      .select('*')
      .in('token_id', ids)
      .gte('cached_at', new Date(now - CACHE_DURATION).toISOString())

    if (cachedPrices) {
      for (const cached of cachedPrices) {
        results[cached.token_id] = cached.price_data
      }
    }

    // Determine which IDs need fresh data
    for (const id of ids) {
      if (!results[id]) {
        idsToFetch.push(id)
      }
    }

    // Fetch fresh data from CoinGecko if needed
    if (idsToFetch.length > 0) {
      const idsParam = idsToFetch.join(',')
      const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`
      
      const response = await fetch(coingeckoUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - return cached data if available, otherwise error
          if (Object.keys(results).length > 0) {
            console.warn('CoinGecko rate limited, using cached data')
            return new Response(JSON.stringify(results), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            })
          }
          throw new Error('CoinGecko rate limit exceeded and no cached data available')
        }
        throw new Error(`CoinGecko API error: ${response.status}`)
      }

      const freshData = await response.json()

      // Store in cache and results
      for (const [tokenId, priceData] of Object.entries(freshData)) {
        results[tokenId] = priceData

        // Upsert to cache
        await supabase.from('token_price_cache').upsert({
          token_id: tokenId,
          price_data: priceData,
          cached_at: new Date().toISOString(),
        })
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Error fetching token prices:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch token prices' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
