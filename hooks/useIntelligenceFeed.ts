import { useMemo } from 'react';
import { Token, Alert, Insight, IntelligenceEvent } from '../types';

interface Props {
    tokens: Token[];
    alerts: Alert[];
    insights: Insight[];
}

export const useIntelligenceFeed = ({ tokens, alerts, insights }: Props): IntelligenceEvent[] => {
    
    const SIGNIFICANT_CHANGE_THRESHOLD = 10; // +/- 10%

    const feed = useMemo(() => {
        const events: IntelligenceEvent[] = [];

        // 1. Process Portfolio Movements
        tokens.forEach(token => {
            if (Math.abs(token.change24h) >= SIGNIFICANT_CHANGE_THRESHOLD) {
                events.push({
                    id: `pm-${token.id}`,
                    type: 'portfolio_movement',
                    timestamp: new Date().toISOString(), // Use current time as it's a "24h change" event
                    data: token,
                });
            }
        });

        // 2. Process Whale Alerts
        alerts.forEach(alert => {
            events.push({
                id: `wa-${alert.id}`,
                type: 'whale_alert',
                timestamp: alert.timestamp,
                data: alert,
            });
        });

        // 3. Process AI Insights
        // Give insights a timestamp of now, minus a few seconds to feel recent
        insights.forEach((insight, index) => {
             events.push({
                id: `in-${insight.title.replace(/\s/g, '')}`,
                type: 'insight',
                timestamp: new Date(Date.now() - (index * 1000)).toISOString(),
                data: insight,
            });
        });

        // Sort all events chronologically, newest first
        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    }, [tokens, alerts, insights]);

    return feed;
};