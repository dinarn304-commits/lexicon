import { useEffect } from 'react';

const SUPPORT_OPTIONS = [
  { label: 'Support on Boosty', url: 'https://boosty.to/dinarn304' },
  // Ko-fi will join here (for supporters outside Russia):
  // { label: 'Support on Ko-fi', url: '…' },
];

export default function SupportModal({ onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="feedback-overlay" onClick={handleOverlayClick}>
      <div className="feedback-modal">
        <button className="feedback-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="feedback-modal-heading">Support Lexicon</h2>
        <p className="feedback-modal-body">
          If Lexicon has been useful to you, you're welcome to help keep it alive.
        </p>
        <div className="support-modal-options">
          {SUPPORT_OPTIONS.map((option) => (
            <a
              key={option.url}
              className="support-modal-link"
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {option.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
