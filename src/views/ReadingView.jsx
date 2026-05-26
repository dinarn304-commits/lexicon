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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh' }}>
          <p className="text-lg italic" style={{ color: 'var(--ink-soft)', textAlign: 'center' }}>
            A blank page. Begin by importing your first text.
          </p>
          <button
            className="btn btn-quiet text-sm flex items-center gap-1.5"
            style={{ marginTop: '1rem' }}
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
