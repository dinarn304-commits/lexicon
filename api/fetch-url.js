import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import { parse } from 'node-html-parser';

const SSRF_PATTERNS = [
  /^localhost$/,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^\[::1\]$/,
  /^fe80:/i,
  /\.local$/,
  /\.localhost$/,
  /\.internal$/,
  /\.intranet$/,
  /\.lan$/,
  /^metadata\.google\.internal$/,
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ error: 'invalid_url' });

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') return res.status(200).json({ error: 'invalid_url' });

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return res.status(200).json({ error: 'invalid_url' });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(200).json({ error: 'invalid_url' });
  }

  const hostname = parsed.hostname.toLowerCase();
  if (SSRF_PATTERNS.some((p) => p.test(hostname))) {
    return res.status(200).json({ error: 'invalid_url' });
  }

  let html;
  try {
    const response = await fetch(parsed.href, {
      signal: AbortSignal.timeout(10_000),
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

    if (!response.ok) return res.status(200).json({ error: 'fetch_failed' });
    html = await response.text();
  } catch {
    return res.status(200).json({ error: 'fetch_failed' });
  }

  let article;
  try {
    const { document } = parseHTML(html);
    article = new Readability(document).parse();
  } catch {
    return res.status(200).json({ error: 'extraction_failed' });
  }

  if (!article) return res.status(200).json({ error: 'extraction_failed' });

  const contentHtml = sanitizeHtml(article.content || '', parsed.href);
  const textLength = (article.textContent || '').trim().length;

  const payload = {
    title: article.title || '',
    byline: article.byline || null,
    siteName: article.siteName || null,
    contentHtml,
    textLength,
    lang: article.lang || null,
  };

  if (textLength < 200) {
    return res.status(200).json({ error: 'content_too_short', ...payload });
  }

  return res.status(200).json(payload);
}

function sanitizeHtml(htmlString, pageUrl) {
  const root = parse(htmlString);

  for (const tag of ['script', 'style', 'iframe', 'form', 'button', 'input', 'select', 'textarea', 'noscript']) {
    for (const el of root.querySelectorAll(tag)) el.remove();
  }

  for (const el of root.querySelectorAll('*')) {
    const tag = el.tagName?.toLowerCase();
    if (!tag) continue;

    const attrs = Object.keys(el.rawAttributes || {});

    if (tag === 'a') {
      const href = el.getAttribute('href');
      for (const a of attrs) el.removeAttribute(a);
      if (href && /^https?:\/\//i.test(href)) el.setAttribute('href', href);
    } else if (tag === 'img') {
      let src = el.getAttribute('src');
      const alt = el.getAttribute('alt') || '';
      for (const a of attrs) el.removeAttribute(a);
      try { src = src ? new URL(src, pageUrl).href : null; } catch { src = null; }
      if (src && /^https?:\/\//i.test(src)) {
        el.setAttribute('src', src);
        if (alt) el.setAttribute('alt', alt);
      } else {
        el.remove();
      }
    } else {
      for (const a of attrs) el.removeAttribute(a);
    }
  }

  return root.toString();
}
