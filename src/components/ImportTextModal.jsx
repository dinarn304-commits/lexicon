import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { makeId } from '../utils/id';

function toTipTapDoc(plain) {
  const paragraphs = plain
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: 'paragraph', content: [{ type: 'text', text: p }] }));
  return {
    type: 'doc',
    content: paragraphs.length ? paragraphs : [{ type: 'paragraph' }],
  };
}

export default function ImportTextModal({ onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const valid = title.trim().length > 0 && body.trim().length > 0;

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

  function handleSave() {
    if (!valid) return;
    const now = new Date().toISOString();
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
    onSave({
      id: makeId(),
      title: title.trim(),
      content: toTipTapDoc(body),
      wordCount,
      wordsReadInThisText: 0,
      createdAt: now,
      updatedAt: now,
    });
    onClose();
  }

  return createPortal(
    <div className="feedback-overlay" onClick={handleOverlayClick}>
      <div className="import-text-modal">
        <button className="feedback-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="feedback-modal-heading">Import text</h2>

        <div className="import-text-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            className="input"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ boxSizing: 'border-box' }}
          />
          <textarea
            className="import-text-area"
            placeholder="Paste your text here."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="import-text-modal-footer">
          <button className="btn btn-quiet px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary px-5 py-2.5"
            onClick={handleSave}
            disabled={!valid}
            style={{ opacity: valid ? 1 : 0.5 }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
