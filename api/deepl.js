export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ error: 'deepl_unavailable' });
  }

  const { text, targetLang } = req.body || {};

  if (!text || !targetLang) {
    return res.status(200).json({ error: 'deepl_unavailable' });
  }

  const VALID_TARGET_LANGS = ['TR', 'EN', 'ES', 'FR', 'RU', 'DE', 'AR', 'ZH'];
  if (!VALID_TARGET_LANGS.includes(targetLang)) {
    return res.status(200).json({ error: 'deepl_unavailable' });
  }

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.error('DEEPL_API_KEY environment variable is not configured');
    return res.status(200).json({ error: 'deepl_unavailable' });
  }

  try {
    const body = new URLSearchParams();
    body.append('text', text);
    body.append('target_lang', targetLang);

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (response.status === 456) {
      console.error('DeepL quota exceeded (HTTP 456)');
      return res.status(200).json({ error: 'quota_exceeded' });
    }

    if (!response.ok) {
      console.error(`DeepL returned HTTP ${response.status}`);
      return res.status(200).json({ error: 'deepl_unavailable' });
    }

    const json = await response.json();
    const result = json.translations?.[0];

    if (!result) {
      console.error('DeepL response contained no translations');
      return res.status(200).json({ error: 'deepl_unavailable' });
    }

    return res.status(200).json({
      translation: result.text,
      detectedSourceLang: result.detected_source_language,
    });
  } catch (err) {
    console.error('DeepL request failed:', err.message);
    return res.status(200).json({ error: 'deepl_unavailable' });
  }
}
