import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { makeId } from '../utils/id';

export default function AddDeckForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');

  function submit() {
    if (!name.trim()) return;
    onSave({
      id: makeId(),
      name: name.trim(),
      description: description.trim(),
      language: language.trim(),
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 fade-up">
      <button className="btn btn-quiet text-sm flex items-center gap-1 mb-6" onClick={onCancel}>
        <ChevronLeft size={16} /> Back
      </button>
      <div className="ornament text-xs mb-3">· NEW DECK ·</div>
      <h1 className="display text-3xl mb-6">A fresh page</h1>

      <div className="space-y-4">
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Deck name
          </label>
          <input
            className="input"
            placeholder="e.g. Spanish — Chapter 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Language (optional)
          </label>
          <input
            className="input"
            placeholder="Spanish, German, Hungarian…"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Description (optional)
          </label>
          <textarea
            className="input"
            rows={2}
            placeholder="A short note about this deck"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            className="btn btn-primary px-5 py-2.5"
            onClick={submit}
            disabled={!name.trim()}
            style={{ opacity: name.trim() ? 1 : 0.5 }}
          >
            Create deck
          </button>
          <button className="btn btn-ghost px-5 py-2.5" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
