const MODEL = 'gpt-5.4-mini';

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
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              `You are a precise bilingual dictionary for language learners.\n` +
              `You receive a word in ${sourceLanguage}, the sentence it appeared in, and a target language ${targetLanguage}.\n\n` +
              `DICTIONARY FORM RULE: The dictionary form is the word with all INFLECTIONAL endings removed while the core lexical word is kept. ` +
              `Remove: plural markers, possessive suffixes, case endings, and on verbs the tense/person/voice/mood endings. Give verbs as the infinitive. ` +
              `Do NOT remove derivational parts that change the word's core meaning (e.g. keep the -çı in ihracatçı, which means "one who exports"). ` +
              `Reduce ALL the way down — do not stop halfway. Use the surrounding sentence to choose the correct reading when a form is ambiguous.\n\n` +
              `EXAMPLES: kaynaklardan → kaynak ; yakıtların → yakıt ; ihracatçısı → ihracatçı ; ` +
              `veriliyor → vermek ; yapılmıştır → yapmak ; minnettarım → minnet ; ` +
              `kahkahalar → kahkaha ; ölçekte → ölçek ; friends → friend ; did → do ; translating → translate\n\n` +
              `Return ONLY a JSON object with these keys:\n` +
              `  base        — the dictionary form in ${sourceLanguage} (verbs as infinitive); for an uninflected word, equal to the word itself.\n` +
              `  isInflected — true if base differs from the input word, else false.\n` +
              `  meaningBase — concise meaning of the DICTIONARY FORM in ${targetLanguage}.\n` +
              `  noteTarget  — a short grammatical note IN ${targetLanguage} explaining the inflection and, where useful, how the word functions in this particular sentence ` +
              `(e.g. "plural with ablative case — here: \\"from sources\\""). Empty string if not inflected.\n` +
              `  noteSource  — the same explanation written IN ${sourceLanguage}. Empty string if not inflected.\n` +
              `Keep notes accurate and short. If unsure of the grammar, leave both notes empty rather than guess. No markdown, no backticks, only the JSON object.`,
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
