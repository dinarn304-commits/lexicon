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
];

export function getLanguageMeta(code) {
  return SOURCE_LANGUAGES.find((l) => l.code === code) ?? SOURCE_LANGUAGES[0];
}
