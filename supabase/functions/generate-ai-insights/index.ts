// supabase/functions/generate-ai-insights/index.ts

// Reference the Supabase edge function types for Deno runtime.
/// <reference types="https://esm.sh/@supabase/functions-js@2" />
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Provide a Deno global type for local development environments.
declare const Deno: any;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { prompt, schema } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid prompt' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Retry logic for handling 503 (overloaded) errors
    const maxRetries = 3;
    const retryDelays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
    
    let geminiResponse;
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        // Build request body with optional schema support for structured outputs
        const requestBody: any = {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        };

        // Add schema for structured JSON responses if provided
        if (schema) {
          requestBody.generationConfig.responseMimeType = 'application/json';
          requestBody.generationConfig.responseSchema = schema;
        }
        
        geminiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (geminiResponse.ok) {
          break; // Success - exit retry loop
        }

        // Check if it's a retryable error (503 - Service Unavailable)
        if (geminiResponse.status === 503 && attempt < maxRetries - 1) {
          console.warn(`Gemini API overloaded (attempt ${attempt + 1}/${maxRetries}), retrying in ${retryDelays[attempt]}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
          continue;
        }

        // Non-retryable error or final attempt failed
        const errorText = await geminiResponse.text();
        lastError = new Error(`Gemini API error (${geminiResponse.status}): ${errorText}`);
        
        // If it's a 503 on final attempt, break and use fallback
        if (geminiResponse.status === 503) {
          console.error('Gemini API still overloaded after retries, using fallback');
          break;
        }
        
        throw lastError;
        
      } catch (fetchError) {
        lastError = fetchError;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
        }
      }
    }

    // If all retries failed with 503, return a fallback response
    if (!geminiResponse || !geminiResponse.ok) {
      console.warn('Using fallback response due to Gemini unavailability');
      return new Response(JSON.stringify({ 
        reply: 'AI insights are temporarily unavailable due to high demand. Please try again in a few moments.',
        fallback: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 with fallback message instead of error
      });
    }

    const data = await geminiResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    // Parse JSON if schema was used, otherwise return plain text
    let responseData;
    if (schema) {
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        responseData = { reply: text }; // Fallback if JSON parsing fails
      }
    } else {
      responseData = { reply: text };
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
