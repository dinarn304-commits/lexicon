import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BASE_URL = 'https://lexicon-lingua.vercel.app';

export default function ShareModal({ shareUrl, error, onClose }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = shareUrl ? `${BASE_URL}${shareUrl}` : '';

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

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return createPortal(
    <div className="feedback-overlay" onClick={handleOverlayClick}>
      <div className="share-modal">
        <button className="feedback-modal-close" onClick={onClose} aria-label="Close">✕</button>
        {error ? (
          <p className="share-modal-error">
            That didn't quite work — please try again in a moment.
          </p>
        ) : (
          <>
            <h2 className="share-modal-title">Your shared link</h2>
            <input
              className="share-modal-url-input"
              type="text"
              readOnly
              value={fullUrl}
              onFocus={(e) => e.target.select()}
            />
            <button className="share-modal-copy-btn" onClick={handleCopy}>
              {copied ? 'copied' : 'copy link'}
            </button>
            <p className="share-modal-hint">anyone with this link can read this text.</p>
            <p className="share-modal-coda">« sharing is caring »</p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
