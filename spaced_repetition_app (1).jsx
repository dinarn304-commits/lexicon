import { useState, useEffect, useMemo } from 'react';
import {
  Plus, BookOpen, ChevronLeft, Check, Clock, Sparkles,
  Trash2, RotateCcw, Pencil, GraduationCap, Feather, Calendar
} from 'lucide-react';

/* ============================================================
   Scheduling Algorithm — Anki-style state machine
   ----------------------------------------------------------------
   These settings mirror the classic "Russian friend" Anki config:
   gentler on lapses than the defaults, longer learning ladder,
   and a generous easy-interval shortcut for words the student
   already knows. Cards move through four states:
     new → learning → review (mature) → relearning → review …
   ============================================================ */
const SETTINGS = {
  // --- New cards ---
  // The learning ladder, in minutes: 15min, 1 day, 6 days.
  // A brand-new card must survive all three checkpoints (with
  // "Good") before it graduates into the long-term review pool.
  newCardSteps: [15, 1440, 8640],

  // First long-term interval after graduating the ladder, in days.
  graduatingInterval: 15,

  // If "Easy" is pressed on a new card, skip the ladder entirely
  // and schedule the card this many days out.
  easyInterval: 60,

  // Initial ease factor (250% = 2.5). This multiplier grows the
  // interval each time a mature card is rated "Good".
  startingEase: 2.5,

  // --- Lapses (forgetting a mature card) ---
  // Lapse re-learning step, in minutes (single 20-min step).
  lapseSteps: [20],

  // When a mature card is forgotten, its new interval is the
  // OLD interval × this multiplier — gentler than starting over.
  lapseNewIntervalMultiplier: 0.7,

  // Floor for lapsed-card intervals, in days.
  lapseMinInterval: 2,

  // --- Reviews ---
  // Global multiplier on all review intervals. Keep at 1.0 by
  // default. Lower it (e.g. 0.85) if students retain too easily;
  // raise it if they're falling below ~80% accuracy.
  intervalModifier: 1.0,

  // "Hard" multiplies the previous interval by this (instead of
  // using the ease factor).
  hardMultiplier: 1.2,

  // "Easy" adds this bonus on top of the ease factor.
  easyBonus: 1.3,

  // Floor for the ease factor.
  minEase: 1.3,
};

function applyRating(card, quality, settings = SETTINGS) {
  const now = new Date();
  let nextReview = new Date();
  const updated = { ...card, lastReviewed: now.toISOString() };
  const state = card.state || 'new';

  // ---------- NEW or LEARNING ----------
  if (state === 'new' || state === 'learning') {
    const steps = settings.newCardSteps;
    const currentStep = card.learningStep ?? 0;

    if (quality === 1) {
      // Again: reset to the start of the ladder
      updated.state = 'learning';
      updated.learningStep = 0;
      nextReview.setMinutes(nextReview.getMinutes() + steps[0]);
    } else if (quality === 3) {
      // Hard: stay on current step
      updated.state = 'learning';
      const step = state === 'new' ? 0 : currentStep;
      updated.learningStep = step;
      nextReview.setMinutes(nextReview.getMinutes() + steps[step]);
    } else if (quality === 4) {
      // Good: advance one rung, or graduate
      const nextStep = state === 'new' ? 0 : currentStep + 1;
      if (nextStep >= steps.length) {
        // Graduated — enters the long-term review pool
        updated.state = 'review';
        updated.interval = settings.graduatingInterval;
        updated.learningStep = 0;
        const days = Math.round(settings.graduatingInterval * settings.intervalModifier);
        nextReview.setDate(nextReview.getDate() + days);
      } else {
        updated.state = 'learning';
        updated.learningStep = nextStep;
        nextReview.setMinutes(nextReview.getMinutes() + steps[nextStep]);
      }
    } else if (quality === 5) {
      // Easy: skip ladder, jump straight to review with easyInterval
      updated.state = 'review';
      updated.interval = settings.easyInterval;
      updated.learningStep = 0;
      const days = Math.round(settings.easyInterval * settings.intervalModifier);
      nextReview.setDate(nextReview.getDate() + days);
    }
  }

  // ---------- REVIEW (mature) ----------
  else if (state === 'review') {
    const interval = card.interval || 1;
    let ease = card.easeFactor || settings.startingEase;

    if (quality === 1) {
      // Lapse: card is forgotten — enters relearning
      const newInterval = Math.max(
        settings.lapseMinInterval,
        Math.round(interval * settings.lapseNewIntervalMultiplier)
      );
      ease = Math.max(settings.minEase, ease - 0.20);
      updated.state = 'relearning';
      updated.learningStep = 0;
      updated.savedInterval = newInterval; // remembered for graduation back
      updated.easeFactor = ease;
      nextReview.setMinutes(nextReview.getMinutes() + settings.lapseSteps[0]);
    } else if (quality === 3) {
      ease = Math.max(settings.minEase, ease - 0.15);
      const days = Math.max(
        interval + 1,
        Math.round(interval * settings.hardMultiplier * settings.intervalModifier)
      );
      updated.interval = days;
      updated.easeFactor = ease;
      nextReview.setDate(nextReview.getDate() + days);
    } else if (quality === 4) {
      const days = Math.max(
        interval + 1,
        Math.round(interval * ease * settings.intervalModifier)
      );
      updated.interval = days;
      updated.easeFactor = ease;
      nextReview.setDate(nextReview.getDate() + days);
    } else if (quality === 5) {
      ease = ease + 0.15;
      const days = Math.max(
        interval + 1,
        Math.round(interval * ease * settings.easyBonus * settings.intervalModifier)
      );
      updated.interval = days;
      updated.easeFactor = ease;
      nextReview.setDate(nextReview.getDate() + days);
    }
  }

  // ---------- RELEARNING (after a lapse) ----------
  else if (state === 'relearning') {
    const steps = settings.lapseSteps;
    const currentStep = card.learningStep ?? 0;

    if (quality === 1 || quality === 3) {
      // Stay in relearning at the first step
      updated.state = 'relearning';
      updated.learningStep = 0;
      nextReview.setMinutes(nextReview.getMinutes() + steps[0]);
    } else if (quality === 4) {
      const nextStep = currentStep + 1;
      if (nextStep >= steps.length) {
        // Graduate back into review with the saved (reduced) interval
        const days = card.savedInterval || settings.lapseMinInterval;
        updated.state = 'review';
        updated.interval = days;
        updated.learningStep = 0;
        updated.savedInterval = null;
        nextReview.setDate(nextReview.getDate() + days);
      } else {
        updated.learningStep = nextStep;
        nextReview.setMinutes(nextReview.getMinutes() + steps[nextStep]);
      }
    } else if (quality === 5) {
      // Skip remaining lapse steps and graduate with a small bonus
      const days = Math.max(
        settings.lapseMinInterval,
        (card.savedInterval || settings.lapseMinInterval) + 1
      );
      updated.state = 'review';
      updated.interval = days;
      updated.learningStep = 0;
      updated.savedInterval = null;
      nextReview.setDate(nextReview.getDate() + days);
    }
  }

  updated.nextReview = nextReview.toISOString();
  return updated;
}

