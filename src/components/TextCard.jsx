import { X } from 'lucide-react';

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
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TextCard({ text, onOpen, onDelete }) {
  const excerpt = extractPlainText(text.content).slice(0, 150);

  function handleDelete(e) {
    e.stopPropagation();
    if (window.confirm(`Delete "${text.title}"? This cannot be undone.`)) {
      onDelete(text.id);
    }
  }

  return (
    <div className="text-card" onClick={() => onOpen(text.id)}>
      <button className="text-card-delete" onClick={handleDelete} aria-label="Delete text">
        <X size={13} />
      </button>
      <h3 className="text-card-title">{text.title}</h3>
      <div className="text-card-excerpt">
        <p className="text-card-excerpt-text">{excerpt}</p>
      </div>
      <div className="text-card-meta">
        <span>{text.wordCount.toLocaleString()} words</span>
        <span className="text-card-meta-dot">·</span>
        <span>{formatDate(text.createdAt)}</span>
      </div>
    </div>
  );
}
