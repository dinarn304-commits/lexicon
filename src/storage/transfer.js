import { makeId } from '../utils/id';
import { loadCardImage } from './images';

export const FORMAT_VERSION = 1;

// Builds a version-1 export file object. Cards are copied field-for-field with
// no defaults injected and no missing fields dropped, so every spaced-repetition
// field (state, interval, easeFactor, nextReview, lastReviewed, …) round-trips
// exactly. Images live in separate srs-image-<id> blobs, so we pull each one in
// keyed by the card's ORIGINAL id.
export async function serializeCards(cards, deck) {
  const images = {};
  for (const card of cards) {
    if (card.hasImage) {
      const url = await loadCardImage(card.id);
      if (url) images[card.id] = url;
    }
  }
  return {
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    kind: 'deck',
    deck: {
      name: deck.name,
      language: deck.language,
      description: deck.description,
    },
    cards: cards.map((c) => ({ ...c })),
    images,
  };
}

// Validates a parsed export file and returns cards ready to append, plus the
// images to write (keyed by the card's NEW id). Pure — performs no writes.
// Each card is copied verbatim; ONLY id (freshly minted) and deckId change, so
// the SRS state is preserved exactly. Throws with a clear message on bad input.
export function deserializeIntoDeck(file, destinationDeckId) {
  if (!file || file.kind !== 'deck' || !Array.isArray(file.cards)) {
    throw new Error("This doesn't look like a Lexicon deck file.");
  }
  if (file.formatVersion !== FORMAT_VERSION) {
    if (typeof file.formatVersion === 'number' && file.formatVersion > FORMAT_VERSION) {
      throw new Error('This file was made by a newer version of Lexicon. Please update before importing.');
    }
    throw new Error('Unrecognised file format — this file cannot be imported.');
  }

  const cards = [];
  const images = {};
  for (const src of file.cards) {
    const newId = makeId();
    const card = { ...src, id: newId, deckId: destinationDeckId };
    cards.push(card);
    if (card.hasImage && file.images && file.images[src.id]) {
      images[newId] = file.images[src.id];
    }
  }
  return { cards, images };
}

// Triggers a browser download of `obj` as pretty-printed JSON.
export function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
