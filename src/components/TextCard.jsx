import { X } from 'lucide-react';
import { getLanguageMeta } from '../utils/language';

function extractPlainText(doc) {
  const parts = [];
  function walk(node) {
    if (node.type === 'text') parts.push(node.text || '');
    if (node.content) node.content.forEach(walk);
  }
  if (doc?.content) doc.content.forEach(walk);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date}, ${time}`;
}

export default function TextCard({ text, onOpen, onDelete }) {
  const excerpt = extractPlainText(text.content).slice(0, 150);
  const pct = text.wordCount > 0
    ? Math.round(Math.min(100, Math.max(0, ((text.wordsReadInThisText ?? 0) / text.wordCount) * 100)))
    : 0;

  function handleDelete(e) {
    e.stopPropagation();
    if (window.confirm(`Delete "${text.title}"? This cannot be undone.`)) {
      onDelete(text.id);
    }
  }

  return (
    <div className="text-card" onClick={() => onOpen(text.id)}>
      <div className="text-card-header">
        <div className="text-card-title-row">
          <h3 className="text-card-title">{text.title}</h3>
          <span className="text-card-lang-tag">
            {getLanguageMeta(text.sourceLanguage || 'tr').nativeName}
          </span>
        </div>
        <div className="text-card-header-right">
          <button className="text-card-delete" onClick={handleDelete} aria-label="Delete text">
            <X size={13} />
          </button>
          {pct > 0 && (
            <div className="text-card-progress">
              <div className="text-card-progress-track">
                <div className="text-card-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-card-progress-label">{pct}% read</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-card-excerpt">
        <p className="text-card-excerpt-text">{excerpt}</p>
      </div>
      <div className="text-card-meta">
        <span>{text.wordCount.toLocaleString()} words</span>
        {formatDate(text.createdAt) && (
          <>
            <span className="text-card-meta-dot">·</span>
            <span>{formatDate(text.createdAt)}</span>
          </>
        )}
      </div>
    </div>
  );
}
