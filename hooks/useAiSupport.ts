import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const createPrompt = (
    subject: string, 
    message: string, 
    faqContext: { question: string; answer: string }[]
): string => {
    const faqString = faqContext.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

    return `
      You are a helpful and empathetic customer support agent for Nexus Portfolio, a crypto portfolio tracker.
      Your goal is to provide a clear, concise, and helpful answer to a user's question before they submit a support ticket.
      
      Use the provided Frequently Asked Questions (FAQ) as your primary knowledge base. If the user's question is answered in the FAQ, summarize the relevant answer.
      If the question is not in the FAQ, try to provide a logical and helpful response based on the context of a crypto portfolio application.
      Keep your answer to 2-3 sentences maximum. Be friendly and direct.

      **Knowledge Base (FAQ):**
      ---
      ${faqString}
      ---
      
      **User's Query:**
      - Subject: "${subject}"
      - Message: "${message}"

      Now, provide a helpful and concise answer to the user's query.
    `;
};

export const useAiSupport = () => {
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSuggestion = useCallback(async (
        subject: string, 
        message: string, 
        faqContext: { question: string; answer: string }[]
    ) => {
        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const prompt = createPrompt(subject, message, faqContext);
            
            const { data, error: functionError } = await supabase.functions.invoke('generate-ai-insights', {
                body: { prompt },
            });

            if (functionError) throw functionError;

            setSuggestion(data.reply);

        } catch (e) {
            console.error("Error generating support suggestion:", e);
            setError("Could not generate a suggestion at this time.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { suggestion, isLoading, error, getSuggestion };
};
