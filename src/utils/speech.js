// Browser speech-synthesis helper for flashcard pronunciation.
// No dependency, no key, no audio files — just the built-in Web Speech API.

// Deck "language" is a free-text label, so we match generously: lowercased,
// trimmed, against both English and native spellings → BCP-47 voice codes.
const VOICE_TABLE = {
  turkish: 'tr-TR',    'türkçe': 'tr-TR',
  english: 'en-US',
  spanish: 'es-ES',    'español': 'es-ES',
  french: 'fr-FR',     'français': 'fr-FR',
  german: 'de-DE',     deutsch: 'de-DE',
  russian: 'ru-RU',    'русский': 'ru-RU',
  italian: 'it-IT',    italiano: 'it-IT',
  portuguese: 'pt-PT', 'português': 'pt-PT',
  arabic: 'ar-SA',     'العربية': 'ar-SA',
  chinese: 'zh-CN',    '中文': 'zh-CN',
  japanese: 'ja-JP',   '日本語': 'ja-JP',
  korean: 'ko-KR',     '한국어': 'ko-KR',
  dutch: 'nl-NL',      nederlands: 'nl-NL',
  polish: 'pl-PL',     polski: 'pl-PL',
  hungarian: 'hu-HU',  magyar: 'hu-HU',
};

// Returns a BCP-47 code for a recognised deck language label, or null.
export function voiceForLanguage(label) {
  if (!label || typeof label !== 'string') return null;
  return VOICE_TABLE[label.trim().toLowerCase()] ?? null;
}

// Lazily-loaded voice list. We never read getVoices() at module load: the list
// is empty on first paint in several browsers and populates asynchronously via
// the voiceschanged event (notably on iOS/Safari).
let voices = null;

function ensureVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  if (voices === null) {
    voices = window.speechSynthesis.getVoices();
    try {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        voices = window.speechSynthesis.getVoices();
      });
    } catch {
      // Older browsers expose onvoiceschanged instead of addEventListener.
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
      };
    }
  }
  return voices || [];
}

function pickVoice(code) {
  const list = ensureVoices();
  if (!list.length) return null;
  const wanted = code.toLowerCase();
  const exact = list.find((v) => v.lang && v.lang.toLowerCase() === wanted);
  if (exact) return exact;
  const prefix = wanted.split('-')[0];
  return list.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix)) ?? null;
}

// Speak `text` in the language of `label`. Must be called synchronously inside
// a user-gesture handler (iOS requirement). Degrades silently everywhere.
export function speak(text, label) {
  try {
    if (!text) return;
    const code = voiceForLanguage(label);
    if (!code) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    // Cancel-then-speak: avoids the stuck/silent first utterance on iOS and
    // stops the queue piling up if the icon is tapped repeatedly.
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = code;
    const voice = pickVoice(code);
    if (voice) utterance.voice = voice; // else let the OS choose for this lang
    synth.speak(utterance);
  } catch {
    // Unsupported browser — stay quiet.
  }
}
