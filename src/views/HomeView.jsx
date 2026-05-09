import { useMemo } from 'react';
import { Plus, Feather, GripVertical } from 'lucide-react';
import { isDue } from '../algorithm/scheduler';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableDeckTile({ deck, deckCards, due, onOpenDeck }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deck.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="deck-tile relative group"
      onClick={() => onOpenDeck(deck.id)}
      {...attributes}
      {...listeners}
    >
      {/* grip hint — appears on hover only */}
      <div
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity opacity-0 group-hover:opacity-35"
        style={{ color: 'var(--ink-faint)', pointerEvents: 'none' }}
      >
        <GripVertical size={14} />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h3 className="display text-2xl">{deck.name}</h3>
            {deck.language && (
              <span
                className="mono text-xs px-2 py-0.5 rounded"
                style={{ background: 'var(--terracotta-soft)', color: 'var(--terracotta)' }}
              >
                {deck.language}
              </span>
            )}
          </div>
          {deck.description && (
            <p className="italic mb-3" style={{ color: 'var(--ink-soft)' }}>
              {deck.description}
            </p>
          )}
          <div className="flex gap-4 mono text-xs" style={{ color: 'var(--ink-soft)' }}>
            <span>{deckCards.length} card{deckCards.length === 1 ? '' : 's'}</span>
            <span>·</span>
            <span>{due} due</span>
          </div>
        </div>
        {due > 0 && <span className="due-pill mt-1.5">{due}</span>}
      </div>
    </div>
  );
}

export default function HomeView({ data, onOpenDeck, onNewDeck, onReorderDecks, onOpenGuide }) {
  const totalDue = data.cards.filter(isDue).length;
  const totalCards = data.cards.length;
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.decks.findIndex((d) => d.id === active.id);
    const newIndex = data.decks.findIndex((d) => d.id === over.id);
    onReorderDecks(arrayMove(data.decks, oldIndex, newIndex));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 fade-up">
      <header className="mb-12">
        <div className="logo-unit">
          <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
            <path d="M 26,3 C 29,5 28,10 24,15 C 21,19 17,23 12,27 L 8,29 L 9,25 C 13,23 17,19 21,15 C 24,11 26,7 26,3 Z" fill="var(--terracotta)" />
            <line x1="9" y1="26" x2="24" y2="6" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
            <line x1="11" y1="22" x2="15" y2="24" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
            <line x1="14" y1="18" x2="18" y2="20" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
            <line x1="18" y1="13" x2="22" y2="15" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
            <line x1="21" y1="9" x2="25" y2="11" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
          </svg>
          <span className="logo-wordmark">Lexicon</span>
        </div>
        <h1 className="display text-5xl mb-3" style={{ lineHeight: 1.05 }}>
          {greeting}.
        </h1>
        <p className="text-lg italic" style={{ color: 'var(--ink-soft)' }}>
          {totalDue > 0
            ? `You have ${totalDue} card${totalDue === 1 ? '' : 's'} waiting for you today.`
            : totalCards === 0
              ? 'A blank page. Begin by creating your first deck.'
              : 'Nothing due right now — well done.'}
        </p>
      </header>

      <div className="divider-flourish mb-8">
        <hr />
        <Feather size={14} />
        <hr />
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="display text-2xl">Your decks</h2>
          <button className="btn btn-quiet text-sm flex items-center gap-1.5" onClick={onNewDeck}>
            <Plus size={14} /> New deck
          </button>
        </div>

        <p className="italic text-sm mb-5" style={{ color: 'var(--ink-faint)' }}>
          Your decks live in this browser. They stay private.
        </p>

        {data.decks.length === 0 ? (
          <p className="italic" style={{ color: 'var(--ink-soft)', marginTop: '8px' }}>
            Start by creating a deck for the words you're learning, or{' '}
            <button
              onClick={onOpenGuide}
              style={{
                color: 'var(--terracotta)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                font: 'inherit',
                fontStyle: 'italic',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              read the guide
            </button>.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data.decks.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                {data.decks.map((deck) => {
                  const deckCards = data.cards.filter((c) => c.deckId === deck.id);
                  const due = deckCards.filter(isDue).length;
                  return (
                    <SortableDeckTile
                      key={deck.id}
                      deck={deck}
                      deckCards={deckCards}
                      due={due}
                      onOpenDeck={onOpenDeck}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <footer className="mt-16 text-center">
        <div className="ornament text-xs">· · ·</div>
      </footer>
    </div>
  );
}
