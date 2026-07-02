const MODEL = 'gpt-5.4-mini';

const LANG_NAMES = {
  tr: 'Turkish', en: 'English', es: 'Spanish', ru: 'Russian',
  fr: 'French',  de: 'German',  ar: 'Arabic',  zh: 'Chinese',
  fa: 'Persian (Farsi)', hi: 'Hindi',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ error: 'gpt_translate_failed' });
  }

  const { text, sourceLang, targetLang } = req.body || {};

  if (!text || !sourceLang || !targetLang) {
    return res.status(200).json({ error: 'gpt_translate_failed' });
  }

  const sourceLanguage = LANG_NAMES[sourceLang];
  const targetLanguage = LANG_NAMES[targetLang];

  if (!sourceLanguage || !targetLanguage) {
    return res.status(200).json({ error: 'gpt_translate_failed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not configured');
    return res.status(502).json({ error: 'gpt_translate_failed' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              `You translate text from ${sourceLanguage} into ${targetLanguage} for a language learner.\n` +
              `Translate the given text naturally and accurately, preserving its tone and register.\n` +
              `Return ONLY a JSON object with a single key "translation" whose value is the ${targetLanguage} translation. ` +
              `No notes, no alternatives, no transliteration, no markdown, no backticks — only the JSON object.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const errBody = await response.json();
        detail = errBody?.error?.message || errBody?.message || detail;
      } catch {}
      console.error(`OpenAI translate failed: ${detail}`);
      return res.status(502).json({ error: 'gpt_translate_failed', detail });
    }

    const json = await response.json();
    const raw = json.choices?.[0]?.message?.content;

    if (!raw) {
      console.error('OpenAI response contained no content');
      return res.status(502).json({ error: 'gpt_translate_failed' });
    }

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({ translation: parsed.translation });
  } catch (err) {
    console.error('GPT translate request failed:', err.message);
    return res.status(502).json({ error: 'gpt_translate_failed', detail: err.message });
  }
}
