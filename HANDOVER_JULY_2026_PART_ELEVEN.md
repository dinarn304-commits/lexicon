# Lexicon — Handover, July 2026 (Part Eleven)

> If you are Claude reading this at the start of a session, read it in full before
> touching the reading section. It captures the *why* behind the multilingual
> reading arc, so the next phase builds on the design rather than drifting from it.
> It complements `PROJECT_NOTES`, which remains the canonical overview of the app.

This document closes a three-part arc that grew Lexicon's reading section from a
Turkish/English/Spanish tool into a genuinely multilingual — and now
bidirectional — reading experience.

---

## 1. The one thing not to "fix": the target toggle includes the source language

When you open a word or phrase in the translation panel, the target-language
toggle shows **all ten** codes in canonical order — `tr en es fr ru de ar fa hi
zh` — **including the language the text itself is written in**. A French text
still offers `fr`; an Arabic text still offers `ar`.

This looks like a bug. It is not. It was a deliberate decision made in an
untracked Fable 5 session, and it exists to enable **monolingual explanations**
through the GPT layer. A learner reading French who selects an abbreviation, an
unfamiliar acronym, or a word they want a plain-language synonym for can set the
target to `fr` and ask the model to explain *in French* — expanding the
abbreviation, offering a same-language synonym, paraphrasing. Same-language pairs
skip Glosbe and DeepL (both meaningless for a same-language request) and route to
the GPT define/translate layer, which is happy to explain a word in its own
language.

**Do not add source-language filtering to the toggle.** If a future prompt asks
you to "remove the redundant source language from the picker," stop and surface
this note first.

---

## 2. Round one — new sources, new targets, and the GPT sentence fallback

The first round of this arc (commit `reading: add French and Hindi sources,
Persian and Hindi targets, GPT sentence fallback for non-DeepL pairs`) added:

- **Two source languages:** French (`fr`) and Hindi (`hi`), each with its own
  lazily-created "discovered words" deck, driven entirely by `SOURCE_LANGUAGES`
  in `src/utils/language.js` and `getLanguageMeta()`.
- **Two target languages:** Persian (`fa`) and Hindi (`hi`), growing the panel
  toggle from eight codes to ten.
- **A GPT sentence-translation fallback.** DeepL does not handle Persian or
  Hindi. Rather than special-casing calls in two places, sentence translation was
  centralised into a single shared router, `translateSentence()` in
  `language.js`: if **both** sides of the pair are in `DEEPL_SUPPORTED`
  (`tr en es fr ru de ar zh`), it calls `/api/deepl`; otherwise it calls the new
  `/api/gpt-translate` (modelled exactly on `/api/define` — same model constant,
  `max_completion_tokens`, no temperature, `json_object` response, honest error
  passthrough, and it never logs the text being translated). The panel labels the
  result **DeepL — translation** or **GPT — translation**, computed
  deterministically from the pair so the label is correct before the request even
  resolves.
- **Devanagari sentence boundaries.** `findSentence()` learned the danda `।`
  (U+0964) and double danda `॥` (U+0965) so Hindi sentences are extracted
  correctly for both the context sentence and the Example-field pre-fill.

The guiding principle throughout: **one shared utility, used identically by both
reading views** (`src/views/ReadingPane.jsx` and `src/views/SharedTextView.jsx`),
which duplicate selection and rendering logic and must never drift apart.

---

## 3. This round — Arabic and Persian sources, RTL reading, and Amiri

This round (commit `reading: Arabic and Persian sources with RTL reading, Amiri
typeface, target toggle two-row layout`) brings Lexicon its first
**right-to-left** reading experience.

### 3.1 A deliberate two-row target toggle

Ten codes no longer fit on one row in the 22rem side-panel (or the mobile
bottom-sheet). The old markup rendered each `·` separator as its own standalone
element between the codes, which on a wrap could leave a dot floating orphaned at
a row's edge.

