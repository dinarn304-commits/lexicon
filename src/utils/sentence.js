// Finds the sentence containing `query` within `paraText` by scanning for
// . ? ! boundaries. Known v1 limitations: Turkish abbreviations ("Dr.", "vb.",
// "vs.", "A.B.D.") and numeric thousands-separators ("5.000") will be treated
// as sentence-ending punctuation rather than mid-sentence periods.
export function findSentence(paraText, query) {
  if (!paraText) return '';
  if (!query) return paraText;

  const idx = paraText.indexOf(query);
  if (idx === -1) return paraText;

  let start = 0;
  for (let i = idx - 1; i >= 0; i--) {
    if (/[.?!]/.test(paraText[i])) {
      start = i + 1;
      break;
    }
  }

  let end = paraText.length;
  for (let i = idx; i < paraText.length; i++) {
    if (/[.?!]/.test(paraText[i])) {
      end = i + 1;
      break;
    }
  }

  return paraText.slice(start, end).trim();
}
