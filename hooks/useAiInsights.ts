import { useState, useCallback } from 'react';
import { Type } from '@google/genai';
import { Token, PortfolioValue, User, Insight } from '../types';
import { supabase } from '../utils/supabase';

const aiAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    healthScore: { 
      type: Type.NUMBER, 
      description: "A numerical score from 0 (very high risk) to 100 (very healthy) representing the portfolio's overall health based on diversification, risk, and performance." 
    },
    healthSummary: { 
      type: Type.STRING, 
      description: "A one-sentence, encouraging summary explaining the health score. E.g., 'Excellent diversification and strong recent performance.'" 
    },
    insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['warning', 'info', 'opportunity'], description: "The category of the insight." },
          title: { type: Type.STRING, description: "A concise, catchy title for the insight." },
          description: { type: Type.STRING, description: "A one or two sentence explanation of the insight, written in simple, clear language." },
        },
        required: ['type', 'title', 'description'],
      },
    },
  },
  required: ['healthScore', 'healthSummary', 'insights'],
};

const createPrompt = (tokens: Token[], portfolioValue: PortfolioValue, user: User | null): string => {
    const simplifiedTokens = tokens.map(t => ({
        symbol: t.symbol,
        value: t.value,
        change24h: t.change24h
    })).sort((a,b) => b.value - a.value).slice(0, 10); // Analyze top 10 tokens

    const portfolioSummary = {
        totalValue: portfolioValue.total,
        change24hPercent: portfolioValue.change24hPercent,
        holdings: simplifiedTokens,
    };

    return `
      You are a professional crypto portfolio analyst for an app called Nexus Portfolio.
      Your goal is to provide clear, concise, and actionable analysis to the user.
      Do not use jargon. Be direct and helpful.
      Based on the following portfolio data, generate a comprehensive analysis including a health score, a summary, and 3-4 interesting insights.

      **Analysis Requirements:**
      1.  **Health Score (0-100):** Calculate a score where 100 is a perfectly healthy, diversified, and well-performing portfolio. Consider factors like:
          - High concentration in one asset should lower the score.
          - Poor diversification (e.g., all memecoins) should lower the score.
          - High negative 24h performance should slightly lower the score.
          - A good mix of asset types (L1s, stables, DeFi) should increase the score.
      2.  **Health Summary:** A single, encouraging sentence that reflects the score.
      3.  **Insights (3-4 items):** Prioritize insights about:
          - **High Concentration Risk:** Is the portfolio too heavy in one asset? (Warning)
          - **Diversification:** Comment on the mix of assets. (Info)
          - **Recent Performance:** Highlight top performers or losers. (Info)
          - **Opportunities:** Suggest logical next steps, like exploring related ecosystem tokens. (Opportunity)
      
      User's subscription plan: ${user?.plan || 'Free'}.

      JSON Data:
      ${JSON.stringify(portfolioSummary, null, 2)}
    `;
}

export const useAiInsights = (isProUser: boolean, userId?: string) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [healthSummary, setHealthSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<number | null>(null);


  const generateInsights = useCallback(async (tokens: Token[], portfolioValue: PortfolioValue, user: User | null, force: boolean = false) => {
    if (!isProUser || tokens.length === 0 || !userId) {
      return;
    }
    
    const cacheKey = `nexus-ai-analysis-${userId}`;

    if (!force) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            // If cache is less than 2 hours old, use it
            if (Date.now() - timestamp < 2 * 60 * 60 * 1000) {
                setInsights(data.insights);
                setHealthScore(data.healthScore);
                setHealthSummary(data.healthSummary);
                setLastAnalyzed(timestamp);
                setLoading(false);
                return;
            }
        }
    }
    
    setLoading(true);
    setError(null);

    try {
      const prompt = createPrompt(tokens, portfolioValue, user);
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-ai-insights', {
          body: { prompt, schema: aiAnalysisSchema },
      });

      if (functionError) throw functionError;

      const parsedResult = data;

      if (parsedResult.insights && Array.isArray(parsedResult.insights) && typeof parsedResult.healthScore === 'number' && typeof parsedResult.healthSummary === 'string') {
          const timestamp = Date.now();
          setInsights(parsedResult.insights);
          setHealthScore(parsedResult.healthScore);
          setHealthSummary(parsedResult.healthSummary);
          setLastAnalyzed(timestamp);
          localStorage.setItem(cacheKey, JSON.stringify({ data: parsedResult, timestamp }));
      } else {
          throw new Error("Invalid response format from AI function.");
      }

    } catch (e: any) {
      console.error("Error generating AI insights:", e);
      setError("Could not generate AI insights at this time. The model may be busy. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [isProUser, userId]);

  return { insights, healthScore, healthSummary, loading, error, generateInsights, lastAnalyzed };
};
