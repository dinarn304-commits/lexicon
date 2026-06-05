import { Link } from 'react-router-dom';

// The Lexicon identity: feather-quill + LEXICON wordmark. A quiet link home to
// the vocabulary view. `onClick` runs before navigation — the Guide uses it to
// close its overlay so the link genuinely lands the user on vocabulary.
export default function Wordmark({ onClick }) {
  return (
    <Link to="/vocabulary" className="logo-unit logo-link" onClick={onClick} aria-label="Lexicon — home">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <path d="M 26,3 C 29,5 28,10 24,15 C 21,19 17,23 12,27 L 8,29 L 9,25 C 13,23 17,19 21,15 C 24,11 26,7 26,3 Z" fill="var(--terracotta)" />
        <line x1="9" y1="26" x2="24" y2="6" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        <line x1="11" y1="22" x2="15" y2="24" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        <line x1="14" y1="18" x2="18" y2="20" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        <line x1="18" y1="13" x2="22" y2="15" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        <line x1="21" y1="9" x2="25" y2="11" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      </svg>
      <span className="logo-wordmark">Lexicon</span>
    </Link>
  );
}
