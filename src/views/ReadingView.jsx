import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import WordCounter from '../components/WordCounter';
import ImportTextModal from '../components/ImportTextModal';
import TextCard from '../components/TextCard';

export default function ReadingView({
  data,
  onSaveText,
  onDeleteText,
  onUpdateReadingProgress,
  onUpdateReadingPreferences,
  onSaveCard,
  onUpdateTranslationLanguage,
}) {
  const navigate = useNavigate();
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => { document.title = 'Lexicon · Reading'; }, []);

  const texts = [...(data.texts || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const defaultLang = useMemo(() => {
    if (!texts.length) return 'tr';
    return texts[0].sourceLanguage || 'tr';
  }, [texts]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 fade-up">
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
          <div className="text-library-list">
            {texts.map((text) => (
              <TextCard
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
