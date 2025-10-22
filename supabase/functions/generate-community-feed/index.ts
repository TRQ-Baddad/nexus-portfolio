import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, schema } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt')
    }

    // Retry logic for handling 503 (overloaded) errors
    const maxRetries = 3
    const retryDelays = [1000, 2000, 4000] // Exponential backoff
    
    let geminiResponse
    let lastError
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Use Gemini 2.0 Flash for better stability
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`
        
        const requestBody: any = {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        }

        // Add schema for structured JSON responses if provided
        if (schema) {
          requestBody.generationConfig.responseMimeType = 'application/json'
          requestBody.generationConfig.responseSchema = schema
        }
        
        geminiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (geminiResponse.ok) {
          break // Success
        }

        // Retry on 503
        if (geminiResponse.status === 503 && attempt < maxRetries - 1) {
          console.warn(`Gemini overloaded (attempt ${attempt + 1}/${maxRetries}), retrying...`)
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]))
          continue
        }

        const errorText = await geminiResponse.text()
        lastError = new Error(`Gemini API error (${geminiResponse.status}): ${errorText}`)
        
        if (geminiResponse.status === 503) {
          break // Use fallback
        }
        
        throw lastError
        
      } catch (fetchError) {
        lastError = fetchError
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]))
        }
      }
    }

    // Fallback if all retries failed
    if (!geminiResponse || !geminiResponse.ok) {
      return new Response(JSON.stringify({ 
        reply: 'Community feed is temporarily unavailable. Please try again in a few moments.',
        fallback: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const data = await geminiResponse.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'

    // Parse JSON if schema was used
    let responseData
    if (schema) {
      try {
        responseData = JSON.parse(text)
      } catch (parseError) {
        // Try to extract from markdown
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[1])
        } else {
          throw new Error(`Failed to parse JSON response: ${parseError.message}`)
        }
      }
    } else {
      responseData = { reply: text }
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Community feed error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