The fix is a **gutter-clipping** pattern. Every code carries its separator as an
absolutely-positioned `::before` dot living in a fixed left "gutter." The flex row
is pulled left by exactly one gutter width (`margin-left: -0.9rem`) and a wrapper
(`.translation-lang-toggle-clip`) clips the overflow with `overflow: hidden`. The
result: each row's *leading* dot falls into the clipped gutter and disappears, so
dots render **only between codes on the same row** — never dangling at the start
*or* end of a wrapped line, for any number of rows and any wrap point. A
`row-gap: 0.35rem` lets the two rows breathe so the wrap reads as deliberate
design rather than collision. Font, size, letter-spacing, and the terracotta
active-underline are unchanged (the underline sits on the code text; the dot is
out-of-flow and stays faint).

### 3.2 Arabic and Persian as source languages

`ar` (العربية) and `fa` (فارسی) join `SOURCE_LANGUAGES`, each with its own
discovered-words deck. Their Persian deck name preserves the ZWNJ (U+200C)
joiners exactly (`واژه‌های کشف‌شده…`). Two small exports were added:
`RTL_LANGUAGES = ['ar','fa']` and `isRTL(code)`.

### 3.3 The RTL reading experience

When a text's `sourceLanguage` is RTL, **only** the reading title and the reading
body container receive the HTML `dir="rtl"` attribute — never the page, the
chrome, or the translation panel. We use the `dir` attribute rather than CSS
`direction` precisely so the browser's bidi algorithm handles embedded Latin
(names, numbers, acronyms) correctly. Text alignment then follows from direction.

Crucially, the **selection handlers were left untouched.** Both views' mouse and
touch handlers are built on `window.getSelection()`, `.closest()`, and
`document.elementFromPoint(x, y)` (a point hit-test), with movement thresholds
using `Math.abs()` on both axes. None of this assumes left-to-right geometry, so
RTL "just works" at the DOM level. The list and blockquote styles were switched
from physical `left` properties to logical (`padding-inline-start`,
`border-inline-start`) so their ornaments sit on the correct side in RTL with zero
change to LTR rendering.

Arabic and Persian are space-separated, so word spans, click handling, and word
counting are unchanged.

### 3.4 The Amiri typeface

So RTL texts still feel like Lexicon rather than a browser default, we load
**Amiri** (weights 400/700) via the same Google Fonts `@import` that already
serves Fraunces and DM Mono. Amiri covers both Arabic and Persian glyph ranges
(including پ چ ژ گ). It is applied in two places:

1. **The RTL reading title and body**, as `'Amiri', 'Fraunces', serif` — Amiri
   leads so the script renders in its intended face; any embedded Latin falls
   through to Fraunces per-glyph.
2. **The panel's result text** (headword, Glosbe items, sentence-translation
   result, GPT define base/meaning lines), where `'Amiri'` is inserted
   *immediately after* `'Fraunces'` in the existing stacks. Because browsers fall
   back per-glyph, Latin and Cyrillic are completely unaffected — only
   Arabic-script glyphs pick up Amiri. This means an Arabic or Persian *target*
   translation renders beautifully for a reader of **any** source language.

No line-height overrides were added to compensate for Amiri's taller profile —
we honour the script's natural vertical metrics (an established May decision).

### 3.5 Sentence boundaries and backends

`findSentence()` now also treats the Arabic question mark `؟` (U+061F) as a
sentence terminator. Arabic and Persian use the Latin full stop to end
statements; the Arabic comma `،` is **not** a boundary and is deliberately
excluded. `api/glosbe.js` gained `ar`/`fa` as valid sources (they were already
valid targets). `api/define.js` already knew both languages. And
`api/deepl.js` needed **zero** changes: `DEEPL_SUPPORTED` already contains `ar`
and excludes `fa`, so Arabic pairs route to DeepL while any Persian pair routes to
GPT — automatically, through the shared `translateSentence()`.

---

## 3bis. Round three — Chinese, and the end of the whitespace assumption

