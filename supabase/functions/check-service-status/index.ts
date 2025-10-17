// supabase/functions/check-service-status/index.ts
// FIX: Switched to the official, recommended esm.sh CDN for Supabase function types to resolve type definition errors.
/// <reference types="https://esm.sh/@supabase/functions-js@2" />
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

declare const Deno: any;

const checkService = async (serviceName: string) => {
  const startTime = Date.now();
  let status: 'Operational' | 'Degraded' | 'Outage' = 'Operational';
  let metric = '';

  try {
    let res: Response;
    switch (serviceName) {
      case 'Main API': {
        // This check is a proxy for the Supabase API itself. We can't use the client here.
        // Instead, we assume if this function is running, the main API is reachable.
        // A proper check would ping the Supabase REST endpoint directly.
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        res = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { 'apikey': Deno.env.get('SUPABASE_ANON_KEY') }});
        break;
      }
      case 'Database': {
        // Similar to above, DB health is implicit. This is a placeholder.
        res = new Response('ok', { status: 200 }); 
        break;
      }
      case 'Moralis API': {
        const apiKey = Deno.env.get('MORALIS_API_KEY');
        if (!apiKey) throw new Error("Moralis key not configured");
        res = await fetch('https://deep-index.moralis.io/api/v2.2/dateToBlock?chain=eth&date=1', {
          headers: { 'accept': 'application/json', 'X-API-Key': apiKey }
        });
        break;
      }
      case 'Helius API': {
        const apiKey = Deno.env.get('HELIUS_API_KEY');
        if (!apiKey) throw new Error("Helius key not configured");
        res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' })
        });
        break;
      }
      case 'CoinGecko API':
        res = await fetch('https://api.coingecko.com/api/v3/ping');
        break;
      case 'Blockstream API':
        res = await fetch('https://blockstream.info/api/blocks/tip/height');
        break;
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }

    const latency = Date.now() - startTime;
    metric = `${latency}ms`;
    if (!res.ok) status = 'Outage';
    else if (latency > 800) status = 'Degraded';

  } catch (e) {
    status = 'Outage';
    metric = 'Error';
    console.error(`Health check failed for ${serviceName}:`, e.message);
  }

  return { status, metric };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { serviceName } = await req.json();
    if (!serviceName) {
      throw new Error("Missing 'serviceName' in request body.");
    }
    
    const result = await checkService(serviceName);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
