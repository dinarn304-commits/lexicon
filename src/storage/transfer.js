import { makeId } from '../utils/id';
import { slugify, ensureUniqueSlug } from '../utils/slug';
import { loadCardImage } from './images';

export const FORMAT_VERSION = 1;

const CARD_IMAGE_PREFIX = 'srs-image-';
const TEXT_IMAGE_PREFIX = 'srs-text-image-';
const SPEAKING_PREF_KEYS = [
  'srs-speaking-recent-a1a2',
  'srs-speaking-recent-b1b2',
  'srs-prep-duration',
  'srs-speaking-duration',
];

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

// Gathers a complete, self-describing snapshot of the whole library into a
// version-1 'library' file. `appData` is the in-memory srs-app-data object;
// the image and speaking-pref blobs live in separate localStorage keys, so we
// enumerate them here. Nothing is transformed — this is a faithful record.
export function serializeLibrary(appData) {
  const cardImages = {};
  const textImages = {};
  const speakingPrefs = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(TEXT_IMAGE_PREFIX)) {
      textImages[key.slice(TEXT_IMAGE_PREFIX.length)] = localStorage.getItem(key);
    } else if (key.startsWith(CARD_IMAGE_PREFIX)) {
      cardImages[key.slice(CARD_IMAGE_PREFIX.length)] = localStorage.getItem(key);
    } else if (SPEAKING_PREF_KEYS.includes(key)) {
      speakingPrefs[key] = localStorage.getItem(key);
    }
  }
  return {
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    kind: 'library',
    appData,
    cardImages,
    textImages,
    speakingPrefs,
  };
}

// Deep-clones a ProseMirror doc and remaps every inline text-image:// id to a
// fresh one, copying the matching blob from `srcTextImages` into `outTextImages`
// keyed by the new id. Keeps restored reading images owned (never orphaned).
function remapTextImages(node, srcTextImages, outTextImages) {
  if (node && node.type === 'image' && typeof node.attrs?.src === 'string' && node.attrs.src.startsWith('text-image://')) {
    const oldId = node.attrs.src.slice('text-image://'.length);
    const newId = makeId();
    if (srcTextImages && srcTextImages[oldId] != null) {
      outTextImages[newId] = srcTextImages[oldId];
    }
    node.attrs.src = `text-image://${newId}`;
  }
  if (node && Array.isArray(node.content)) {
    for (const child of node.content) remapTextImages(child, srcTextImages, outTextImages);
  }
}

// Non-destructive whole-library restore (pure — performs no writes). Every deck,
// card, and text in the backup is rebuilt as an independent COPY: brand-new ids,
// fresh unique slugs, and a "(restored YYYY-MM-DD)" marker on deck/text names.
// Cards are copied verbatim with ONLY id and deckId reassigned, so all SRS state
// is preserved byte-for-byte. Card and text images are re-keyed to the new ids.
// Existing slug sets are passed in and extended so copies never collide.
export function deserializeLibrary(file, existingDeckSlugs, existingTextSlugs) {
  if (!file || file.kind !== 'library' || !file.appData) {
    throw new Error("This doesn't look like a Lexicon backup file.");
  }
  if (file.formatVersion !== FORMAT_VERSION) {
    if (typeof file.formatVersion === 'number' && file.formatVersion > FORMAT_VERSION) {
      throw new Error('This backup was made by a newer version of Lexicon. Please update before restoring.');
    }
    throw new Error('Unrecognised backup format — this file cannot be restored.');
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const deckSlugSet = new Set(existingDeckSlugs);
  const textSlugSet = new Set(existingTextSlugs);

  const decks = [];
  const deckIdMap = {};
  for (const d of file.appData.decks || []) {
    const newId = makeId();
    const slug = ensureUniqueSlug(slugify(d.name), deckSlugSet);
    deckSlugSet.add(slug);
    deckIdMap[d.id] = newId;
    decks.push({ ...d, id: newId, slug, name: `${d.name} (restored ${stamp})` });
  }

  const cards = [];
  const cardImages = {};
  for (const c of file.appData.cards || []) {
    const newDeckId = deckIdMap[c.deckId];
    if (!newDeckId) continue; // card whose deck wasn't in the backup — skip
    const newId = makeId();
    cards.push({ ...c, id: newId, deckId: newDeckId });
    if (c.hasImage && file.cardImages && file.cardImages[c.id] != null) {
      cardImages[newId] = file.cardImages[c.id];
    }
  }

  const texts = [];
  const textImages = {};
  for (const t of file.appData.texts || []) {
    const newId = makeId();
    const slug = ensureUniqueSlug(slugify(t.title), textSlugSet);
    textSlugSet.add(slug);
    const content = t.content ? JSON.parse(JSON.stringify(t.content)) : t.content;
    if (content) remapTextImages(content, file.textImages, textImages);
    texts.push({ ...t, id: newId, slug, title: `${t.title} (restored ${stamp})`, content });
  }

  return { decks, cards, texts, cardImages, textImages };
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