This round (part of the same commit series, `reading: Chinese source with
Intl.Segmenter word segmentation and Noto Serif SC`) added **Chinese (`zh`)** as
the eighth source language. Chinese is the first source language written *without
spaces between words*, which quietly broke three assumptions the reading section
had relied on since day one: how paragraphs are split into clickable word spans,
how words are counted, and how a selection is routed between the GPT
single-word/short-phrase path and the DeepL 3+-word path.

### The shared tokenizer, `src/utils/tokenize.js`

Rather than sprinkle `sourceLang === 'zh'` checks across two reading views, a panel,
and an import modal, all word segmentation now lives in one module:

- **`segmentParagraph(text, sourceLang)`** returns ordered `{ text, isWord }`
  tokens. For every non-CJK language it reproduces the historical
  `split(/(\s+)/)` behaviour **exactly** — this was a refactor for them, not a
  change, and it was verified byte-for-byte. For `zh` it uses
  `Intl.Segmenter('zh', { granularity: 'word' })`; word-like segments become
  clickable spans, punctuation and any stray whitespace become inert text.
- **`countWords(text, sourceLang)`** is the counting counterpart: the old
  `split(/\s+/)` for non-CJK, the count of word-like segments for `zh`.

The `Intl.Segmenter` is built into every modern browser (no library), and we
instantiate it **once, lazily** — segmenting per paragraph with a fresh Segmenter
would be wasteful. There is a guard: if `Intl.Segmenter` is absent (a very old
browser), `zh` falls back to character-level tokens, so clicking still works at
the character level and nothing crashes.

A note on segmentation quality: the browser's ICU dictionary decides where word
boundaries fall (e.g. clicking inside 图书馆 selects the whole word, not one
character). This is the runtime's job, not ours; browser ICU is good, and it is
what both localhost and production use.

### The three counting sites that moved

Every whitespace count now flows through `countWords(text, sourceLang)`: the
import modal's word count (it knows the selected source-language pill), the
reading progress tracking (`countBlockWords` / `countWordsInDoc` in both views),
and — crucially — the **1–2-vs-3+ routing** in `handleQueryFound` in both views
*and* the independent `isShortSelection` check inside `TranslationPanel`. If the
panel's count disagreed with the view's, a Chinese sentence (one whitespace chunk)
would be mislabelled "short" and shown the wrong layout; both now segment.

### Punctuation and typeface

`findSentence()` gained the CJK terminators `。` (U+3002), `！` (U+FF01), `？`
(U+FF1F). The CJK commas `、` and `，` are **not** sentence boundaries and are
deliberately excluded.

Chinese reads in **Noto Serif SC** (weights 400/700), loaded through the same
Google Fonts `@import` as Fraunces, DM Mono, and Amiri. It is applied to the
reading title and body of `zh` texts via a conditional `data-lang="zh"` attribute
(mirroring how Amiri keys off a conditional `dir="rtl"` — set only on the relevant
texts, so every other language is byte-identical), and it is appended to the
panel's result-text stacks *immediately after* Amiri
(`'Fraunces', 'Amiri', 'Noto Serif SC', serif`). Per-glyph fallback keeps Latin in
Fraunces and Arabic script in Amiri; only Han glyphs reach Noto Serif SC — so a
Chinese *target* translation renders properly for a reader of any source language.
No line-height override — the script's natural metrics are honoured, per the
standing rule. `DEEPL_SUPPORTED` already contained `zh`, so Chinese sentence pairs
route to DeepL with no routing change; `api/glosbe.js` gained `zh` as a valid
source (it was already a valid target).

---

## 4. What is deliberately left for a future round

- **No RTL work on the app chrome, panel, or controls.** Only the reading title
  and body are bidirectional. This is intentional.
- **Touch selection on RTL text is unverified on real devices.** The handlers are
  direction-agnostic by construction, but a long-press-drag across an Arabic
  phrase on an iPhone/iPad is the gesture to confirm before trusting it fully.

As always: the spaced-repetition scheduler, rating logic, intervals, ease
factors, due dates, and learning states were **not touched** in any part of this
arc, and must not be.
