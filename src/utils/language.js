export const SOURCE_LANGUAGES = [
  {
    code: 'tr',
    nativeName: 'Türkçe',
    englishName: 'Turkish',
    deckId: 'deck-discovered-words',
    deckName: 'okuma sırasında keşfedilen kelimeler',
    deckLanguageLabel: 'Turkish',
  },
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    deckId: 'deck-discovered-words-en',
    deckName: 'Words discovered whilst reading',
    deckLanguageLabel: 'English',
  },
  {
    code: 'es',
    nativeName: 'Español',
    englishName: 'Spanish',
    deckId: 'deck-discovered-words-es',
    deckName: 'Palabras descubiertas leyendo',
    deckLanguageLabel: 'Spanish',
  },
  {
    code: 'fr',
    nativeName: 'Français',
    englishName: 'French',
    deckId: 'deck-discovered-words-fr',
    deckName: 'Mots découverts en lisant',
    deckLanguageLabel: 'French',
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    deckId: 'deck-discovered-words-hi',
    deckName: 'पढ़ते समय खोजे गए शब्द',
    deckLanguageLabel: 'Hindi',
  },
  {
    code: 'ar',
    nativeName: 'العربية',
    englishName: 'Arabic',
    deckId: 'deck-discovered-words-ar',
    deckName: 'كلمات مكتشفة أثناء القراءة',
    deckLanguageLabel: 'Arabic',
  },
  {
    code: 'fa',
    nativeName: 'فارسی',
    englishName: 'Persian',
    deckId: 'deck-discovered-words-fa',
    deckName: 'واژه‌های کشف‌شده هنگام خواندن',
    deckLanguageLabel: 'Persian',
  },
  {
    code: 'zh',
    nativeName: '中文',
    englishName: 'Chinese',
    deckId: 'deck-discovered-words-zh',
    deckName: '阅读时发现的词语',
    deckLanguageLabel: 'Chinese',
  },
];

export function getLanguageMeta(code) {
  return SOURCE_LANGUAGES.find((l) => l.code === code) ?? SOURCE_LANGUAGES[0];
}

// Right-to-left source languages. The reading title and body get dir="rtl" so the
// browser's bidi algorithm lays them out correctly (embedded Latin/numbers stay
// LTR); the app chrome and translation panel remain LTR.
export const RTL_LANGUAGES = ['ar', 'fa'];

export function isRTL(code) {
  return RTL_LANGUAGES.includes(code);
}

// Languages DeepL can translate. A sentence-translation request uses DeepL only
// when BOTH the source and the target language are in this set; any pair that
// involves Persian (fa) or Hindi (hi) — which DeepL does not support — routes to
// the GPT fallback (/api/gpt-translate) instead.
export const DEEPL_SUPPORTED = ['tr', 'en', 'es', 'fr', 'ru', 'de', 'ar', 'zh'];

const DEEPL_CODES = { tr: 'TR', en: 'EN', es: 'ES', fr: 'FR', ru: 'RU', de: 'DE', ar: 'AR', zh: 'ZH' };

// Single shared sentence-translation router used by both reading views. Decides
// DeepL vs GPT purely from the language pair, performs the fetch, and always
// resolves (never throws) to { translation, error, engine }.
export async function translateSentence({ text, sourceLang, targetLang }) {
  const useDeepl = DEEPL_SUPPORTED.includes(sourceLang) && DEEPL_SUPPORTED.includes(targetLang);
  const engine = useDeepl ? 'deepl' : 'gpt';
  try {
    const res = useDeepl
      ? await fetch('/api/deepl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLang: DEEPL_CODES[targetLang] || 'EN' }),
        })
      : await fetch('/api/gpt-translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, sourceLang, targetLang }),
        });
    const json = await res.json();
    if (json.error) return { translation: null, error: json.error, engine };
    return { translation: json.translation, error: null, engine };
  } catch {
    return { translation: null, error: 'deepl_unavailable', engine };
  }
}
