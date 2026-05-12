import { Plus } from 'lucide-react';
import WordCounter from '../components/WordCounter';

export default function ReadingView() {
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
          onClick={() => console.log('New text clicked')}
        >
          <Plus size={14} /> New text
        </button>
      </div>
    </div>
  );
}
