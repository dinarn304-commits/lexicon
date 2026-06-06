import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Plus, GraduationCap, Pencil, Trash2, Upload, CheckSquare, Square } from 'lucide-react';
import { isDue } from '../algorithm/scheduler';
import { serializeCards, downloadJson } from '../storage/transfer';
import CardThumbnail from '../components/CardThumbnail';
import SpeakerButton from '../components/SpeakerButton';
import DeckForm from './DeckForm';
import CardForm from './CardForm';
import NotFoundView from './NotFoundView';

function exportFilename(deck) {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = (deck.slug || deck.name || 'deck').toString();
  return `lexicon-${base}-${stamp}.json`;
}

export default function DeckView({ data, direction, onSetDirection, onSaveCard, onUpdateCard, onUpdateDeck, onDeleteCard, onDeleteDeck }) {
  const { deckSlug } = useParams();
  const navigate = useNavigate();

  const deck = data.decks.find((d) => d.slug === deckSlug);
  const cards = deck ? data.cards.filter((c) => c.deckId === deck.id) : [];
  const due = cards.filter(isDue);

  const [subView, setSubView] = useState('deck');
  const [editingCardId, setEditingCardId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  async function exportCards(cardsToExport) {
    if (cardsToExport.length === 0) return;
    const file = await serializeCards(cardsToExport, deck);
    downloadJson(exportFilename(deck), file);
  }

  function openSelectMode() {
    setSelectedIds(new Set());
    setSubView('exportSelect');
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    document.title = deck ? `Lexicon · ${deck.name}` : 'Lexicon';
  }, [deck?.name]);

  useEffect(() => {
    if (subView !== 'deck') return;
    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Enter' && due.length > 0) { e.preventDefault(); navigate(`/vocabulary/${deckSlug}/review`); }
      else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setSubView('addCard'); }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [due.length, subView, deckSlug, navigate]);

  if (!deck) return <NotFoundView />;

  if (subView === 'editDeck') {
    return (
      <DeckForm
        initialDeck={deck}
        onSave={(updated) => { onUpdateDeck(updated); setSubView('deck'); }}
        onCancel={() => setSubView('deck')}
      />
    );
  }

  if (subView === 'addCard') {
    return (
      <CardForm
        deck={deck}
        onSave={(card, addAnother) => { onSaveCard(card); if (!addAnother) setSubView('deck'); }}
        onCancel={() => setSubView('deck')}
        userAddedCount={data.cardsAddedByUser || 0}
      />
    );
  }

  if (subView === 'editCard' && editingCardId) {
    return (
      <CardForm
        deck={deck}
        existingCard={data.cards.find((c) => c.id === editingCardId)}
        onSave={(card) => { onUpdateCard(card); setEditingCardId(null); setSubView('deck'); }}
        onCancel={() => { setEditingCardId(null); setSubView('deck'); }}
      />
    );
  }

  if (subView === 'exportSelect') {
    const allSelected = cards.length > 0 && selectedIds.size === cards.length;
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 fade-up">
        <button className="btn btn-quiet text-sm flex items-center gap-1 mb-6" onClick={() => setSubView('deck')}>
          <ChevronLeft size={16} /> Back to {deck.name}
        </button>
        <div className="ornament text-xs mb-3">· SELECT WORDS ·</div>
        <h1 className="display text-3xl mb-2">Choose cards to export</h1>
        <div className="flex items-baseline justify-between mb-6">
          <p className="italic" style={{ color: 'var(--ink-soft)' }}>
            {selectedIds.size} of {cards.length} selected
          </p>
          <button
            className="btn btn-quiet text-sm"
            onClick={() => setSelectedIds(allSelected ? new Set() : new Set(cards.map((c) => c.id)))}
          >
            {allSelected ? 'Select none' : 'Select all'}
          </button>
        </div>

        <ul className="space-y-2">
          {cards.map((card) => {
            const checked = selectedIds.has(card.id);
            return (
              <li key={card.id}>
                <button
                  className="paper-card w-full text-left flex items-center gap-3"
                  style={{
                    padding: '12px 16px',
                    borderColor: checked ? 'var(--terracotta)' : undefined,
                    boxShadow: checked ? 'inset 0 0 0 1px var(--terracotta)' : undefined,
                  }}
                  onClick={() => toggleSelected(card.id)}
                  aria-pressed={checked}
                >
                  <span style={{ color: checked ? 'var(--terracotta)' : 'var(--ink-faint)', flexShrink: 0 }}>
                    {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                  </span>
                  <span className="flex-1 min-w-0 display text-lg">
                    {card.front}
                    <span style={{ color: 'var(--ink-faint)' }}> — </span>
                    <span style={{ color: 'var(--ink-soft)' }}>{card.back}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex gap-3 pt-6">
          <button
            className="btn btn-primary px-5 py-2.5 flex items-center gap-2"
            onClick={() => { exportCards(cards.filter((c) => selectedIds.has(c.id))); setSubView('deck'); }}
            disabled={selectedIds.size === 0}
            style={{ opacity: selectedIds.size === 0 ? 0.5 : 1 }}
          >
            <Upload size={16} /> Export {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}selected
          </button>
          <button className="btn btn-ghost px-5 py-2.5" onClick={() => setSubView('deck')}>Cancel</button>
        </div>
      </div>
    );
  }

  const newCards  = cards.filter((c) => (c.state || 'new') === 'new');
  const learning  = cards.filter((c) => { const s = c.state || 'new'; return s === 'learning' || s === 'relearning'; });
  const mastering = cards.filter((c) => (c.state || 'new') === 'review');

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 fade-up">
      <Link className="btn btn-quiet text-sm flex items-center gap-1 mb-6" to="/vocabulary">
        <ChevronLeft size={16} /> Notebook
      </Link>

      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="ornament text-xs mb-3">· DECK ·</div>
            <div className="flex items-baseline gap-2 mb-2">
              <h1 className="display text-4xl">{deck.name}</h1>
              <button
                className="btn btn-quiet p-1.5"
                onClick={() => setSubView('editDeck')}
                aria-label="Edit deck"
                title="Edit deck"
              >
                <Pencil size={14} />
              </button>
            </div>
            {deck.description && (
              <p className="italic text-lg" style={{ color: 'var(--ink-soft)' }}>
                {deck.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-8 paper-card" style={{ padding: '20px 24px' }}>
          <div>
            <div className="mono text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-faint)' }}>New</div>
            <div className="display text-2xl">{newCards.length}</div>
          </div>
          <div>
            <div className="mono text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-faint)' }}>Learning</div>
            <div className="display text-2xl">{learning.length}</div>
          </div>
          <div>
            <div className="mono text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-faint)' }}>Mastering</div>
            <div className="display text-2xl">{mastering.length}</div>
          </div>
        </div>

        <div className="mt-6">
          {due.length > 0 && (
            <div className="text-center mb-4">
              <div className="mono mb-3" style={{ fontSize: 13, color: 'var(--ink-soft)', letterSpacing: '0.12em' }}>
                begin with
              </div>
              <div className="flex gap-4 justify-center">
                {[['forward', 'word'], ['reverse', 'meaning']].map(([value, label]) => (
                  <button
                    key={value}
                    className={`mode-opt${direction === value ? ' active' : ''}`}
                    onClick={() => onSetDirection(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            <button
              className="btn btn-primary px-6 py-3 flex items-center gap-2"
              onClick={() => navigate(`/vocabulary/${deckSlug}/review`)}
              disabled={due.length === 0}
              style={{ opacity: due.length === 0 ? 0.4 : 1 }}
            >
              <GraduationCap size={18} />
              {due.length > 0 ? `Review ${due.length} card${due.length === 1 ? '' : 's'}` : 'Nothing due'}
            </button>
            <button className="btn btn-ghost px-5 py-3 flex items-center gap-2" onClick={() => setSubView('addCard')}>
              <Plus size={16} /> Add card
            </button>
          </div>
        </div>
        <p className="mono text-xs mt-3" style={{ color: 'var(--ink-faint)' }}>
          Enter to review · N to add card
        </p>
      </header>

      <div className="divider-flourish mb-6">
        <hr />
        <span className="text-xs">·</span>
        <hr />
      </div>

      <section>
        <h2 className="display text-xl mb-4">All cards</h2>
        {cards.length === 0 ? (
          <div className="paper-card p-10 text-center">
            <p className="italic" style={{ color: 'var(--ink-soft)' }}>
              This deck is empty. Add your first word to begin.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cards.map((card) => (
              <li key={card.id} className="paper-card flex items-start justify-between gap-4" style={{ padding: '14px 18px' }}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {card.hasImage && <CardThumbnail cardId={card.id} />}
                  <div className="flex-1 min-w-0">
                    <div className="display text-lg">
                      {card.front}
                      <span style={{ color: 'var(--ink-faint)' }}> — </span>
                      <span style={{ color: 'var(--ink-soft)' }}>{card.back}</span>
                    </div>
                    {card.example && (
                      <div className="italic text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
                        {card.example}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isDue(card) ? (
                    <span className="due-pill mr-1">due</span>
                  ) : (
                    <span className="mono text-xs mr-1" style={{ color: 'var(--ink-faint)' }}>
                      {Math.ceil((new Date(card.nextReview) - new Date()) / 86400000)}d
                    </span>
                  )}
                  <SpeakerButton text={card.front} language={deck.language} className="list-card-speaker" />
                  <button
                    className="btn btn-quiet p-1.5"
                    onClick={() => { setEditingCardId(card.id); setSubView('editCard'); }}
                    aria-label="Edit card"
                    title="Edit card"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn btn-quiet p-1.5"
                    onClick={() => onDeleteCard(card.id)}
                    aria-label="Delete card"
                    title="Delete card"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {cards.length > 0 && (
        <div className="mt-12 pt-6 border-t flex flex-wrap gap-3" style={{ borderColor: 'var(--rule)' }}>
          <button className="btn btn-quiet text-sm flex items-center gap-1.5" onClick={() => exportCards(cards)}>
            <Upload size={14} /> Export deck
          </button>
          <button className="btn btn-quiet text-sm" onClick={openSelectMode}>
            Select words to export
          </button>
        </div>
      )}

      <div className="mt-12 pt-6 border-t" style={{ borderColor: 'var(--rule)' }}>
        {!confirmDelete ? (
          <button className="btn btn-quiet text-sm" onClick={() => setConfirmDelete(true)}>
            Delete this deck
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="italic text-sm" style={{ color: 'var(--ink-soft)' }}>Delete deck and all its cards?</span>
            <button className="btn btn-ghost text-sm px-3 py-1" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button
              className="btn text-sm px-3 py-1"
              style={{ background: 'var(--terracotta)', color: 'var(--paper-2)' }}
              onClick={() => onDeleteDeck(deck.id)}
            >
              Yes, delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
