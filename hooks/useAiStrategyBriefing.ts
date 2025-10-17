import { useState, useCallback } from 'react';
import { Type } from '@google/genai';
import { IntelligenceEvent } from '../types';
import { supabase } from '../utils/supabase';

export interface StrategicBriefing {
    keyObservations: string[];
    actionableStrategies: {
        suggestion: string;
        action: string; // e.g., 'nav:smart-money' or 'action:add_watchlist'
    }[];
    riskFactor: string;
}

const briefingSchema = {
  type: Type.OBJECT,
  properties: {
    keyObservations: { 
      type: Type.ARRAY, 
      description: "2-3 insightful, synthesized bullet points connecting different events from the feed.",
      items: { type: Type.STRING }
    },
    actionableStrategies: {
        type: Type.ARRAY,
        description: "2-3 concrete, actionable suggestions for the user. Each suggestion should have a clear call to action and a corresponding action key.",
        items: {
            type: Type.OBJECT,
            properties: {
                suggestion: { type: Type.STRING, description: "The text of the suggestion, e.g., 'Explore DeFi opportunities for your ETH.'"},
                action: { type: Type.STRING, description: "The action key. Use 'nav:[view_id]' for navigation (e.g., 'nav:defi') or 'action:[action_id]' for modals (e.g., 'action:add_watchlist')." }
            },
            required: ['suggestion', 'action']
        }
    },
    riskFactor: { 
      type: Type.STRING, 
      description: "A single sentence identifying the primary risk factor evident from the feed." 
    },
  },
  required: ['keyObservations', 'actionableStrategies', 'riskFactor'],
};


const createPrompt = (feedItems: IntelligenceEvent[]): string => {
    const simplifiedFeed = feedItems.slice(0, 20).map(item => {
         switch (item.type) {
            case 'portfolio_movement':
                const token = item.data as any;
                const dir = token.change24h > 0 ? 'increased' : 'decreased';
                return `User's ${token.symbol} holding ${dir} by ${token.change24h.toFixed(1)}%.`;
            case 'whale_alert':
                const alert = item.data as any;
                return `Whale (${alert.whaleName}) ${alert.transaction.type} ${alert.transaction.tokenSymbol} worth ~$${Math.round(alert.transaction.valueUsd / 1000)}k.`;
            case 'insight':
                const insight = item.data as any;
                return `AI Insight (${insight.type}): ${insight.title} - ${insight.description}`;
            default:
                return '';
        }
    }).filter(Boolean).join('\n');

    return `
      You are a world-class crypto hedge fund analyst providing a strategic briefing to a client based on their personalized intelligence feed.
      Your goal is to synthesize disparate events into a cohesive, actionable narrative. Be concise, insightful, and direct.

      **Intelligence Feed Data:**
      ---
      ${simplifiedFeed}
      ---
      
      **Your Task:**
      Analyze the feed and generate a strategic briefing in the required JSON format.
      1.  **Key Observations:** Find connections between events. Don't just list them. Example: "Whale accumulation in LINK appears to be correlated with its recent price surge in your portfolio."
      2.  **Actionable Strategies:** Provide concrete next steps the user can take inside the Nexus app. The 'action' key is critical.
          - If suggesting they look at a new token type, use action: 'action:add_watchlist'.
          - If suggesting they explore DeFi, use 'nav:defi'.
          - If suggesting they compare with whales, use 'nav:smart-money'.
      3.  **Primary Risk Factor:** Identify the single biggest risk based on the data provided (e.g., concentration, exposure to a struggling narrative).
    `;
};


export const useAiStrategyBriefing = (userId?: string) => {
    const [briefing, setBriefing] = useState<StrategicBriefing | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateBriefing = useCallback(async (feedItems: IntelligenceEvent[], force = false) => {
        const cacheKey = userId ? `nexus-strategy-briefing-${userId}` : null;

        if (!force && cacheKey) {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const { data, timestamp } = JSON.parse(cachedData);
                if (Date.now() - timestamp < 1 * 60 * 60 * 1000) { // 1 hour cache
                    setBriefing(data);
                    return;
                }
            }
        }
        
        if (feedItems.length === 0) {
            setError("There is not enough recent activity to generate a strategic briefing. Interact with the app more to see new insights.");
            setIsGenerating(false);
            return;
        }

        setIsGenerating(true);
        setError(null);
        setBriefing(null);

        try {
            const prompt = createPrompt(feedItems);
            
            const { data, error: functionError } = await supabase.functions.invoke('generate-ai-insights', {
                body: { prompt, schema: briefingSchema },
            });

            if (functionError) throw functionError;
            
            const parsedResult = data;

            setBriefing(parsedResult);
            if (cacheKey) {
                localStorage.setItem(cacheKey, JSON.stringify({ data: parsedResult, timestamp: Date.now() }));
            }

        } catch (e) {
            console.error("Error generating strategy briefing:", e);
            setError("Could not generate your briefing at this time. The model may be busy or the data is insufficient.");
        } finally {
            setIsGenerating(false);
        }
    }, [userId]);

    return { briefing, isGenerating, error, generateBriefing };
};
