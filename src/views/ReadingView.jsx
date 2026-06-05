import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
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
import WordCounter from '../components/WordCounter';
import ImportTextModal from '../components/ImportTextModal';
import Wordmark from '../components/Wordmark';
import TextCard from '../components/TextCard';

function SortableTextCard({ text, onOpen, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: text.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <TextCard
      text={text}
      onOpen={onOpen}
      onDelete={onDelete}
      sortableRef={setNodeRef}
      sortableStyle={style}
      sortableAttributes={attributes}
      sortableListeners={listeners}
    />
  );
}

export default function ReadingView({
  data,
  onSaveText,
  onDeleteText,
  onReorderTexts,
  onUpdateReadingProgress,
  onUpdateReadingPreferences,
  onSaveCard,
  onUpdateTranslationLanguage,
}) {
  const navigate = useNavigate();
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => { document.title = 'Lexicon · Reading'; }, []);

  const texts = [...(data.texts || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  // The import modal's default language follows the most recently created text,
  // independent of the (now user-controlled) display order.
  const defaultLang = useMemo(() => {
    const all = data.texts || [];
    if (!all.length) return 'tr';
    const mostRecent = all.reduce((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt) > 0 ? b : a
    );
    return mostRecent.sourceLanguage || 'tr';
  }, [data.texts]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = texts.findIndex((t) => t.id === active.id);
    const newIndex = texts.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(texts, oldIndex, newIndex).map((t, i) => ({ ...t, order: i }));
    onReorderTexts(reordered);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 fade-up">
      <Wordmark />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0 }}>
        <WordCounter today={data.wordsReadToday || 0} total={data.wordsReadTotal || 0} />
      </div>

      {texts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh', gap: '1.5rem' }}>
          <p style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '18px',
            color: 'var(--ink-soft)',
            lineHeight: 1.7,
            textAlign: 'center',
            maxWidth: '26rem',
            margin: 0,
          }}>
            Your library is empty for now — save your first text and it will appear here.
          </p>
          <button
            className="btn btn-quiet"
            style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setImportOpen(true)}
          >
            <Plus size={14} /> New text
          </button>
        </div>
      ) : (
        <div className="text-library">
          <div className="text-library-header">
            <button
              className="btn btn-quiet text-sm flex items-center gap-1.5"
              onClick={() => setImportOpen(true)}
            >
              <Plus size={14} /> New text
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={texts.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="text-library-list">
                {texts.map((text) => (
                  <SortableTextCard
                    key={text.id}
                    text={text}
                    onOpen={(textId) => {
                      const t = data.texts.find((x) => x.id === textId);
                      if (t?.slug) navigate(`/reading/${t.slug}`);
                    }}
                    onDelete={onDeleteText}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {importOpen && (
        <ImportTextModal
          onClose={() => setImportOpen(false)}
          onSave={onSaveText}
          defaultLang={defaultLang}
        />
      )}
    </div>
  );
}
