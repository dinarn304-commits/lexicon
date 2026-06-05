import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Download, Upload } from 'lucide-react';
import { serializeLibrary, downloadJson } from '../storage/transfer';
import Wordmark from '../components/Wordmark';

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="display text-2xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsView({ data, onRestore }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | restoring | done
  const [result, setResult] = useState(null); // { deckCount, cardCount, textCount, failures }

  useEffect(() => { document.title = 'Lexicon · Settings'; }, []);

  function createBackup() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(`lexicon-backup-${stamp}.json`, serializeLibrary(data));
  }

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onerror = () => setError("That file couldn't be read. Please try another.");
    reader.onload = async (ev) => {
      let parsed;
      try {
        parsed = JSON.parse(ev.target.result);
      } catch (_) {
        setError("That file couldn't be read as a Lexicon backup.");
        return;
      }
      if (parsed.kind !== 'library') {
        setError("That doesn't look like a Lexicon backup file.");
        return;
      }
      setStatus('restoring');
      try {
        const res = await onRestore(parsed);
        setResult(res);
        setStatus('done');
      } catch (err) {
        setError(err?.message || 'Something went wrong during restore.');
        setStatus('idle');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 fade-up">
      <Link className="btn btn-quiet text-sm flex items-center gap-1 mb-6" to="/vocabulary">
        <ChevronLeft size={16} /> Notebook
      </Link>

      <Wordmark />

      <div className="ornament text-xs mb-3">· SETTINGS ·</div>
      <h1 className="display text-4xl mb-8">Settings</h1>

      <div className="divider-flourish mb-8">
        <hr />
        <span className="text-xs">·</span>
        <hr />
      </div>

      <Section title="Backup & restore">
        <p className="italic mb-6" style={{ color: 'var(--ink-soft)' }}>
          A backup saves your whole library — every deck, card, image and reading text — to a single
          file you can keep safe. Restoring brings a backup's decks back as fresh copies alongside
          everything you already have; nothing existing is ever replaced or removed.
        </p>

        <div className="paper-card" style={{ padding: '20px 24px' }}>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary px-5 py-2.5 flex items-center gap-2" onClick={createBackup}>
              <Download size={16} /> Create backup
            </button>
            <button
              className="btn btn-ghost px-5 py-2.5 flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === 'restoring'}
              style={{ opacity: status === 'restoring' ? 0.5 : 1 }}
            >
              <Upload size={16} /> {status === 'restoring' ? 'Restoring…' : 'Restore from backup'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChosen}
              style={{ display: 'none' }}
            />
          </div>

          {error && (
            <p className="italic text-sm mt-4" style={{ color: 'var(--terracotta)' }}>
              {error}
            </p>
          )}

          {status === 'done' && result && (
            <div className="mt-4">
              <p className="text-sm" style={{ color: 'var(--moss)' }}>
                ✓ Restored {result.deckCount} deck{result.deckCount === 1 ? '' : 's'} and{' '}
                {result.cardCount} card{result.cardCount === 1 ? '' : 's'}
                {result.textCount > 0
                  ? ` and ${result.textCount} reading text${result.textCount === 1 ? '' : 's'}`
                  : ''}.
              </p>
              {result.failures > 0 && (
                <p className="italic text-sm mt-2" style={{ color: 'var(--terracotta)' }}>
                  {result.failures} image{result.failures === 1 ? '' : 's'} couldn't be saved — your
                  device storage may be full. Everything else was restored.
                </p>
              )}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
