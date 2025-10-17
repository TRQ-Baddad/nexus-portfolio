// supabase/functions/validate-api-key/index.ts
// FIX: Switched to the official, recommended esm.sh CDN for Supabase function types to resolve type definition errors.
/// <reference types="https://esm.sh/@supabase/functions-js@2" />
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { corsHeaders } from '../_shared/cors.ts';

declare const Deno: any;

const validateKey = async (serviceName: string, apiKey: string) => {
    if (!apiKey) return false;
    let isValid = false;

    try {
        switch (serviceName) {
            case 'Gemini': {
                const ai = new GoogleGenerativeAI(apiKey);
                const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent('test');
                const response = await result.response;
                isValid = !!response;
                break;
            }
            case 'Moralis': {
                const res = await fetch('https://deep-index.moralis.io/api/v2.2/dateToBlock?chain=eth&date=1', {
                    headers: { 'accept': 'application/json', 'X-API-Key': apiKey }
                });
                isValid = res.ok;
                break;
            }
            case 'Helius': {
                 const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' })
                });
                if (res.ok) {
                    const data = await res.json();
                    isValid = typeof data.result === 'number';
                }
                break;
            }
            case 'CoinGecko': {
                // Free tier ping doesn't use key, but we check reachability
                const res = await fetch('https://api.coingecko.com/api/v3/ping');
                isValid = res.ok;
                break;
            }
            default:
                isValid = apiKey.length > 10; // Generic fallback
                break;
        }
    } catch (e) {
        console.error(`Validation failed for ${serviceName}:`, e.message);
        isValid = false;
    }
    
    return isValid;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { serviceName, apiKey } = await req.json();
    if (!serviceName || apiKey === undefined) {
      throw new Error("Missing 'serviceName' or 'apiKey' in request body.");
    }
    
    const isValid = await validateKey(serviceName, apiKey);

    return new Response(JSON.stringify({ isValid }), {
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
