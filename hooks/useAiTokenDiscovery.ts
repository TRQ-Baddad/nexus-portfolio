import { useState, useCallback } from 'react';
import { Type } from '@google/genai';
import { Token } from '../types';
import { supabase } from '../utils/supabase';

export interface AiTokenSuggestion {
    id: string; // coingecko_id
    name: string;
    symbol: string;
    rationale: string;
}

const tokenDiscoverySchema = {
    type: Type.ARRAY,
    description: "A list of 3-5 recommended cryptocurrency tokens.",
    items: {
        type: Type.OBJECT,
        properties: {
            id: {
                type: Type.STRING,
                description: "The token's unique ID from CoinGecko (e.g., 'ethereum', 'dogwifhat')."
            },
            name: {
                type: Type.STRING,
                description: "The full name of the token (e.g., 'Ethereum', 'dogwifhat')."
            },
            symbol: {
                type: Type.STRING,
                description: "The token's ticker symbol (e.g., 'ETH', 'WIF')."
            },
            rationale: {
                type: Type.STRING,
                description: "A concise, one-sentence explanation of why this token is a relevant suggestion for the user."
            }
        },
        required: ['id', 'name', 'symbol', 'rationale']
    }
};

const createPrompt = (userQuery: string, userTokens: Token[]): string => {
    const top5Holdings = userTokens
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(t => `${t.name} (${t.symbol})`)
        .join(', ');

    return `
      You are an expert crypto market analyst. A user of the Nexus Portfolio app is looking for new tokens to add to their watchlist. 
      Your task is to provide 3-5 relevant token suggestions based on their current portfolio and their specific request.

      **Context about the user's current portfolio:**
      - Top holdings include: ${top5Holdings || 'None'}

      **User's specific request:** "${userQuery || 'Suggest some interesting tokens based on my current portfolio.'}"

      **Instructions:**
      1. Analyze the user's request and their current holdings.
      2. Identify 3 to 5 promising or relevant tokens that they are not currently holding.
      3. For each token, you MUST provide its official CoinGecko ID. This is critical.
      4. For each token, provide a concise, one-sentence rationale explaining why it's a good suggestion.
      5. Do not suggest tokens they already hold.
      6. Ensure your entire response is a valid JSON array matching the provided schema.
    `;
};

export const useAiTokenDiscovery = () => {
    const [suggestions, setSuggestions] = useState<AiTokenSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSuggestions = useCallback(async (userQuery: string, userTokens: Token[]) => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);

        try {
            const prompt = createPrompt(userQuery, userTokens);
            
            const { data, error: functionError } = await supabase.functions.invoke('generate-ai-insights', {
                body: { prompt, schema: tokenDiscoverySchema },
            });

            if (functionError) throw functionError;
            
            const parsedResult: AiTokenSuggestion[] = data;
            
            // Filter out tokens the user already holds
            const userSymbols = new Set(userTokens.map(t => t.symbol.toLowerCase()));
            const filteredSuggestions = parsedResult.filter(s => !userSymbols.has(s.symbol.toLowerCase()));

            setSuggestions(filteredSuggestions);

        } catch (e) {
            console.error("Error generating token suggestions:", e);
            setError("Could not generate AI suggestions at this time. Please try a different query or try again later.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { suggestions, isLoading, error, generateSuggestions };
};