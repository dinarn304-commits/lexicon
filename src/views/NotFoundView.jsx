import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Feather } from 'lucide-react';

export default function NotFoundView() {
  useEffect(() => { document.title = 'Lexicon · Not found'; }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center fade-up">
      <div className="ornament text-xs mb-8">· · ·</div>
      <div className="divider-flourish mb-10">
        <hr />
        <Feather size={14} />
        <hr />
      </div>
      <p className="display text-2xl italic mb-10" style={{ color: 'var(--ink-soft)' }}>
        « this page seems to have wandered off »
      </p>
      <Link
        to="/"
        style={{ color: 'var(--terracotta)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
      >
        return home
      </Link>
    </div>
  );
}