// Migrate older card records (which only had repetitions/easeFactor/interval)
// into the new state-based schema. Idempotent.
function migrateCard(card) {
  if (card.state) return card;
  const reps = card.repetitions || 0;
  if (reps === 0) {
    return { ...card, state: 'new', learningStep: 0, savedInterval: null };
  }
  // Old "1-2 reviews" cards belong in the learning ladder, not the
  // long-term review pool. Only cards with 3+ successful reviews
  // (and a real interval) graduate to review.
  if (reps < 3 || !card.interval || card.interval < 1) {
    return {
      ...card,
      state: 'learning',
      learningStep: Math.min(reps, 2),
      savedInterval: null,
    };
  }
  return {
    ...card,
    state: 'review',
    learningStep: 0,
    savedInterval: null,
    interval: card.interval,
  };
}

function isDue(card) {
  if (!card.nextReview) return true;
  return new Date(card.nextReview) <= new Date();
}

const makeId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const makeCard = (deckId, front, back, example = '', notes = '') => ({
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

/* ============================================================
   Image handling
   Photos straight from a phone can be 3-4 MB. We resize to a max
   dimension of 800px and compress as JPEG (~75% quality) before
   saving. Each image lives in its own storage key keyed by card id,
   so the main data blob stays light.
   ============================================================ */
const MAX_IMAGE_DIM = 800;
const IMAGE_QUALITY = 0.75;
const imageKey = (cardId) => `srs-image-${cardId}`;

function processImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
          if (width >= height) {
            height = Math.round(height * (MAX_IMAGE_DIM / width));
            width = MAX_IMAGE_DIM;
          } else {
            width = Math.round(width * (MAX_IMAGE_DIM / height));
            height = MAX_IMAGE_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function loadCardImage(cardId) {
  try {
    const result = await window.storage.get(imageKey(cardId));
    return result && result.value ? result.value : null;
  } catch (_) {
    return null;
  }
}

async function saveCardImage(cardId, dataUrl) {
  try {
    await window.storage.set(imageKey(cardId), dataUrl);
    return true;
  } catch (e) {
    console.error('Image save failed:', e);
    return false;
  }
}

async function removeCardImage(cardId) {
  try {
    await window.storage.delete(imageKey(cardId));
  } catch (_) { /* fine — may not exist */ }
}

function createSampleData() {
  const deckId = makeId();
  return {
    cardsAddedByUser: 0,
    decks: [
      {
        id: deckId,
        name: 'French Essentials',
        description: 'A small sample deck — feel free to delete and replace with your own.',
        language: 'French',
        createdAt: new Date().toISOString(),
      },
    ],
    cards: [
      makeCard(deckId, 'bonjour', 'hello / good day', 'Bonjour, comment ça va?', 'Standard daytime greeting'),
      makeCard(deckId, 'merci', 'thank you', 'Merci beaucoup pour votre aide.', ''),
      makeCard(deckId, "s'il vous plaît", 'please (formal)', "Un café, s'il vous plaît.", "Informal: s'il te plaît"),
      makeCard(deckId, 'au revoir', 'goodbye', 'Au revoir, à demain!', ''),
      makeCard(deckId, 'la maison', 'the house', 'Je rentre à la maison.', 'feminine noun'),
      makeCard(deckId, 'le chat', 'the cat', 'Le chat dort sur le canapé.', 'masculine noun'),
    ],
  };
}

/* ============================================================
   Theme — a warm "scholar's notebook" palette.
   ============================================================ */
function ThemeStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=DM+Mono:wght@400;500&display=swap');

      :root {
        --paper: #f1ead9;
        --paper-2: #fbf6ea;
        --ink: #2a1f15;
        --ink-soft: #6b5a47;
        --ink-faint: #a89880;
        --rule: #d8c6a8;
        --rule-soft: #e7d9bd;
        --terracotta: #a44726;
        --terracotta-soft: #ecd2c1;
        --moss: #5b6e3d;
        --gold: #a37510;
        --shadow: 0 1px 0 rgba(42,31,21,0.06), 0 12px 28px -16px rgba(42,31,21,0.18);
      }

      .srs-root {
        background: var(--paper);
        color: var(--ink);
        font-family: 'Fraunces', Georgia, serif;
        font-feature-settings: 'ss01', 'ss02';
        min-height: 100vh;
        position: relative;
      }

      .srs-root::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          radial-gradient(rgba(42,31,21,0.04) 1px, transparent 1px),
          radial-gradient(rgba(42,31,21,0.025) 1px, transparent 1px);
        background-size: 3px 3px, 7px 7px;
        background-position: 0 0, 1px 2px;
        opacity: 0.5;
        z-index: 0;
      }

      .srs-content { position: relative; z-index: 1; }

      .display { font-family: 'Fraunces', Georgia, serif; font-weight: 600; letter-spacing: -0.02em; }
      .mono { font-family: 'DM Mono', ui-monospace, monospace; }

      .ornament {
        font-family: 'Fraunces', serif;
        color: var(--terracotta);
        letter-spacing: 0.4em;
      }

      .paper-card {
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 4px;
        box-shadow: var(--shadow);
        position: relative;
      }

      .paper-card::after {
        content: '';
        position: absolute;
        inset: 6px;
        border: 1px solid var(--rule-soft);
        border-radius: 2px;
        pointer-events: none;
      }

      .btn {
        font-family: 'Fraunces', serif;
        font-weight: 500;
        letter-spacing: 0.01em;
        transition: all 0.18s ease;
        cursor: pointer;
        border: 1px solid transparent;
      }

      .btn-primary {
        background: var(--ink);
        color: var(--paper-2);
        border-color: var(--ink);
      }
      .btn-primary:hover { background: var(--terracotta); border-color: var(--terracotta); }

      .btn-ghost {
        background: transparent;
        color: var(--ink);
        border-color: var(--rule);
      }
      .btn-ghost:hover { background: var(--paper-2); border-color: var(--ink-soft); }

      .btn-quiet {
        background: transparent;
        color: var(--ink-soft);
        border-color: transparent;
      }
      .btn-quiet:hover { color: var(--ink); }

      .input {
        font-family: 'Fraunces', serif;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        color: var(--ink);
        border-radius: 3px;
        padding: 10px 12px;
        outline: none;
        transition: border-color 0.18s ease;
        width: 100%;
      }
      .input:focus { border-color: var(--terracotta); }
      .input::placeholder { color: var(--ink-faint); font-style: italic; }

      .deck-tile {
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 4px;
        padding: 24px 26px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }
      .deck-tile:hover {
        border-color: var(--ink-soft);
        transform: translateY(-1px);
        box-shadow: var(--shadow);
      }
      .deck-tile::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: var(--terracotta);
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .deck-tile:hover::before { opacity: 1; }

      .due-pill {
        background: var(--terracotta);
        color: var(--paper-2);
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 999px;
        letter-spacing: 0.04em;
      }
      .due-pill.muted {
        background: var(--rule-soft);
        color: var(--ink-soft);
      }

      .flashcard {
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 6px;
        box-shadow: var(--shadow);
        position: relative;
        min-height: 320px;
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      .flashcard:hover { transform: translateY(-2px); }
      .flashcard::before {
        content: '';
        position: absolute;
        top: 18px; bottom: 18px;
        left: 56px;
        width: 1px;
        background: var(--terracotta-soft);
      }
      .flashcard::after {
        content: '';
        position: absolute;
        inset: 12px;
        border: 1px solid var(--rule-soft);
        border-radius: 3px;
        pointer-events: none;
      }

      .rate-btn {
        font-family: 'Fraunces', serif;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        border-radius: 3px;
        padding: 14px 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: center;
      }
      .rate-btn:hover {
        background: var(--ink);
        color: var(--paper-2);
        border-color: var(--ink);
        transform: translateY(-1px);
      }
      .rate-btn .label { font-size: 14px; font-weight: 500; }
      .rate-btn .interval { font-family: 'DM Mono', monospace; font-size: 10px; opacity: 0.6; margin-top: 2px; }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .fade-up { animation: fadeUp 0.4s ease both; }

      .divider-flourish {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--terracotta);
      }
      .divider-flourish hr {
        flex: 1;
        border: none;
        border-top: 1px solid var(--rule);
      }

      .image-frame {
        display: inline-block;
        padding: 8px;
        background: var(--paper-2);
        border: 1px solid var(--rule);
        box-shadow: var(--shadow);
      }
      .image-frame img {
        display: block;
        max-width: 100%;
        max-height: 240px;
        filter: sepia(0.08) saturate(0.95);
      }
      .image-frame.review img {
        max-height: 200px;
      }

      .image-upload-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--paper-2);
        border: 1px dashed var(--rule);
        border-radius: 3px;
        color: var(--ink-soft);
        font-family: 'Fraunces', serif;
        cursor: pointer;
        transition: all 0.18s ease;
      }
      .image-upload-label:hover {
        border-color: var(--terracotta);
        color: var(--terracotta);
        background: var(--paper);
      }
      .image-upload-label input[type="file"] { display: none; }

      .image-card-thumb {
        width: 32px;
        height: 32px;
        object-fit: cover;
        border: 1px solid var(--rule);
        border-radius: 2px;
        flex-shrink: 0;
        filter: sepia(0.08) saturate(0.95);
      }
    `}</style>
  );
}

/* ============================================================
   Sub-views
   ============================================================ */

function Loader() {
  return (
    <div className="srs-root flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <ThemeStyles />
      <div className="srs-content text-center">
        <div className="ornament text-sm mb-3">· · ·</div>
        <div className="display text-xl" style={{ color: 'var(--ink-soft)' }}>opening the notebook</div>
      </div>
    </div>
  );
}

function HomeView({ data, onOpenDeck, onNewDeck }) {
  const totalDue = data.cards.filter(isDue).length;
  const totalCards = data.cards.length;
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 fade-up">
      {/* Header */}
      <header className="mb-12">
        <div className="ornament text-xs mb-4">· LEXICON ·</div>
        <h1 className="display text-5xl mb-3" style={{ lineHeight: 1.05 }}>
          {greeting}.
        </h1>
        <p className="text-lg italic" style={{ color: 'var(--ink-soft)' }}>
          {totalDue > 0
            ? `You have ${totalDue} card${totalDue === 1 ? '' : 's'} waiting for you today.`
            : totalCards === 0
              ? 'A blank page. Begin by creating your first deck.'
              : 'Nothing due right now — well done.'}
        </p>
      </header>

      <div className="divider-flourish mb-8">
        <hr />
        <Feather size={14} />
        <hr />
      </div>

      {/* Decks */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="display text-2xl">Your decks</h2>
          <button className="btn btn-quiet text-sm flex items-center gap-1.5" onClick={onNewDeck}>
            <Plus size={14} /> New deck
          </button>
        </div>

        {data.decks.length === 0 ? (
          <div className="paper-card p-10 text-center">
            <BookOpen size={32} style={{ color: 'var(--ink-faint)', margin: '0 auto 12px' }} />
            <p className="italic" style={{ color: 'var(--ink-soft)' }}>
              No decks yet. Create one to begin.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {data.decks.map((deck) => {
              const deckCards = data.cards.filter((c) => c.deckId === deck.id);
              const due = deckCards.filter(isDue).length;
              return (
                <div key={deck.id} className="deck-tile" onClick={() => onOpenDeck(deck.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="display text-2xl">{deck.name}</h3>
                        {deck.language && (
                          <span className="mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--terracotta-soft)', color: 'var(--terracotta)' }}>
                            {deck.language}
                          </span>
                        )}
                      </div>
                      {deck.description && (
                        <p className="italic mb-3" style={{ color: 'var(--ink-soft)' }}>
                          {deck.description}
                        </p>
                      )}
                      <div className="flex gap-4 mono text-xs" style={{ color: 'var(--ink-soft)' }}>
                        <span>{deckCards.length} card{deckCards.length === 1 ? '' : 's'}</span>
                        <span>·</span>
                        <span>{due} due</span>
                      </div>
                    </div>
                    {due > 0 && <span className="due-pill mt-1.5">{due}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="mt-16 text-center">
        <div className="ornament text-xs">· · ·</div>
      </footer>
    </div>
  );
}

function CardThumbnail({ cardId }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadCardImage(cardId).then((url) => {
      if (!cancelled && url) setSrc(url);
    });
    return () => { cancelled = true; };
  }, [cardId]);
  if (!src) {
    return <div className="image-card-thumb" style={{ background: 'var(--rule-soft)' }} />;
  }
  return <img src={src} alt="" className="image-card-thumb" />;
}

function DeckView({ deck, cards, onBack, onStartReview, onAddCard, onEditCard, onDeleteCard, onDeleteDeck }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const due = cards.filter(isDue);
  const newCards = cards.filter((c) => (c.state || 'new') === 'new');
  const learning = cards.filter((c) => {
    const s = c.state || 'new';
    return s === 'learning' || s === 'relearning';
  });
  const mastering = cards.filter((c) => (c.state || 'new') === 'review');

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 fade-up">
      <button className="btn btn-quiet text-sm flex items-center gap-1 mb-6" onClick={onBack}>
        <ChevronLeft size={16} /> Notebook
      </button>

      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="ornament text-xs mb-3">· DECK ·</div>
            <h1 className="display text-4xl mb-2">{deck.name}</h1>
            {deck.description && (
              <p className="italic text-lg" style={{ color: 'var(--ink-soft)' }}>
                {deck.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats line */}
        <div className="grid grid-cols-3 gap-6 mt-8 paper-card" style={{ padding: '20px 24px' }}>
          <div>
            <div className="mono text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-faint)' }}>New</div>
            <div className="display text-2xl">{newCards.length}</div>
          </div>
          <div>
            <div className="mono text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-faint)' }}>Learning</div>
            <div className="display text-2xl">{learning.length}</div>
          </div>
          <div>
            <div className="mono text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-faint)' }}>Mastering</div>
            <div className="display text-2xl">{mastering.length}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 flex-wrap">
          <button
            className="btn btn-primary px-6 py-3 flex items-center gap-2"
            onClick={onStartReview}
            disabled={due.length === 0}
            style={{ opacity: due.length === 0 ? 0.4 : 1 }}
          >
            <GraduationCap size={18} />
            {due.length > 0 ? `Review ${due.length} card${due.length === 1 ? '' : 's'}` : 'Nothing due'}
          </button>
          <button className="btn btn-ghost px-5 py-3 flex items-center gap-2" onClick={onAddCard}>
            <Plus size={16} /> Add card
          </button>
        </div>
      </header>

      <div className="divider-flourish mb-6">
        <hr />
        <span className="text-xs">·</span>
        <hr />
      </div>

      {/* Card list */}
      <section>
        <h2 className="display text-xl mb-4">All cards</h2>
        {cards.length === 0 ? (
          <div className="paper-card p-10 text-center">
            <p className="italic" style={{ color: 'var(--ink-soft)' }}>
              This deck is empty. Add your first word to begin.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cards.map((card) => (
              <li key={card.id} className="paper-card flex items-start justify-between gap-4" style={{ padding: '14px 18px' }}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {card.hasImage && (
                    <CardThumbnail cardId={card.id} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="display text-lg">
                      {card.front}
                      <span style={{ color: 'var(--ink-faint)' }}> — </span>
                      <span style={{ color: 'var(--ink-soft)' }}>{card.back}</span>
                    </div>
                    {card.example && (
                      <div className="italic text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
                        {card.example}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isDue(card) ? (
                    <span className="due-pill mr-1">due</span>
                  ) : (
                    <span className="mono text-xs mr-1" style={{ color: 'var(--ink-faint)' }}>
                      {Math.ceil((new Date(card.nextReview) - new Date()) / 86400000)}d
                    </span>
                  )}
                  <button
                    className="btn btn-quiet p-1.5"
                    onClick={() => onEditCard(card.id)}
                    aria-label="Edit card"
                    title="Edit card"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn btn-quiet p-1.5"
                    onClick={() => onDeleteCard(card.id)}
                    aria-label="Delete card"
                    title="Delete card"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Delete deck */}
      <div className="mt-12 pt-6 border-t" style={{ borderColor: 'var(--rule)' }}>
        {!confirmDelete ? (
          <button className="btn btn-quiet text-sm" onClick={() => setConfirmDelete(true)}>
            Delete this deck
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="italic text-sm" style={{ color: 'var(--ink-soft)' }}>Delete deck and all its cards?</span>
            <button className="btn btn-ghost text-sm px-3 py-1" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn text-sm px-3 py-1" style={{ background: 'var(--terracotta)', color: 'var(--paper-2)' }} onClick={onDeleteDeck}>
              Yes, delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewView({ queue, onRate, onEnd, sessionStats }) {
  const [revealed, setRevealed] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const card = queue[0];

  useEffect(() => { setRevealed(false); }, [card?.id]);

  // Preload the next card's image so it's ready when the user reveals
  useEffect(() => {
    setImageSrc(null);
    if (!card || !card.hasImage) return;
    let cancelled = false;
    loadCardImage(card.id).then((url) => {
      if (!cancelled) setImageSrc(url);
    });
    return () => { cancelled = true; };
  }, [card?.id]);

  if (!card) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center fade-up">
        <div className="ornament text-xs mb-4">· · ·</div>
        <Sparkles size={28} style={{ color: 'var(--terracotta)', margin: '0 auto 16px' }} />
        <h1 className="display text-4xl mb-3">Session complete</h1>
        <p className="italic text-lg mb-2" style={{ color: 'var(--ink-soft)' }}>
          You reviewed {sessionStats.total} card{sessionStats.total === 1 ? '' : 's'}.
        </p>
        <p className="mono text-sm mb-10" style={{ color: 'var(--ink-faint)' }}>
          {sessionStats.again} again · {sessionStats.hard} hard · {sessionStats.good} good · {sessionStats.easy} easy
        </p>
        <button className="btn btn-primary px-6 py-3" onClick={onEnd}>Return to deck</button>
      </div>
    );
  }

  const ratings = [
    { label: 'Again', quality: 1, interval: previewInterval(card, 1) },
    { label: 'Hard',  quality: 3, interval: previewInterval(card, 3) },
    { label: 'Good',  quality: 4, interval: previewInterval(card, 4) },
    { label: 'Easy',  quality: 5, interval: previewInterval(card, 5) },
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 fade-up">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button className="btn btn-quiet text-sm flex items-center gap-1" onClick={onEnd}>
          <ChevronLeft size={16} /> End session
        </button>
        <div className="mono text-xs" style={{ color: 'var(--ink-soft)' }}>
          {queue.length} remaining
        </div>
      </div>

      {/* The card */}
      <div className="flashcard p-12 mb-6" onClick={() => !revealed && setRevealed(true)}>
        <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 280 }}>
          <div className="ornament text-xs mb-6">
            {revealed ? '· MEANING ·' : '· WORD ·'}
          </div>
          <div className="display text-5xl mb-4" style={{ lineHeight: 1.15 }}>
            {revealed ? card.back : card.front}
          </div>
          {revealed && imageSrc && (
            <div className="image-frame review mt-4 fade-up">
              <img src={imageSrc} alt="" />
            </div>
          )}
          {revealed && card.example && (
            <div className="italic mt-4 max-w-md" style={{ color: 'var(--ink-soft)' }}>
              "{card.example}"
            </div>
          )}
          {revealed && card.notes && (
            <div className="mono text-xs mt-4 px-3 py-1 rounded" style={{ background: 'var(--rule-soft)', color: 'var(--ink-soft)' }}>
              {card.notes}
            </div>
          )}
          {!revealed && (
            <div className="mt-8 text-sm italic" style={{ color: 'var(--ink-faint)' }}>
              Click to reveal
            </div>
          )}
        </div>
      </div>

      {/* Rating buttons */}
      {revealed && (
        <div className="grid grid-cols-4 gap-2 fade-up">
          {ratings.map((r) => (
            <button key={r.label} className="rate-btn" onClick={() => onRate(r.quality)}>
              <div className="label">{r.label}</div>
              <div className="interval">{r.interval}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function previewInterval(card, quality) {
  const updated = applyRating(card, quality);
  const ms = new Date(updated.nextReview) - new Date();
  const minutes = ms / 60000;
  const hours = minutes / 60;
  const days = ms / 86400000;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

function AddDeckForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');

  function submit() {
    if (!name.trim()) return;
    onSave({
      id: makeId(),
      name: name.trim(),
      description: description.trim(),
      language: language.trim(),
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 fade-up">
      <button className="btn btn-quiet text-sm flex items-center gap-1 mb-6" onClick={onCancel}>
        <ChevronLeft size={16} /> Back
      </button>
      <div className="ornament text-xs mb-3">· NEW DECK ·</div>
      <h1 className="display text-3xl mb-6">A fresh page</h1>

      <div className="space-y-4">
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Deck name
          </label>
          <input
            className="input"
            placeholder="e.g. Spanish — Chapter 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Language (optional)
          </label>
          <input
            className="input"
            placeholder="Spanish, German, Hungarian…"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Description (optional)
          </label>
          <textarea
            className="input"
            rows={2}
            placeholder="A short note about this deck"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button className="btn btn-primary px-5 py-2.5" onClick={submit} disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : 0.5 }}>
            Create deck
          </button>
          <button className="btn btn-ghost px-5 py-2.5" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CardForm({ deck, onSave, onCancel, userAddedCount = 0, existingCard = null }) {
  const isEdit = existingCard !== null;
  const [front, setFront] = useState(existingCard?.front || '');
  const [back, setBack] = useState(existingCard?.back || '');
  const [example, setExample] = useState(existingCard?.example || '');
  const [notes, setNotes] = useState(existingCard?.notes || '');
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [imageStatus, setImageStatus] = useState('idle'); // idle | loading | error
  const [savedCount, setSavedCount] = useState(0);
  const showHints = !isEdit && userAddedCount < 3;

  // If editing, load the existing image (if any)
  useEffect(() => {
    if (isEdit && existingCard.hasImage) {
      setImageStatus('loading');
      loadCardImage(existingCard.id).then((url) => {
        if (url) setImageDataUrl(url);
        setImageStatus('idle');
      });
    }
  }, [isEdit, existingCard]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageStatus('loading');
    try {
      const dataUrl = await processImageFile(file);
      setImageDataUrl(dataUrl);
      setImageStatus('idle');
    } catch (err) {
      console.error(err);
      setImageStatus('error');
    }
    // Reset the input so picking the same file twice still triggers onChange
    e.target.value = '';
  }

  function removeImage() {
    setImageDataUrl(null);
  }

  function clearForm() {
    setFront(''); setBack(''); setExample(''); setNotes('');
    setImageDataUrl(null);
  }

  async function submit(addAnother = false) {
    if (!front.trim() || !back.trim()) return;

    if (isEdit) {
      // Editing: preserve all SRS state, only update content fields and image
      const updated = {
        ...existingCard,
        front: front.trim(),
        back: back.trim(),
        example: example.trim(),
        notes: notes.trim(),
        hasImage: imageDataUrl !== null,
      };
      if (imageDataUrl) {
        await saveCardImage(existingCard.id, imageDataUrl);
      } else if (existingCard.hasImage) {
        await removeCardImage(existingCard.id);
      }
      onSave(updated);
    } else {
      // Adding: build a fresh card
      const card = makeCard(deck.id, front.trim(), back.trim(), example.trim(), notes.trim());
      if (imageDataUrl) {
        card.hasImage = true;
        await saveCardImage(card.id, imageDataUrl);
      }
      onSave(card);
      setSavedCount((c) => c + 1);
      if (addAnother) clearForm();
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 fade-up">
      <button className="btn btn-quiet text-sm flex items-center gap-1 mb-6" onClick={onCancel}>
        <ChevronLeft size={16} /> Back to {deck.name}
      </button>
      <div className="ornament text-xs mb-3">· {isEdit ? 'EDIT CARD' : 'NEW CARD'} ·</div>
      <h1 className="display text-3xl mb-2">{isEdit ? 'Refine this card' : 'Add a word'}</h1>
      {!isEdit && savedCount > 0 && (
        <p className="italic text-sm mb-6" style={{ color: 'var(--moss)' }}>
          ✓ {savedCount} card{savedCount === 1 ? '' : 's'} added in this session
        </p>
      )}

      <div className="space-y-4 mt-6">
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Word / phrase (front)
          </label>
          <input
            className="input"
            placeholder={showHints ? "anlam" : ""}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Translation (back)
          </label>
          <input
            className="input"
            placeholder={showHints ? "meaning" : ""}
            value={back}
            onChange={(e) => setBack(e.target.value)}
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Example sentence (optional)
          </label>
          <input
            className="input"
            placeholder={showHints ? "Hayatın anlamı nedir?" : ""}
            value={example}
            onChange={(e) => setExample(e.target.value)}
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Notes (optional)
          </label>
          <input
            className="input"
            placeholder={showHints ? "mesela, aynı kökü paylaşan kelimeler: anlamlı, anlamsız, anlamlandırmak..." : ""}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Image (optional)
          </label>
          {imageDataUrl ? (
            <div className="flex items-start gap-3 flex-wrap">
              <div className="image-frame">
                <img src={imageDataUrl} alt="card preview" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="image-upload-label">
                  <RotateCcw size={14} />
                  Replace
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </label>
                <button className="btn btn-quiet text-sm flex items-center gap-1" onClick={removeImage}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="image-upload-label">
              <Plus size={14} />
              {imageStatus === 'loading' ? 'Processing…' : 'Choose an image'}
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={imageStatus === 'loading'} />
            </label>
          )}
          {imageStatus === 'error' && (
            <p className="italic text-sm mt-2" style={{ color: 'var(--terracotta)' }}>
              Sorry — that image couldn't be read. Try another.
            </p>
          )}
          {showHints && !imageDataUrl && (
            <p className="italic text-xs mt-2" style={{ color: 'var(--ink-faint)' }}>
              A picture appears alongside the meaning during review — useful for object words.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2 flex-wrap">
          {isEdit ? (
            <>
              <button
                className="btn btn-primary px-5 py-2.5"
                onClick={() => submit(false)}
                disabled={!front.trim() || !back.trim() || imageStatus === 'loading'}
                style={{ opacity: front.trim() && back.trim() && imageStatus !== 'loading' ? 1 : 0.5 }}
              >
                Save changes
              </button>
              <button className="btn btn-ghost px-5 py-2.5" onClick={onCancel}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary px-5 py-2.5"
                onClick={() => submit(true)}
                disabled={!front.trim() || !back.trim() || imageStatus === 'loading'}
                style={{ opacity: front.trim() && back.trim() && imageStatus !== 'loading' ? 1 : 0.5 }}
              >
                Save & add another
              </button>
              <button
                className="btn btn-ghost px-5 py-2.5"
                onClick={async () => { await submit(false); onCancel(); }}
                disabled={!front.trim() || !back.trim() || imageStatus === 'loading'}
                style={{ opacity: front.trim() && back.trim() && imageStatus !== 'loading' ? 1 : 0.5 }}
              >
                Save & close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Main App
   ============================================================ */
export default function App() {
  const [view, setView] = useState('home');
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [data, setData] = useState({ decks: [], cards: [] });
  const [loading, setLoading] = useState(true);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [sessionStats, setSessionStats] = useState({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get('srs-app-data');
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          // Migrate older cards to the new state-based schema
          parsed.cards = (parsed.cards || []).map(migrateCard);
          setData(parsed);
          setLoading(false);
          return;
        }
      } catch (e) { /* fall through to seed */ }
      const initial = createSampleData();
      setData(initial);
      try { await window.storage.set('srs-app-data', JSON.stringify(initial)); } catch (_) {}
      setLoading(false);
    })();
  }, []);

  async function persist(newData) {
    setData(newData);
    try {
      await window.storage.set('srs-app-data', JSON.stringify(newData));
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  const activeDeck = data.decks.find((d) => d.id === activeDeckId);
  const deckCards = data.cards.filter((c) => c.deckId === activeDeckId);

  function openDeck(id) { setActiveDeckId(id); setView('deck'); }
  function backHome() { setActiveDeckId(null); setView('home'); }

  function startReview() {
    const due = data.cards
      .filter((c) => c.deckId === activeDeckId && isDue(c))
      .sort(() => Math.random() - 0.5);
    if (due.length === 0) return;
    setReviewQueue(due);
    setSessionStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });
    setView('review');
  }

  function rateCard(quality) {
    const card = reviewQueue[0];
    if (!card) return;
    const updated = applyRating(card, quality);
    const newCards = data.cards.map((c) => (c.id === card.id ? updated : c));
    persist({ ...data, cards: newCards });

    const key = quality === 1 ? 'again' : quality === 3 ? 'hard' : quality === 4 ? 'good' : 'easy';
    setSessionStats((s) => ({ ...s, total: s.total + 1, [key]: s[key] + 1 }));

    // Requeue only for very short relearning steps (under ~5 min).
    // Anything longer — including the 15-minute first ladder rung —
    // leaves the session and returns when actually due.
    const minutesUntilNext = (new Date(updated.nextReview) - new Date()) / 60000;
    if (minutesUntilNext < 5) {
      setReviewQueue((q) => [...q.slice(1), updated]);
    } else {
      setReviewQueue((q) => q.slice(1));
    }
  }

  function endSession() { setView('deck'); }

  function saveDeck(deck) {
    persist({ ...data, decks: [...data.decks, deck] });
    setActiveDeckId(deck.id);
    setView('deck');
  }

  function saveCard(card) {
    persist({
      ...data,
      cards: [...data.cards, card],
      cardsAddedByUser: (data.cardsAddedByUser || 0) + 1,
    });
  }

  function updateCard(updatedCard) {
    persist({
      ...data,
      cards: data.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
    });
    setEditingCardId(null);
    setView('deck');
  }

  async function deleteCard(id) {
    const card = data.cards.find((c) => c.id === id);
    if (card?.hasImage) await removeCardImage(id);
    persist({ ...data, cards: data.cards.filter((c) => c.id !== id) });
  }

  async function deleteDeck() {
    // Clean up any images belonging to cards in this deck
    const cardsToRemove = data.cards.filter((c) => c.deckId === activeDeckId);
    await Promise.all(
      cardsToRemove.filter((c) => c.hasImage).map((c) => removeCardImage(c.id))
    );
    persist({
      ...data,
      decks: data.decks.filter((d) => d.id !== activeDeckId),
      cards: data.cards.filter((c) => c.deckId !== activeDeckId),
    });
    backHome();
  }

  if (loading) return <Loader />;

  return (
    <div className="srs-root">
      <ThemeStyles />
      <div className="srs-content">
        {view === 'home' && (
          <HomeView
            data={data}
            onOpenDeck={openDeck}
            onNewDeck={() => setView('addDeck')}
          />
        )}
        {view === 'deck' && activeDeck && (
          <DeckView
            deck={activeDeck}
            cards={deckCards}
            onBack={backHome}
            onStartReview={startReview}
            onAddCard={() => setView('addCard')}
            onEditCard={(id) => { setEditingCardId(id); setView('editCard'); }}
            onDeleteCard={deleteCard}
            onDeleteDeck={deleteDeck}
          />
        )}
        {view === 'review' && (
          <ReviewView
            queue={reviewQueue}
            onRate={rateCard}
            onEnd={endSession}
            sessionStats={sessionStats}
          />
        )}
        {view === 'addDeck' && (
          <AddDeckForm onSave={saveDeck} onCancel={backHome} />
        )}
        {view === 'addCard' && activeDeck && (
          <CardForm
            deck={activeDeck}
            onSave={saveCard}
            onCancel={() => setView('deck')}
            userAddedCount={data.cardsAddedByUser || 0}
          />
        )}
        {view === 'editCard' && activeDeck && editingCardId && (
          <CardForm
            deck={activeDeck}
            existingCard={data.cards.find((c) => c.id === editingCardId)}
            onSave={updateCard}
            onCancel={() => { setEditingCardId(null); setView('deck'); }}
          />
        )}
      </div>
    </div>
  );
}
