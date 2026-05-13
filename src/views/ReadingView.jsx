import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { Plus } from 'lucide-react';
import WordCounter from '../components/WordCounter';
import ImportTextModal from '../components/ImportTextModal';
import TextCard from '../components/TextCard';
import ReadingControl from '../components/ReadingControl';

const MARGIN_OPTIONS = ['narrow', 'normal', 'wide'];
const MARGIN_WIDTHS  = { narrow: '28rem', normal: '36rem', wide: '48rem' };
const SPACING_OPTIONS = [1.1, 1.3, 1.5, 1.7, 1.9];

// ── TipTap JSON rendering helpers ─────────────────────────────────────────────

const textImageKey = (id) => `srs-text-image-${id}`;

function renderInline(nodes) {
  if (!nodes?.length) return null;
  return nodes.map((node, i) => {
    if (node.type === 'text') {
      const text = node.text || '';
      if (!node.marks?.length) return <Fragment key={i}>{text}</Fragment>;
      let el = <>{text}</>;
      for (const mark of node.marks) {
        if (mark.type === 'bold')      el = <strong>{el}</strong>;
        else if (mark.type === 'italic')    el = <em>{el}</em>;
        else if (mark.type === 'code')      el = <code>{el}</code>;
        else if (mark.type === 'strike')    el = <s>{el}</s>;
        else if (mark.type === 'underline') el = <u>{el}</u>;
      }
      return <Fragment key={i}>{el}</Fragment>;
    }
    if (node.type === 'hardBreak') return <br key={i} />;
    return null;
  });
}

function countBlockWords(node) {
  const parts = [];
  function walk(n) {
    if (n.type === 'text') parts.push(n.text || '');
    if (n.content) n.content.forEach(walk);
  }
  walk(node);
  const joined = parts.join(' ').trim();
  return joined ? joined.split(/\s+/).filter(Boolean).length : 0;
}

// ── Individual reading pane ───────────────────────────────────────────────────

