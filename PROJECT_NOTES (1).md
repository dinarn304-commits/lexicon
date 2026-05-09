# Lexicon — Project Notes

> A handover document. If you are Claude reading this at the start of a Claude Code
> session, please read it in full before touching any code. It captures the *why*
> behind every decision, not just the *what*, so the next phase of work can build
> on the existing design rather than drift away from it.

---

## 1. Who this is for

The owner of this project is a language teacher who is genuinely passionate about
their students. The app is being built as a gift for those students — a small,
beautiful piece of software they will actually use to learn. The teacher is not a
programmer; they are a "vibecoder," meaning they describe what they want in plain
language and trust their AI collaborator to write the code. That trust is the
heart of this collaboration. Treat every design choice as something to be
discussed and motivated, never assumed.

The teacher's first language context appears to be Turkish. The app's UI is in
English, but example content and placeholders use Turkish words.

---

## 2. What the app is

Lexicon is a spaced-repetition flashcard app, conceptually similar to Anki or
Quizlet, but designed to feel warmer, more humane, and more pedagogically
thoughtful than either. It is intended to grow into something the teacher can
hand to a class of students — but for now, it is a single-user tool that the
teacher uses to test the experience and refine the design.

### Core features that already exist

- **Decks of cards**, each card with a front (word in target language), back
  (translation), an optional example sentence, and an optional notes field
  (which we have shown being used elegantly for word-root families, e.g.
  `mesela, aynı kökü paylaşan kelimeler: anlamlı, anlamsız, anlamlandırmak…`).
- **Optional images per card.** Images are placed on the *back* of the card,
  alongside the meaning, so they reinforce recall rather than give away the
  answer. Images are auto-resized to a max dimension of 800px and re-encoded
  as JPEG at ~75% quality before storage. Each image lives in its own
  storage key (separate from the main data blob) to keep the main blob small.
- **Editing existing cards** via a unified `CardForm` component that handles
  both creating and editing. When editing, the SRS state of the card is
  preserved untouched — only content fields (and the image) can change.
- **A scheduling algorithm** modeled on a thoughtful Anki configuration
  shared by the teacher's Russian friend many years ago (see Section 4).
