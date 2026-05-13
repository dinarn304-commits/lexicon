import { useState } from 'react';
import { Plus } from 'lucide-react';
import WordCounter from '../components/WordCounter';
import ImportTextModal from '../components/ImportTextModal';

export default function ReadingView({ data, onSaveText }) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 fade-up">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0 }}>
        <WordCounter today={0} total={0} />
      </div>

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

      {importOpen && (
        <ImportTextModal
          onClose={() => setImportOpen(false)}
          onSave={onSaveText}
        />
      )}
    </div>
  );
}
