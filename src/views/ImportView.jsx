import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function ImportView({ file, decks, onImport, onCancel }) {
  const cardCount = file.cards.length;
  const meta = file.deck || {};

  const [mode, setMode] = useState(decks.length > 0 ? 'existing' : 'new');
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [name, setName] = useState(meta.name || '');
  const [language, setLanguage] = useState(meta.language || '');
  const [description, setDescription] = useState(meta.description || '');
  const [status, setStatus] = useState('idle'); // idle | importing | done | error
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { count, failures, deckName }

  const canImport =
    status !== 'importing' &&
    (mode === 'existing' ? !!selectedDeckId : !!name.trim());

  async function handleImport() {
    if (!canImport) return;
    setStatus('importing');
    setError('');
    try {
      const destination =
        mode === 'existing'
          ? { kind: 'existing', deckId: selectedDeckId }
          : {
              kind: 'new',
              name: name.trim(),
              language: language.trim(),
              description: description.trim(),
            };
      const res = await onImport(file, destination);
      setResult(res);
      setStatus('done');
    } catch (err) {
      setError(err?.message || 'Something went wrong during import.');
      setStatus('error');
    }
  }

  if (status === 'done' && result) {
    return (
      <div className="max-w-xl mx-auto px-6 py-10 fade-up">
        <div className="ornament text-xs mb-3">· IMPORTED ·</div>
        <h1 className="display text-3xl mb-4">All done</h1>
        <p className="text-lg mb-2" style={{ color: 'var(--ink-soft)' }}>
          ✓ Imported {result.count} card{result.count === 1 ? '' : 's'} into{' '}
          <span className="display" style={{ color: 'var(--ink)' }}>{result.deckName}</span>.
        </p>
        {result.failures > 0 && (
          <p className="italic text-sm mb-4" style={{ color: 'var(--terracotta)' }}>
            {result.failures} image{result.failures === 1 ? '' : 's'} couldn't be saved — your device
            storage may be full. Those cards were imported without their images.
          </p>
        )}
        <button className="btn btn-primary px-5 py-2.5 mt-4" onClick={onCancel}>
          Back to your decks
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 fade-up">
      <button className="btn btn-quiet text-sm flex items-center gap-1 mb-6" onClick={onCancel}>
        <ChevronLeft size={16} /> Back
      </button>
      <div className="ornament text-xs mb-3">· IMPORT ·</div>
      <h1 className="display text-3xl mb-2">Bring cards into a deck</h1>
      <p className="italic mb-6" style={{ color: 'var(--ink-soft)' }}>
        {cardCount} card{cardCount === 1 ? '' : 's'}
        {meta.name ? <> from “{meta.name}”</> : null}. They'll be added as-is, keeping their review
        schedules.
      </p>

      <div className="flex gap-4 mb-6">
        {[['existing', 'an existing deck'], ['new', 'a new deck']].map(([value, label]) => (
          <button
            key={value}
            className={`mode-opt${mode === value ? ' active' : ''}`}
            onClick={() => setMode(value)}
            disabled={value === 'existing' && decks.length === 0}
            style={{ opacity: value === 'existing' && decks.length === 0 ? 0.4 : 1 }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'existing' ? (
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--ink-faint)' }}>
            Choose a deck
          </label>
          {decks.length === 0 ? (
            <p className="italic text-sm" style={{ color: 'var(--ink-soft)' }}>
              You have no decks yet — create a new one instead.
            </p>
          ) : (
            <ul className="space-y-2">
              {decks.map((deck) => {
                const selected = selectedDeckId === deck.id;
                return (
                  <li key={deck.id}>
                    <button
                      className="paper-card w-full text-left flex items-center justify-between gap-4"
                      style={{
                        padding: '12px 16px',
                        borderColor: selected ? 'var(--terracotta)' : undefined,
                        boxShadow: selected ? 'inset 0 0 0 1px var(--terracotta)' : undefined,
                      }}
                      onClick={() => setSelectedDeckId(deck.id)}
                    >
                      <span className="display text-lg">{deck.name}</span>
                      {selected && <span className="mono text-xs" style={{ color: 'var(--terracotta)' }}>selected</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
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
        </div>
      )}

      {error && (
        <p className="italic text-sm mt-4" style={{ color: 'var(--terracotta)' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-6">
        <button
          className="btn btn-primary px-5 py-2.5"
          onClick={handleImport}
          disabled={!canImport}
          style={{ opacity: canImport ? 1 : 0.5 }}
        >
          {status === 'importing'
            ? 'Importing…'
            : `Import ${cardCount} card${cardCount === 1 ? '' : 's'}`}
        </button>
        <button className="btn btn-ghost px-5 py-2.5" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