function ReadingPane({ text, data, onBack, onUpdateReadingProgress, readingPreferences, onUpdateReadingPreferences }) {
  const prefs = readingPreferences || { textSize: 18, marginWidth: 'normal', lineSpacing: 1.5 };

  const marginIdx  = MARGIN_OPTIONS.indexOf(prefs.marginWidth);
  const spacingIdx = SPACING_OPTIONS.indexOf(prefs.lineSpacing);

  function decTextSize()  { onUpdateReadingPreferences({ ...prefs, textSize: prefs.textSize - 1 }); }
  function incTextSize()  { onUpdateReadingPreferences({ ...prefs, textSize: prefs.textSize + 1 }); }
  function decMargin()    { onUpdateReadingPreferences({ ...prefs, marginWidth: MARGIN_OPTIONS[marginIdx - 1] }); }
  function incMargin()    { onUpdateReadingPreferences({ ...prefs, marginWidth: MARGIN_OPTIONS[marginIdx + 1] }); }
  function decSpacing()   { onUpdateReadingPreferences({ ...prefs, lineSpacing: SPACING_OPTIONS[spacingIdx - 1] }); }
  function incSpacing()   { onUpdateReadingPreferences({ ...prefs, lineSpacing: SPACING_OPTIONS[spacingIdx + 1] }); }

  const paragraphRefs = useRef([]);

  const blocks = useMemo(
    () => text.content?.content || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text.id]
  );

  const cumulativeWords = useMemo(() => {
    let total = 0;
    return blocks.map((b) => { total += countBlockWords(b); return total; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text.id]);

  // Stable ref to current progress — avoids re-creating the scroll listener
  const wordsReadRef = useRef(text.wordsReadInThisText);
  useEffect(() => { wordsReadRef.current = text.wordsReadInThisText; });

  // Stable ref to the callback — avoids stale closure in the effect
  const onUpdateRef = useRef(onUpdateReadingProgress);
  useEffect(() => { onUpdateRef.current = onUpdateReadingProgress; });

  useEffect(() => {
    let ticking = false;
    function handleScroll() {
      if (ticking) return;
      ticking = true;
      setTimeout(() => {
        ticking = false;
        const midpoint = window.innerHeight / 2;
        let maxReadIndex = -1;
        const refs = paragraphRefs.current;
        for (let i = 0; i < refs.length; i++) {
          const el = refs[i];
          if (!el) continue;
          if (el.getBoundingClientRect().top < midpoint) {
            maxReadIndex = i;
          } else {
            break;
          }
        }
        if (maxReadIndex < 0) return;
        const wordsRead = Math.min(cumulativeWords[maxReadIndex] || 0, text.wordCount);
        if (wordsRead > wordsReadRef.current) {
          wordsReadRef.current = wordsRead;
          onUpdateRef.current(text.id, wordsRead);
        }
      }, 100);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text.id]);

  // Reset the refs array on each render; ref callbacks below repopulate it.
  paragraphRefs.current = [];

  function blockRef(index) {
    return (el) => { if (el) paragraphRefs.current[index] = el; };
  }

  function renderBlock(node, index) {
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-para">
            {renderInline(node.content)}
          </p>
        );

      case 'heading': {
        const level = node.attrs?.level || 2;
        const Tag = `h${Math.min(level + 1, 6)}`;
        return (
          <Tag key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-heading">
            {renderInline(node.content)}
          </Tag>
        );
      }

      case 'bulletList':
        return (
          <ul key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-list">
            {(node.content || []).map((item, i) => (
              <li key={i}>
                {(item.content || []).map((p, j) => (
                  <Fragment key={j}>{renderInline(p.content)}</Fragment>
                ))}
              </li>
            ))}
          </ul>
        );

      case 'orderedList':
        return (
          <ol key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-list">
            {(node.content || []).map((item, i) => (
              <li key={i}>
                {(item.content || []).map((p, j) => (
                  <Fragment key={j}>{renderInline(p.content)}</Fragment>
                ))}
              </li>
            ))}
          </ol>
        );

      case 'blockquote':
        return (
          <blockquote key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-blockquote">
            {(node.content || []).map((p, i) => (
              <p key={i} className="reading-para" style={{ margin: 0 }}>{renderInline(p.content)}</p>
            ))}
          </blockquote>
        );

      case 'codeBlock': {
        const codeText = (node.content || []).map((n) => n.text || '').join('');
        return (
          <pre key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-code">
            <code>{codeText}</code>
          </pre>
        );
      }

      case 'horizontalRule':
        return (
          <hr key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-rule" />
        );

      case 'image': {
        let src = node.attrs?.src || '';
        if (src.startsWith('text-image://')) {
          const imageId = src.slice('text-image://'.length);
          src = localStorage.getItem(textImageKey(imageId)) || src;
        }
        return (
          <div key={index} ref={blockRef(index)} data-paragraph-index={index}>
            <img src={src} alt="" className="reading-image" />
          </div>
        );
      }

      default:
        if (node.content) {
          return (
            <p key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-para">
              {renderInline(node.content)}
            </p>
          );
        }
        return null;
    }
  }

  return (
    <div className="reading-pane fade-up">
      <div className="reading-pane-header">
        <button className="guide-back-btn" onClick={onBack}>← Back to library</button>
        <div className="reading-pane-header-right">
          <div className="reading-controls-row">
            <ReadingControl
              value={`${prefs.textSize}px`}
              onDecrement={decTextSize}
              onIncrement={incTextSize}
              atMin={prefs.textSize <= 15}
              atMax={prefs.textSize >= 22}
            />
            <ReadingControl
              value={prefs.marginWidth}
              onDecrement={decMargin}
              onIncrement={incMargin}
              atMin={marginIdx <= 0}
              atMax={marginIdx >= MARGIN_OPTIONS.length - 1}
            />
            <ReadingControl
              value={prefs.lineSpacing}
              onDecrement={decSpacing}
              onIncrement={incSpacing}
              atMin={spacingIdx <= 0}
              atMax={spacingIdx >= SPACING_OPTIONS.length - 1}
            />
          </div>
          <WordCounter today={data.wordsReadToday || 0} total={data.wordsReadTotal || 0} />
        </div>
      </div>
      <div className="reading-pane-body" style={{ maxWidth: MARGIN_WIDTHS[prefs.marginWidth] }}>
        <h1 className="reading-pane-title">{text.title}</h1>
        <div
          className="reading-pane-text"
          style={{ '--reading-font-size': `${prefs.textSize}px`, '--reading-line-height': prefs.lineSpacing }}
        >
          {blocks.map((block, i) => renderBlock(block, i))}
        </div>
      </div>
    </div>
  );
}

// ── Library view ──────────────────────────────────────────────────────────────

export default function ReadingView({ data, onSaveText, onDeleteText, onUpdateReadingProgress, onUpdateReadingPreferences }) {
  const [importOpen, setImportOpen] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState(null);

  const texts = [...(data.texts || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const selectedText = selectedTextId
    ? data.texts.find((t) => t.id === selectedTextId)
    : null;

  if (selectedText) {
    return (
      <ReadingPane
        text={selectedText}
        data={data}
        onBack={() => setSelectedTextId(null)}
        onUpdateReadingProgress={onUpdateReadingProgress}
        readingPreferences={data.readingPreferences}
        onUpdateReadingPreferences={onUpdateReadingPreferences}
      />
    );
  }

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
                onOpen={setSelectedTextId}
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
        />
      )}
    </div>
  );
}
