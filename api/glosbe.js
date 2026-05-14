import { parse } from 'node-html-parser';

export default async function handler(req, res) {
  const { word, lang } = req.query;

  if (!word || !lang) {
    return res.status(400).json({ error: 'Missing required parameters: word and lang' });
  }
  if (lang !== 'ru' && lang !== 'en') {
    return res.status(400).json({ error: 'lang must be "ru" or "en"' });
  }

  try {
    const url = `https://glosbe.com/tr/${lang}/${encodeURIComponent(word.trim())}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
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
    const results = [];

    // Strategy 1: .translation__item strong.translation  (primary Glosbe structure)
    const s1 = root.querySelectorAll('.translation__item strong.translation');
    for (const el of s1) {
      const text = el.text?.trim();
      if (text && !results.includes(text)) results.push(text);
    }
    if (results.length > 0) return results;

    // Strategy 2: any strong.translation
    const s2 = root.querySelectorAll('strong.translation');
    for (const el of s2) {
      const text = el.text?.trim();
      if (text && !results.includes(text)) results.push(text);
    }
    if (results.length > 0) return results;

    // Strategy 3: .phraseMeaning .phrase  (older Glosbe layout)
    const s3 = root.querySelectorAll('.phraseMeaning .phrase');
    for (const el of s3) {
      const text = el.text?.trim();
      if (text && !results.includes(text)) results.push(text);
    }
    if (results.length > 0) return results;

    // Strategy 4: .meaningRow .phrase
    const s4 = root.querySelectorAll('.meaningRow .phrase');
    for (const el of s4) {
      const text = el.text?.trim();
      if (text && !results.includes(text)) results.push(text);
    }
    if (results.length > 0) return results;

    // Strategy 5: data-testid="translation-item" or [data-testid] containing "translation"
    const s5 = root.querySelectorAll('[data-testid*="translation"]');
    for (const el of s5) {
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
