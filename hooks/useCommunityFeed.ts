import { useState, useCallback } from 'react';
import { Type } from '@google/genai';
import { CommunityTopic } from '../types';
import { supabase } from '../utils/supabase';

const communityFeedSchema = {
    type: Type.OBJECT,
    properties: {
        trendingTopics: {
            type: Type.ARRAY,
            description: "A list of the top 5 trending topics from the provided text.",
            items: {
                type: Type.OBJECT,
                properties: {
                    topic: {
                        type: Type.STRING,
                        description: "The name of the trending topic (e.g., 'Restaking', 'Memecoins')."
                    },
                    sentiment: {
                        type: Type.STRING,
                        enum: ['Positive', 'Negative', 'Neutral'],
                        description: "The overall sentiment of the discussion around this topic."
                    },
                    summary: {
                        type: Type.STRING,
                        description: "A concise, one-sentence summary of what people are saying about this topic."
                    },
                    volume: {
                        type: Type.NUMBER,
                        description: "An estimated discussion volume score from 1 (low) to 10 (high), based on frequency in the source text."
                    }
                },
                required: ['topic', 'sentiment', 'summary', 'volume']
            }
        }
    },
    required: ['trendingTopics']
};

const createPrompt = (): string => {
    return `
      You are an expert crypto market analyst. Your task is to generate a realistic, timely, and diverse list of what's currently trending on "Crypto Twitter".
      
      Based on your knowledge of current conversations in the crypto space, identify 5 trending topics. For each topic, provide a brief summary of the discussion, assess the overall sentiment (Positive, Negative, or Neutral), and estimate the discussion volume on a scale of 1 to 10.

      Topics should be diverse and could include:
      - Popular memecoins (e.g., WIF, PEPE, BONK)
      - Layer 2 scaling solutions (e.g., Arbitrum, Base)
      - New technologies or standards (e.g., ERC-404)
      - Macroeconomic factors (e.g., inflation, regulation)
      - Major ecosystem news (e.g., Ethereum upgrades, Solana performance)
      - The AI + Crypto narrative
      
      Provide your final analysis in the requested JSON format.
    `;
};

export const useCommunityFeed = () => {
    const [topics, setTopics] = useState<CommunityTopic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateFeed = useCallback(async () => {
        setLoading(true);
        setError(null);

        const cachedData = localStorage.getItem('nexus-community-feed');
        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            // If cache is less than 30 minutes old, use it
            if (Date.now() - timestamp < 30 * 60 * 1000) {
                setTopics(data);
                setLoading(false);
                return;
            }
        }

        try {
            const prompt = createPrompt();
            
            const { data, error: functionError } = await supabase.functions.invoke('generate-community-feed', {
                body: { prompt, schema: communityFeedSchema },
            });

            if (functionError) throw functionError;

            const parsedResult = data;

            if (parsedResult.trendingTopics && Array.isArray(parsedResult.trendingTopics)) {
                setTopics(parsedResult.trendingTopics);
                localStorage.setItem('nexus-community-feed', JSON.stringify({ data: parsedResult.trendingTopics, timestamp: Date.now() }));
            } else {
                throw new Error("Invalid response format from AI function.");
            }

        } catch (e) {
            console.error("Error generating community feed:", e);
            setError("Could not generate the community feed at this time. The model may be busy. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Manual refresh invalidates cache
    const refresh = useCallback(() => {
        localStorage.removeItem('nexus-community-feed');
        generateFeed();
    }, [generateFeed]);

    return { topics, loading, error, generateFeed: refresh };
};
