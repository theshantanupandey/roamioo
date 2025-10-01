
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANGUAGES: { [key: string]: string } = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'ru': 'Russian'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, sourceLanguage, targetLanguage } = await req.json()

    if (!text) throw new Error('No text provided')
    if (!sourceLanguage) throw new Error('No source language provided')
    if (!targetLanguage) throw new Error('No target language provided')
    
    const sourceLangName = LANGUAGES[sourceLanguage];
    const targetLangName = LANGUAGES[targetLanguage];

    if (!sourceLangName || !targetLangName) {
        throw new Error('Invalid source or target language');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert translator. Translate the user's text from ${sourceLangName} to ${targetLangName}. Respond only with the translated text, without any additional comments or explanations.`,
                },
                {
                    role: 'user',
                    content: text,
                },
            ],
            temperature: 0.3,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${errorText}`)
    }

    const completion = await response.json();
    const translatedText = completion.choices[0].message.content

    return new Response(JSON.stringify({ translatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in translate-text function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
