import { makeId } from './id';
import { SETTINGS } from '../algorithm/settings';

export const makeCard = (deckId, front, back, example = '', notes = '') => ({
  id: makeId(),
  deckId,
  front,
  back,
  example,
  notes,
  hasImage: false,
  state: 'new',
  learningStep: 0,
  savedInterval: null,
  repetitions: 0,
  easeFactor: SETTINGS.startingEase,
  interval: 0,
  nextReview: new Date().toISOString(),
  lastReviewed: null,
  createdAt: new Date().toISOString(),
});

const makeWelcomeCard = (deckId, front, back) => {
  const now = new Date();
  const nextReview = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  return {
    id: makeId(),
    deckId,
    front,
    back,
    example: '',
    notes: '',
    hasImage: false,
    state: 'review',
    learningStep: 0,
    savedInterval: null,
    repetitions: 0,
    easeFactor: SETTINGS.startingEase,
    interval: 365,
    nextReview: nextReview.toISOString(),
    lastReviewed: null,
    createdAt: now.toISOString(),
  };
};

export function createSampleData() {
  const welcomeId = makeId();
  const frenchId = makeId();
  return {
    cardsAddedByUser: 0,
    translationLanguage: 'en',
    discoveredWordsDeckInitialized: true,
    decks: [
      {
        id: welcomeId,
        name: 'Welcome to Lexicon',
        description: 'Four cards to help you find your way. Delete this deck whenever you\'re ready.',
        createdAt: new Date().toISOString(),
      },
      {
        id: frenchId,
        name: 'French Essentials',
        description: 'A small sample deck — feel free to delete and replace with your own.',
        language: 'French',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'deck-discovered-words',
        name: 'okuma sırasında keşfedilen kelimeler',
        description: '',
        language: 'Turkish',
        createdAt: new Date().toISOString(),
      },
    ],
    texts: [],
    cards: [
      makeWelcomeCard(welcomeId, 'How do I start learning?', 'Click any deck to open it. Then press "Review N cards" or hit Enter to begin a review session.'),
      makeWelcomeCard(welcomeId, 'How do I add new words?', 'Inside any deck, click "Add card" or press N. Fill in the front and back, then save.'),
      makeWelcomeCard(welcomeId, 'How do I rate my memory?', 'After revealing a card, press 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy). The app schedules your next review accordingly.'),
      makeWelcomeCard(welcomeId, 'Where do I practise speaking?', 'Click "speaking" at the top of the page. Pick a topic, set your timer, and speak aloud.'),
      makeCard(frenchId, 'bonjour', 'hello / good day', 'Bonjour, comment ça va?', 'Standard daytime greeting'),
      makeCard(frenchId, 'merci', 'thank you', 'Merci beaucoup pour votre aide.', ''),
      makeCard(frenchId, "s'il vous plaît", 'please (formal)', "Un café, s'il vous plaît.", "Informal: s'il te plaît"),
      makeCard(frenchId, 'au revoir', 'goodbye', 'Au revoir, à demain!', ''),
      makeCard(frenchId, 'la maison', 'the house', 'Je rentre à la maison.', 'feminine noun'),
      makeCard(frenchId, 'le chat', 'the cat', 'Le chat dort sur le canapé.', 'masculine noun'),
    ],
  };
}
