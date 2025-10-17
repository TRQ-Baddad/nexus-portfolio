import { useState, useCallback, useEffect, useRef } from 'react';
import { Type } from '@google/genai';
import { Token, PortfolioValue, User, ActiveView, Wallet } from '../types';
import { supabase } from '../utils/supabase';

export interface FirstLookAnalysis {
    greeting: string;
    observation: string;
    suggestionText: string;
    suggestionAction: ActiveView;
}

const firstLookSchema = {
  type: Type.OBJECT,
  properties: {
    greeting: { 
      type: Type.STRING, 
      description: "A friendly, one-sentence greeting that includes the user's first name." 
    },
    observation: { 
      type: Type.STRING, 
      description: "A single, interesting observation about the portfolio. Focus on the largest holding. E.g., 'It looks like your biggest holding is Ethereum, making up 65% of your portfolio.'"
    },
    suggestionText: {
      type: Type.STRING,
      description: "A one-sentence call to action suggesting a relevant next step for the user to take in the app. E.g., 'Why not compare your holdings to a top trader in the Smart Money section?'"
    },
    suggestionAction: {
      type: Type.STRING,
      enum: ['dashboard', 'analytics', 'smart-money', 'nfts', 'defi'],
      description: "The most relevant 'ActiveView' key for your suggestion. E.g., if you suggest Smart Money, use 'smart-money'."
    }
  },
  required: ['greeting', 'observation', 'suggestionText', 'suggestionAction'],
};

const createPrompt = (user: User, tokens: Token[], portfolioValue: PortfolioValue): string => {
    const topToken = tokens.sort((a, b) => b.value - a.value)[0];
    const topTokenPercentage = portfolioValue.total > 0 ? (topToken.value / portfolioValue.total) * 100 : 0;

    return `
      You are Nexus AI, a helpful and insightful crypto portfolio analyst.
      A new user, ${user.name}, has just connected their first wallet. Your task is to provide a very short, personalized "First Look" analysis.

      **Analysis Requirements (must follow JSON schema):**
      1.  **Greeting:** Welcome the user by their first name.
      2.  **Observation:** Make one key observation about their portfolio. Focus on their largest holding, mentioning the asset name and its percentage of the total portfolio.
      3.  **Suggestion:** Propose a single, engaging next step they can take within the Nexus app. Suggest exploring 'Smart Money' if they have diverse assets, 'NFTs' if they have any, or 'Analytics' for a deeper dive.
      4.  **Action Key:** Provide the corresponding navigation key ('smart-money', 'nfts', 'analytics') for your suggestion.

      **User and Portfolio Data:**
      - User Name: ${user.name}
      - Total Portfolio Value: $${portfolioValue.total.toFixed(2)}
      - Top Asset: ${topToken.name} (${topToken.symbol})
      - Top Asset Value: $${topToken.value.toFixed(2)}
      - Top Asset Percentage: ${topTokenPercentage.toFixed(0)}%
      
      Generate the analysis in the required JSON format.
    `;
}

export const useFirstLook = (user: User | null, wallets: Wallet[], tokens: Token[], portfolioValue: PortfolioValue) => {
  const [firstLook, setFirstLook] = useState<FirstLookAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFirstLook, setShowFirstLook] = useState(false);
  const prevWalletCountRef = useRef(wallets.length);

  useEffect(() => {
    const dismissedKey = user ? `nexus-firstlook-dismissed-${user.id}` : null;
    const hasBeenDismissed = dismissedKey ? localStorage.getItem(dismissedKey) === 'true' : false;

    if (!hasBeenDismissed) {
        // If the user previously had 0 wallets and now has 1, trigger the effect.
        if (prevWalletCountRef.current === 0 && wallets.length === 1 && user) {
            setShowFirstLook(true);
            generateFirstLook();
        }
    }
    // Update the ref for the next render.
    prevWalletCountRef.current = wallets.length;
  }, [wallets, user]); // Dependency array includes user to ensure it's available

  const dismissFirstLook = () => {
      setShowFirstLook(false);
      if (user) {
        const dismissedKey = `nexus-firstlook-dismissed-${user.id}`;
        localStorage.setItem(dismissedKey, 'true');
      }
  };

  const generateFirstLook = useCallback(async () => {
    if (!user || tokens.length === 0) {
      return;
    }
    
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = createPrompt(user, tokens, portfolioValue);
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-first-look', {
        body: { prompt, schema: firstLookSchema },
      });

      if (functionError) throw functionError;
      
      setFirstLook(data);

    } catch (e) {
      console.error("Error generating First Look analysis:", e);
      setError("Could not generate your initial analysis at this time.");
      // If AI fails, don't show a broken card
      setShowFirstLook(false);
    } finally {
      setIsGenerating(false);
    }
  }, [user, tokens, portfolioValue]);

  return { firstLook, isGeneratingFirstLook: isGenerating, error, generateFirstLook, showFirstLook, dismissFirstLook };
};
