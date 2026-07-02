import { parse } from 'node-html-parser';

export default async function handler(req, res) {
  const { word, lang, sourceLang = 'tr' } = req.query;

  const VALID_TARGET_LANGS = ['tr', 'en', 'es', 'fr', 'ru', 'de', 'ar', 'fa', 'hi', 'zh'];
  const VALID_SOURCE_LANGS = ['tr', 'en', 'es', 'fr', 'hi'];

  if (!word || !lang) {
    return res.status(400).json({ error: 'Missing required parameters: word and lang' });
  }
  if (!VALID_TARGET_LANGS.includes(lang)) {
    return res.status(400).json({ error: 'Invalid lang parameter' });
  }
  if (!VALID_SOURCE_LANGS.includes(sourceLang)) {
    return res.status(400).json({ error: 'Invalid sourceLang parameter' });
  }

  try {
    const url = `https://glosbe.com/${sourceLang}/${lang}/${encodeURIComponent(word.trim())}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8,ru;q=0.7',
        'Priority': 'u=0, i',
        'Sec-Ch-Ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return res.status(500).json({ error: `Upstream responded with ${response.status}` });
    }

    const html = await response.text();
    const root = parse(html);

    const translations = parseTranslations(root);
    const examples = parseExamples(root);

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).json({
      word,
      lang,
      translations: translations.slice(0, 5),
      examples: examples.slice(0, 2),
    });
  } catch {
    return res.status(500).json({ error: 'Translation lookup failed' });
  }
}

function parseTranslations(root) {
  try {
    // Primary: h3.translation__item__pharse — current Glosbe layout (class typo is Glosbe's own)
    const primary = root.querySelectorAll('h3.translation__item__pharse');
    const fromPrimary = primary
      .slice(0, 5)
      .map(el => el.text.trim())
      .filter(t => t.length > 0);
    if (fromPrimary.length > 0) return fromPrimary;

    const results = [];

    // Fallback 1: any strong.translation
    const s1 = root.querySelectorAll('strong.translation');
    for (const el of s1) {
      const text = el.text?.trim();
      if (text && !results.includes(text)) results.push(text);
    }
    if (results.length > 0) return results;

    // Fallback 2: [data-testid*="translation"]
    const s2 = root.querySelectorAll('[data-testid*="translation"]');
    for (const el of s2) {
      const text = el.text?.trim();
      if (text && text.length < 60 && !results.includes(text)) results.push(text);
    }

    return results;
  } catch {
    return [];
  }
}

function parseExamples(root) {
  try {
    const results = [];

    // Strategy 1: .examples__item  (standard Glosbe structure)
    // Each item has two sides; we take the target-language side (second child)
    const items = root.querySelectorAll('.examples__item');
    for (const item of items) {
      if (results.length >= 2) break;
      const paras = item.querySelectorAll('p, span.phrase, div > span');
      // Prefer the second child (translation side), fall back to first
      const target = paras[1] || paras[0];
      if (target) {
        const text = target.text?.trim();
        if (text && text.length > 8 && !results.includes(text)) {
          results.push(text);
        }
      }
    }
    if (results.length > 0) return results;

    // Strategy 2: .example elements
    const s2 = root.querySelectorAll('.example');
    for (const el of s2) {
      if (results.length >= 2) break;
      const text = el.text?.trim();
      if (text && text.length > 8 && !results.includes(text)) results.push(text);
    }
    if (results.length > 0) return results;

    // Strategy 3: .sampleSentence  (legacy layout)
    const s3 = root.querySelectorAll('.sampleSentence');
    for (const el of s3) {
      if (results.length >= 2) break;
      const text = el.text?.trim();
      if (text && text.length > 8 && !results.includes(text)) results.push(text);
    }

    return results;
  } catch {
    return [];
  }
}
