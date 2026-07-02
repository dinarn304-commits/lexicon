// Word segmentation shared by both reading views and every word counter.
// Most languages delimit words with whitespace; Chinese does not, so for zh we
// use Intl.Segmenter (built into every modern browser, no library needed). This
// lives in ONE module so the two reading views can never segment differently.

const SEGMENTED_LANGS = new Set(['zh']);

// Constructing a Segmenter is not free, so build it once, lazily, and reuse it.
let zhSegmenter;
function getZhSegmenter() {
  if (zhSegmenter === undefined) {
    zhSegmenter =
      typeof Intl !== 'undefined' && Intl.Segmenter
        ? new Intl.Segmenter('zh', { granularity: 'word' })
        : null;
  }
  return zhSegmenter;
}

function segmentCJK(text) {
  const segmenter = getZhSegmenter();
  // Very old browser without Intl.Segmenter: fall back to character-level tokens
  // so clicking still works (each non-space character becomes its own word).
  if (!segmenter) {
    return Array.from(text).map((ch) => ({ text: ch, isWord: !/\s/.test(ch) }));
  }
  const tokens = [];
  for (const seg of segmenter.segment(text)) {
    tokens.push({ text: seg.segment, isWord: !!seg.isWordLike });
  }
  return tokens;
}

// Ordered tokens { text, isWord }. isWord tokens render as clickable word spans;
// everything else (whitespace, punctuation) renders as inert text between them.
// For non-CJK this reproduces the historical `split(/(\s+)/)` behaviour exactly,
// so rendering for existing languages is unchanged.
export function segmentParagraph(text, sourceLang) {
  if (!text) return [];
  if (SEGMENTED_LANGS.has(sourceLang)) return segmentCJK(text);
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part) => ({ text: part, isWord: !/^\s+$/.test(part) }));
}

// Counts words the same way the app always has for non-CJK languages; for zh it
// counts word-like segments rather than whitespace chunks or characters.
export function countWords(text, sourceLang) {
  if (!text) return 0;
  if (SEGMENTED_LANGS.has(sourceLang)) {
    return segmentCJK(text).filter((t) => t.isWord).length;
  }
  return text.split(/\s+/).filter(Boolean).length;
}
