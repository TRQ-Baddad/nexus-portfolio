import { useState, useEffect, useCallback } from 'react';
import { Type } from '@google/genai';
import { User, PortfolioValue, Insight, Alert, CommunityTopic, MorningBrief } from '../types';
import { supabase } from '../utils/supabase';

interface UseMorningBriefProps {
    user: User | null;
    portfolioValue: PortfolioValue;
    insights: Insight[];
    alerts: Alert[];
    topics: CommunityTopic[];
    enabled: boolean;
}

const morningBriefSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING, description: "A short, engaging, personalized headline for the morning brief. e.g., 'Good morning, [User Name]. Here is your portfolio snapshot.'" },
        portfolioSummary: { type: Type.STRING, description: "A one-sentence summary of the portfolio's 24h performance, mentioning the total value and percentage change." },
        topInsight: { type: Type.STRING, description: "A concise version of the most critical insight provided (e.g., a high concentration warning)." },
        whaleWatch: { type: Type.STRING, description: "A one-sentence summary of the most interesting recent whale transaction provided." },
        marketPulse: { type: Type.STRING, description: "A brief, one-sentence summary of the top trending topic from the community feed." },
    },
    required: ['headline', 'portfolioSummary', 'topInsight', 'whaleWatch', 'marketPulse'],
};

const createBriefPrompt = (
    user: User,
    portfolioValue: PortfolioValue,
    topInsight: Insight | undefined,
    latestAlert: Alert | undefined,
    topTopic: CommunityTopic | undefined
): string => {
    const portfolioSnapshot = `Total Value: $${portfolioValue.total.toFixed(2)}, 24h Change: ${portfolioValue.change24hPercent.toFixed(2)}%`;

    return `
    You are Nexus AI, a helpful crypto portfolio analyst. Generate a personalized "Morning Brief" for a user named ${user.name.split(' ')[0]}.
    The brief must be extremely concise, professional, and insightful. Each section should be a single, impactful sentence.
    
    Use the following data to construct the brief according to the JSON schema.

    - **User Name:** ${user.name}
    - **Portfolio Snapshot:** ${portfolioSnapshot}
    - **Most Important Insight:** ${topInsight ? `${topInsight.title}: ${topInsight.description}` : "No specific insights today."}
    - **Latest Whale Alert:** ${latestAlert ? `${latestAlert.whaleName} ${latestAlert.transaction.type === 'send' ? 'sent' : 'received'} ${latestAlert.transaction.amount.toFixed(2)} ${latestAlert.transaction.tokenSymbol} (worth ~$${latestAlert.transaction.valueUsd.toFixed(0)})` : "No significant whale activity to report."}
    - **Top Market Topic:** ${topTopic ? `${topTopic.topic} is trending with ${topTopic.sentiment.toLowerCase()} sentiment. Summary: ${topTopic.summary}` : "The market is quiet."}

    Generate the response in the required JSON format.
    `;
};

export const useMorningBrief = ({ user, portfolioValue, insights, alerts, topics, enabled }: UseMorningBriefProps) => {
    const [brief, setBrief] = useState<MorningBrief | null>(null);
    const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
    const [shouldShowBrief, setShouldShowBrief] = useState(false);

    const checkAndGenerateBrief = useCallback(async () => {
        if (!enabled || !user || user.plan !== 'Pro' || portfolioValue.total === 0) {
            return;
        }

        const lastShownKey = `nexus-brief-last-shown-${user.id}`;
        const lastShown = localStorage.getItem(lastShownKey);
        const today = new Date().toDateString();

        if (lastShown === today) {
            return;
        }

        setIsGeneratingBrief(true);
        setShouldShowBrief(true);

        try {
            const topInsight = insights.find(i => i.type === 'warning') || insights[0];
            const latestAlert = alerts[0];
            const topTopic = topics.sort((a,b) => b.volume - a.volume)[0];

            const prompt = createBriefPrompt(user, portfolioValue, topInsight, latestAlert, topTopic);
            
            const { data, error } = await supabase.functions.invoke('generate-morning-brief', {
                body: { prompt, schema: morningBriefSchema },
            });

            if (error) throw error;
            
            setBrief(data);

        } catch (error) {
            console.error("Failed to generate morning brief:", error);
            // If generation fails, just close the modal and don't show it again today
            setShouldShowBrief(false);
            localStorage.setItem(lastShownKey, new Date().toDateString());
        } finally {
            setIsGeneratingBrief(false);
        }

    }, [enabled, user, portfolioValue, insights, alerts, topics]);
    
    useEffect(() => {
        // Trigger the check when the necessary data becomes available
        if(enabled) {
            checkAndGenerateBrief();
        }
    }, [enabled, checkAndGenerateBrief]);

    const markBriefAsShown = () => {
        setShouldShowBrief(false);
        if (user) {
            const lastShownKey = `nexus-brief-last-shown-${user.id}`;
            localStorage.setItem(lastShownKey, new Date().toDateString());
        }
    };

    return { shouldShowBrief, brief, isGeneratingBrief, markBriefAsShown };
};
