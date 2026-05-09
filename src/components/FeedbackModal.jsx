import { useState, useEffect } from 'react';

export default function FeedbackModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const addr = 'dinarn304' + '@' + 'gmail.com';

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function copyEmail() {
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="feedback-overlay" onClick={handleOverlayClick}>
      <div className="feedback-modal">
        <button className="feedback-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="feedback-modal-heading">Get in touch</h2>
        <p className="feedback-modal-body">Drop me an email — I'd love to hear what you think.</p>
        <div className="feedback-modal-email-row">
          <span className="feedback-modal-email">{addr}</span>
          <button className="feedback-modal-copy-btn" onClick={copyEmail}>
            {copied ? '« Copied »' : '« Copy »'}
          </button>
        </div>
      </div>
    </div>
  );
}