- **Persistent storage** via `window.storage` (Anthropic's artifact storage),
  with a quiet migration function that upgrades older card records to the
  current schema on load.
- **Adaptive onboarding hints** in the Add Card form: example placeholders
  appear in the input fields for the user's first three saved cards, then
  quietly retire. The counter (`cardsAddedByUser`) lives in persistent storage
  so it survives across sessions.

### Features deliberately deferred (do not silently add these)

- **Leech tracking.** The teacher's friend specified `leech action: tag only`
  in their Anki settings, but we agreed to defer this — it only matters after
  weeks of real use and adds UI surface area we don't yet need.
- **Interval-modifier dial.** The setting is in the algorithm constants
  (`SETTINGS.intervalModifier`, currently `1.0`), but there is intentionally
  no UI for adjusting it yet. The teacher's friend recommended adjusting it
  to ~0.85 if students retain too easily, but we should only add the UI once
  there is real data informing the choice.
- **Deck editing.** You can create and delete decks but not yet rename them
  or change their description.
- **Export / import.** No way to share decks between teachers yet.
- **Audio recording or playback.** Mentioned as a future possibility,
  particularly the teacher's own voice for pronunciation. Not yet built.
- **Student accounts.** This is currently a single-user prototype. Moving to
  multi-user requires moving off `window.storage` to a real database
  (Supabase or Firebase are the leading candidates).
- **Deployment.** Not yet hosted anywhere. Will eventually live on Vercel or
  Netlify with a real web address.

---

## 3. Aesthetic & design philosophy

The app's visual identity is a **warm scholarly notebook** — the kind of thing a
thoughtful teacher might keep on their desk. This is not arbitrary; it is the
counter-aesthetic to the gamified, dopamine-driven flashcard apps the teacher
deliberately wanted to avoid. Concretely:

- **Background:** cream paper (`--paper: #f1ead9`) with a subtle dotted
  noise texture overlay, evoking aged paper.
- **Typography:** Fraunces (a warm serif) for everything except small
  metadata, which uses DM Mono. No sans-serif body text anywhere.
- **Accent color:** terracotta (`--terracotta: #a44726`) — used sparingly,
  for the "due" pill, hover states, and the small ornamental dots that
  separate sections.
- **Ornamentation:** small `· · ·` and `· WORD ·` style markers replace
  conventional headings in some places. They look like the rubrics in an
  old printed book.
- **Animation:** restrained. A gentle `fadeUp` for view transitions; no
  bouncing, no confetti, no streak counters, no badges.
- **Image style:** photos rendered with a slight sepia tint
  (`filter: sepia(0.08) saturate(0.95)`) and mounted in a paper-colored
  matte, so they feel of-a-piece with the surrounding paper rather than
  arriving as foreign elements from the modern web.

The greeting on the home screen changes with time of day ("Good morning",
"Good afternoon", "Good evening"). This is a small touch but emblematic of
the whole approach: the app should feel attended-to, made with care, not
mass-produced.

When in doubt about a design choice: **less is more, warmth over cleverness,
quiet confidence over loud novelty.**

---

## 4. The scheduling algorithm — full specification

The algorithm is implemented in a function called `applyRating(card, quality)`,
which transitions a card through a state machine. Cards live in one of four
states: `new`, `learning`, `review`, or `relearning`.

### Constants (the `SETTINGS` object)

These match the Anki configuration the teacher's Russian friend specified:

```
newCardSteps:                [15, 1440, 8640]   (minutes: 15min, 1d, 6d)
graduatingInterval:          15                  (days)
easyInterval:                60                  (days)
startingEase:                2.5                 (250%)
lapseSteps:                  [20]                (minutes)
lapseNewIntervalMultiplier:  0.7                 (gentler than Anki default)
lapseMinInterval:            2                   (days)
intervalModifier:            1.0                 (global ×; not yet exposed)
hardMultiplier:              1.2
easyBonus:                   1.3
minEase:                     1.3
```

### State transitions, in plain English

**New / Learning state.** A brand-new card climbs a three-rung ladder:
15 minutes, then 1 day, then 6 days. "Good" advances one rung. "Hard" stays on
the current rung. "Again" resets to the bottom rung. "Easy" skips the entire
ladder and graduates the card straight into Review with a 60-day interval.
After successfully completing all three rungs with "Good," the card graduates
into Review with a 15-day interval (the `graduatingInterval`).

**Review state.** Mature cards. "Good" multiplies the current interval by the
ease factor. "Hard" multiplies by 1.2 and lowers ease slightly. "Easy"
multiplies by ease × 1.3 and raises ease. "Again" causes a *lapse*: the card
enters Relearning, its interval is reduced (but not reset!) to
`max(2 days, oldInterval × 0.7)`, and ease drops by 0.20.

**Relearning state.** A single 20-minute step. After successfully passing it
(with Good or Easy), the card returns to Review at the *reduced* interval that
was computed at the moment of the lapse. This is the crucial humane behavior:
forgetting is treated as a partial setback, not a total reset.

### The session requeue rule

In `App.rateCard`, after a card is rated, it is requeued into the current
session only if its next review falls within the next **5 minutes**.
Anything longer (including the 15-minute first ladder rung) leaves the
session and returns when actually due. This was tightened from an earlier
30-minute window because the larger window caused new cards to loop
back instantly within the same session.

### A known nuance about migration

The migration function `migrateCard` upgrades old card records (which only had
`repetitions`, `easeFactor`, `interval`) to the new state-based schema:

- 0 repetitions → `state: 'new'`
- 1–2 repetitions → `state: 'learning'` at the corresponding ladder step
- 3+ repetitions → `state: 'review'`

There was an earlier bug where 1–2 repetition cards were incorrectly placed
into `review`. That's fixed, but cards already migrated under the old buggy
function still carry the wrong state. The cleanest workaround is to delete
and recreate any affected sample data; alternatively, a one-time
re-migration could be added that detects and corrects them.

---

## 5. Key product / pedagogical decisions, with reasoning

These are the choices that distinguish this app from a generic SRS tool.
Please don't change any of them without an explicit conversation.

- **Image on the back, not the front.** A picture of an apple next to
  *elma* during recall would give the answer away. The image earns its
  keep as a visual anchor for the meaning at the moment of revelation.
- **Onboarding hints retire after 3 cards.** Good educational software
  scaffolds at first, then trusts the user. The placeholder examples
  (`anlam`, `meaning`, `Hayatın anlamı nedir?`, etc.) appear only for the
  user's first three card additions across all sessions.
- **No streaks, no points, no badges.** The teacher explicitly preferred
  warmth and gentleness over gamification. The completion screen after a
  review session uses ornamental dots and an italic "Session complete"
  rather than fanfare.
- **Lapses are gentle (70% retained, not 0%).** Memory loss is partial
  and gradual; the algorithm should mirror that. This is the single most
  emotionally important setting in the whole config.
- **"New cards/day: no daily cap."** The teacher's friend set this to
  1000, effectively unlimited. We honor that — the teacher knows their
  own appetite for new vocabulary.

---

## 6. File structure (current state — single artifact)

The app currently exists as a **single React file** of ~1,400 lines, suitable
for a Claude.ai artifact but unsustainable as a real project. The first
substantive task in Claude Code will be to unpack it into a proper structure.

A reasonable target layout:

```
src/
  App.jsx                  — top-level state, view routing
  algorithm/
    settings.js            — the SETTINGS object
    scheduler.js           — applyRating, migrateCard, isDue
  storage/
    storage.js             — load/save data, image keys
    images.js              — processImageFile, loadCardImage, saveCardImage, removeCardImage
  views/
    HomeView.jsx
    DeckView.jsx
    ReviewView.jsx
    AddDeckForm.jsx
    CardForm.jsx
  components/
    CardThumbnail.jsx
    Loader.jsx
    ThemeStyles.jsx        — the embedded <style> block
  utils/
    id.js                  — makeId
    interval.js            — previewInterval
```

The `window.storage` calls will need to be replaced. For local development,
`localStorage` is a fine starting point. The longer-term plan is Supabase or
Firebase once student accounts become real.

---

## 7. The arc so far — what we've built together

In order, the conversation in Claude.ai progressed through:

1. Initial concept discussion: explained SM-2, the staged-prototype-then-real
   approach, and the eventual move to Claude Code.
2. First prototype: full SRS app as a single artifact, with the scholarly
   notebook aesthetic, sample French deck, and a basic SM-2 implementation.
3. Onboarding hints made conditional (first 3 cards only) and switched
   from French to Turkish examples.
4. Added card editing (unified `CardForm`) and image upload, with on-card
   thumbnails and back-of-card image display in review.
5. Replaced SM-2 with full Anki-style state-machine scheduling per the
   "Russian friend" settings.
6. Bug fixes: tightened session requeue from 30min to 5min; corrected the
   migration so 1–2 repetition cards land in `learning`, not `review`.

The teacher then chose to begin the move to Claude Code on Windows. This
document accompanies that move.

---

## 8. How to begin in Claude Code

When the teacher opens this project in Claude Code for the first time, the
ideal opening move is to:

1. Read this document. (You're doing that now. Good.)
2. Acknowledge what we have and what we've deferred.
3. Ask the teacher what they want to tackle first. The most likely next
   steps are: (a) unpacking the artifact into the proposed file structure,
   (b) deck editing, (c) export/import for sharing decks, (d) audio support,
   or (e) the leap to Supabase + multi-user accounts. Don't pick for them.

The original artifact code (a `.jsx` file of ~1,400 lines) should be in the
project folder alongside this document. If it isn't, ask the teacher to
paste it in or share it from their Claude.ai conversation history.

---

*Written with care. Please carry it forward with the same.*
