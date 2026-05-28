const MODEL = 'gpt-4.1-nano'; // swap to 'gpt-5.4-mini' for richer output

const LANG_NAMES = {
  tr: 'Turkish', en: 'English', es: 'Spanish', ru: 'Russian',
  fr: 'French',  de: 'German',  ar: 'Arabic',  zh: 'Chinese',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ error: 'define_failed' });
  }

  const { text, sentence = '', sourceLang, targetLang } = req.body || {};

  if (!text || !sourceLang || !targetLang) {
    return res.status(200).json({ error: 'define_failed' });
  }

  const sourceLanguage = LANG_NAMES[sourceLang];
  const targetLanguage = LANG_NAMES[targetLang];

  if (!sourceLanguage || !targetLanguage) {
    return res.status(200).json({ error: 'define_failed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not configured');
    return res.status(502).json({ error: 'define_failed' });
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
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              `You are a precise bilingual dictionary for language learners. ` +
              `You receive a word or short phrase in ${sourceLanguage}, the sentence it appeared in, and a target language ${targetLanguage}. ` +
              `Return ONLY a JSON object with these keys:\n` +
              `  base        — the dictionary/citation form of the word in ${sourceLanguage}: the infinitive for verbs, the nominative singular for nouns. If the input is a phrase of several words, set base to the phrase unchanged.\n` +
              `  isInflected — true if base differs from the input word, else false.\n` +
              `  meaning     — a concise meaning in ${targetLanguage}: at most a few senses, comma-separated. For a phrase, a fluent translation.\n` +
              `  note        — a short, friendly grammatical note in ${targetLanguage} explaining the inflection (e.g. 'negative past tense — "did not run out"'). Empty string if not inflected or not useful.\n` +
              `  example     — one very short example sentence in ${sourceLanguage} with its ${targetLanguage} translation, or empty string.\n` +
              `No markdown, no backticks, no prose outside the JSON object.`,
          },
          {
            role: 'user',
            content: `Word: ${text}\nSentence: ${sentence}\nSource language: ${sourceLanguage}\nTarget language: ${targetLanguage}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI returned HTTP ${response.status}`);
      return res.status(502).json({ error: 'define_failed' });
    }

    const json = await response.json();
    const raw = json.choices?.[0]?.message?.content;

    if (!raw) {
      console.error('OpenAI response contained no content');
      return res.status(502).json({ error: 'define_failed' });
    }

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Define request failed:', err.message);
    return res.status(502).json({ error: 'define_failed' });
  }
}
