import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import WordCounter from '../components/WordCounter';
import ReadingControl from '../components/ReadingControl';
import TranslationPanel from '../components/TranslationPanel';
import { makeCard } from '../utils/card';
import { findSentence } from '../utils/sentence';
import { makeId } from '../utils/id';

const MARGIN_OPTIONS = ['narrow', 'normal', 'wide'];
const MARGIN_WIDTHS  = { narrow: '28rem', normal: '36rem', wide: '48rem' };
const SPACING_OPTIONS = [1.1, 1.3, 1.5, 1.7, 1.9];
const TRANSLATION_DEFAULTS = { tr: 'ru', en: 'ru', es: 'ru' };

function countWordsInDoc(doc) {
  const parts = [];
  function walk(node) {
    if (node.type === 'text') parts.push(node.text || '');
    if (node.content) node.content.forEach(walk);
  }
  if (doc.content) doc.content.forEach(walk);
  return parts.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

// Replicated from ReadingPane — callback shapes differ (ReadingPane uses
// onUpdateReadingProgress(id, newTotal) with per-text tracking; SharedTextView
// uses onAddReadingProgress(delta) for global-only counters since the shared
// text is not in data.texts). Extract if a third copy ever appears.
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

function renderInline(nodes) {
  if (!nodes?.length) return null;
  return nodes.map((node, i) => {
    if (node.type === 'text') {
      const text = node.text || '';
      const parts = text.split(/(\s+)/);
      return (
        <Fragment key={i}>
          {parts.map((part, j) => {
            if (!part) return null;
            if (/^\s+$/.test(part)) return part;
            let inner = <>{part}</>;
            for (const mark of node.marks || []) {
              if (mark.type === 'bold')           inner = <strong>{inner}</strong>;
              else if (mark.type === 'italic')    inner = <em>{inner}</em>;
              else if (mark.type === 'code')      inner = <code>{inner}</code>;
              else if (mark.type === 'strike')    inner = <s>{inner}</s>;
              else if (mark.type === 'underline') inner = <u>{inner}</u>;
            }
            return <span key={j} className="reading-word">{inner}</span>;
          })}
        </Fragment>
      );
    }
    if (node.type === 'hardBreak') return <br key={i} />;
    return null;
  });
}

export default function SharedTextView({
  data,
  onSaveCard,
  onSaveText,
  onAddReadingProgress,
  onUpdateReadingPreferences,
  onUpdateTranslationLanguage,
}) {
  const { slugAndToken } = useParams();

  const token = useMemo(() => {
    const idx = slugAndToken.lastIndexOf('-');
    return idx >= 0 ? slugAndToken.slice(idx + 1) : slugAndToken;
  }, [slugAndToken]);

  const [fetchState, setFetchState] = useState('loading');
  const [shareData, setShareData] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    document.title = 'Lexicon · Loading…';
    fetch(`/api/share?token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (r.status === 404) return Promise.reject('not_found');
        if (!r.ok) return Promise.reject('error');
        return r.json();
      })
      .then((json) => {
        setShareData(json);
        setFetchState('found');
        document.title = `Lexicon · ${json.title}`;
      })
      .catch((reason) => {
        setFetchState(reason === 'not_found' ? 'not_found' : 'error');
        document.title = 'Lexicon · Not found';
      });
  }, [token]);

  const prefs = data.readingPreferences || { textSize: 18, marginWidth: 'normal', lineSpacing: 1.5 };
  const marginIdx  = MARGIN_OPTIONS.indexOf(prefs.marginWidth);
  const spacingIdx = SPACING_OPTIONS.indexOf(prefs.lineSpacing);

  function decTextSize()  { onUpdateReadingPreferences({ ...prefs, textSize: prefs.textSize - 1 }); }
  function incTextSize()  { onUpdateReadingPreferences({ ...prefs, textSize: prefs.textSize + 1 }); }
  function decMargin()    { onUpdateReadingPreferences({ ...prefs, marginWidth: MARGIN_OPTIONS[marginIdx - 1] }); }
  function incMargin()    { onUpdateReadingPreferences({ ...prefs, marginWidth: MARGIN_OPTIONS[marginIdx + 1] }); }
  function decSpacing()   { onUpdateReadingPreferences({ ...prefs, lineSpacing: SPACING_OPTIONS[spacingIdx - 1] }); }
  function incSpacing()   { onUpdateReadingPreferences({ ...prefs, lineSpacing: SPACING_OPTIONS[spacingIdx + 1] }); }

  // ── Scroll-based word counter ──────────────────────────────────────────────
  const paragraphRefs = useRef([]);
  const wordsReadRef  = useRef(0);
  const onAddProgressRef = useRef(onAddReadingProgress);
  useEffect(() => { onAddProgressRef.current = onAddReadingProgress; });

  const blocks = useMemo(
    () => shareData?.content?.content || [],
    [shareData]
  );

  const cumulativeWords = useMemo(() => {
    let total = 0;
    return blocks.map((b) => { total += countBlockWords(b); return total; });
  }, [blocks]);

  useEffect(() => {
    if (!shareData) return;
    const totalWords = countWordsInDoc(shareData.content);
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
        const wordsRead = Math.min(cumulativeWords[maxReadIndex] || 0, totalWords);
        if (wordsRead > wordsReadRef.current) {
          const delta = wordsRead - wordsReadRef.current;
          wordsReadRef.current = wordsRead;
          onAddProgressRef.current?.(delta);
        }
      }, 100);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shareData, cumulativeWords]);

  // ── Translation panel state ────────────────────────────────────────────────
  // (if a third copy ever appears, factor into a shared hook)
  const [translationQuery, setTranslationQuery]   = useState(null);
  const [translationExample, setTranslationExample] = useState('');
  const [translationResult, setTranslationResult] = useState({ translations: [], examples: [], loading: false });
  const [deeplQuery, setDeeplQuery]   = useState(null);
  const [deeplResult, setDeeplResult] = useState({ sentence: null, translation: null, loading: false, error: null });
  const [dictionaryQuery, setDictionaryQuery]   = useState(null);
  const [dictionaryResult, setDictionaryResult] = useState({ word: null, phonetic: null, audio: null, meanings: [], loading: false, error: null });
  const [defineQuery, setDefineQuery] = useState(null);
  const [defineResult, setDefineResult] = useState({ base: null, isInflected: false, meaningBase: null, noteTarget: null, noteSource: null, loading: false, error: null });

  const sourceLang = shareData?.sourceLanguage || 'tr';
  const translationLang = data.translationLanguagesBySource?.[sourceLang] ?? TRANSLATION_DEFAULTS[sourceLang] ?? 'ru';
  const bodyRef = useRef(null);
  const handledByTouchRef = useRef(false);
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (!translationQuery) return;
    if (translationQuery.trim().split(/\s+/).filter(Boolean).length > 2) return;
    setTranslationResult({ translations: [], examples: [], loading: true });
    fetch(`/api/glosbe?word=${encodeURIComponent(translationQuery)}&lang=${translationLang}&sourceLang=${sourceLang}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json) => {
        const translations = json.translations || [];
        const examples = json.examples || [];
        setTranslationResult({ translations, examples, loading: false });
      })
      .catch(() => setTranslationResult({ translations: [], examples: [], loading: false }));
  }, [translationQuery, translationLang]);

  useEffect(() => {
    if (!deeplQuery) return;
    const DEEPL_CODES = { tr: 'TR', en: 'EN', es: 'ES', fr: 'FR', ru: 'RU', de: 'DE', ar: 'AR', zh: 'ZH' };
    const targetLang = DEEPL_CODES[translationLang] || 'EN';
    setDeeplResult({ sentence: deeplQuery, translation: null, loading: true, error: null });
    fetch('/api/deepl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: deeplQuery, targetLang }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setDeeplResult({ sentence: deeplQuery, translation: null, loading: false, error: json.error });
        } else {
          setDeeplResult({ sentence: deeplQuery, translation: json.translation, loading: false, error: null });
        }
      })
      .catch(() => setDeeplResult({ sentence: deeplQuery, translation: null, loading: false, error: 'deepl_unavailable' }));
  }, [deeplQuery, translationLang]);

  useEffect(() => {
    if (!dictionaryQuery) return;
    setDictionaryResult({ word: null, phonetic: null, audio: null, meanings: [], loading: true, error: null });
    fetch(`/api/dictionary?word=${encodeURIComponent(dictionaryQuery)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setDictionaryResult({ word: null, phonetic: null, audio: null, meanings: [], loading: false, error: json.error });
        } else {
          setDictionaryResult({ ...json, loading: false, error: null });
        }
      })
      .catch(() => setDictionaryResult({ word: null, phonetic: null, audio: null, meanings: [], loading: false, error: 'dictionary_unavailable' }));
  }, [dictionaryQuery]);

  useEffect(() => {
    if (!defineQuery) return;
    setDefineResult({ base: null, isInflected: false, meaningBase: null, noteTarget: null, noteSource: null, loading: true, error: null });
    fetch('/api/define', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: defineQuery.word, sentence: defineQuery.sentence, sourceLang, targetLang: translationLang }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setDefineResult({ base: null, isInflected: false, meaningBase: null, noteTarget: null, noteSource: null, loading: false, error: json.error });
        } else {
          setDefineResult({ ...json, loading: false, error: null });
        }
      })
      .catch(() => setDefineResult({ base: null, isInflected: false, meaningBase: null, noteTarget: null, noteSource: null, loading: false, error: 'define_failed' }));
  }, [defineQuery, translationLang]);

  function handleQueryFound(query, paraText) {
    const wordCount = query.split(/\s+/).filter(Boolean).length;
    const contextSentence = findSentence(paraText, query);

    setTranslationQuery(query);
    setTranslationExample(contextSentence);
    setTranslationResult({ translations: [], examples: [], loading: false });
    setDeeplResult({ sentence: null, translation: null, loading: false, error: null });
    setDictionaryResult({ word: null, phonetic: null, audio: null, meanings: [], loading: false, error: null });
    setDictionaryQuery(sourceLang === 'en' ? query : null);
    setDefineResult({ base: null, isInflected: false, meaningBase: null, noteTarget: null, noteSource: null, loading: false, error: null });

    if (wordCount <= 2) {
      setDeeplQuery(null);
      setDefineQuery({ word: query, sentence: contextSentence });
    } else {
      setDeeplQuery(query);
      setDefineQuery(null);
    }
  }

  function handleMouseUp(e) {
    if (handledByTouchRef.current) {
      handledByTouchRef.current = false;
      return;
    }

    const sel = window.getSelection();
    let query = '';
    let paraText = '';

    if (sel && !sel.isCollapsed) {
      const selected = sel.toString().trim();
      if (selected && bodyRef.current?.contains(sel.anchorNode)) {
        query = selected;
        const paraEl = sel.anchorNode?.parentElement?.closest('[data-paragraph-index]');
        paraText = paraEl?.textContent?.trim() || '';
      }
    } else {
      const wordEl = e.target.closest('.reading-word');
      if (wordEl && bodyRef.current?.contains(wordEl)) {
        query = (wordEl.textContent || '').replace(/[,.!?;:'")\]…]+$/, '').trim();
        const paraEl = wordEl.closest('[data-paragraph-index]');
        paraText = paraEl?.textContent?.trim()
          || wordEl.closest('h1')?.textContent?.trim()
          || '';
      }
    }

    if (query) handleQueryFound(query, paraText);
  }

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e) {
    const sel = window.getSelection();

    if (sel && !sel.isCollapsed) {
      const selected = sel.toString().trim();
      if (selected && bodyRef.current?.contains(sel.anchorNode)) {
        const paraEl = sel.anchorNode?.parentElement?.closest('[data-paragraph-index]');
        const paraText = paraEl?.textContent?.trim() || '';
        sel.removeAllRanges();
        handledByTouchRef.current = true;
        handleQueryFound(selected, paraText);
      }
      return;
    }

    const touch = e.changedTouches[0];
    const start = touchStartRef.current;
    if (start && (Math.abs(touch.clientY - start.y) > 12 || Math.abs(touch.clientX - start.x) > 12)) return;

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const wordEl = el?.closest('.reading-word');
    if (wordEl && bodyRef.current?.contains(wordEl)) {
      const query = (wordEl.textContent || '').replace(/[,.!?;:'")\]…]+$/, '').trim();
      const paraEl = wordEl.closest('[data-paragraph-index]');
      const paraText = paraEl?.textContent?.trim()
        || wordEl.closest('h1')?.textContent?.trim()
        || '';
      if (query) {
        handledByTouchRef.current = true;
        handleQueryFound(query, paraText);
      }
    }
  }

  const images = shareData?.images || {};

  // Assign paragraph refs for scroll-based word counting
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
        return <hr key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-rule" />;

      case 'image': {
        let src = node.attrs?.src || '';
        if (src.startsWith('text-image://')) {
          const imageId = src.slice('text-image://'.length);
          src = images[imageId] || src;
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

  function handleSave() {
    if (!shareData || saved) return;

    const doc = JSON.parse(JSON.stringify(shareData.content));
    const idMap = {};
    function rewriteImages(node) {
      if (node.type === 'image' && node.attrs?.src?.startsWith('text-image://')) {
        const oldId = node.attrs.src.slice('text-image://'.length);
        if (!idMap[oldId]) {
          const newId = makeId();
          idMap[oldId] = newId;
          const base64 = shareData.images[oldId];
          if (base64) localStorage.setItem(`srs-text-image-${newId}`, base64);
        }
        node.attrs.src = `text-image://${idMap[oldId]}`;
      }
      if (node.content) node.content.forEach(rewriteImages);
    }
    rewriteImages(doc);

    const now = new Date().toISOString();
    onSaveText({
      id: makeId(),
      title: shareData.title,
      content: doc,
      wordCount: countWordsInDoc(doc),
      wordsReadInThisText: 0,
      sourceLanguage: shareData.sourceLanguage,
      createdAt: now,
      updatedAt: now,
    });

    setSaved(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }

  const panelOpen = translationQuery !== null;

  if (fetchState === 'loading') {
    return (
      <div className="shared-view-loading fade-up">
        <div className="guide-divider" aria-hidden="true">· · ·</div>
        <p className="shared-view-loading-text">« retrieving… »</p>
      </div>
    );
  }

  if (fetchState === 'not_found' || fetchState === 'error') {
    return (
      <div className="shared-view-error fade-up">
        <div className="guide-divider" aria-hidden="true">· · ·</div>
        <p className="shared-view-error-text">
          « this shared text no longer exists, or the link was mistyped »
        </p>
        <Link className="shared-view-home-link" to="/">return to Lexicon</Link>
      </div>
    );
  }

  return (
    <div className="reading-pane fade-up">
      <div className="reading-pane-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link className="guide-back-btn" to="/reading">← Back to library</Link>
          <button
            className={`shared-view-save-btn${saved ? ' saved' : ''}`}
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? 'saved ✓' : 'save this text to my library'}
          </button>
        </div>
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

      <div
        ref={bodyRef}
        className="reading-pane-body"
        style={{
          maxWidth: panelOpen
            ? `min(${MARGIN_WIDTHS[prefs.marginWidth]}, calc(100vw - 26rem))`
            : MARGIN_WIDTHS[prefs.marginWidth],
        }}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <h1 className="reading-pane-title">
          {shareData.title.split(/(\s+)/).map((part, i) =>
            !part ? null : /^\s+$/.test(part) ? part : (
              <span key={i} className="reading-word">{part}</span>
            )
          )}
        </h1>
        <div
          className="reading-pane-text"
          style={{ '--reading-font-size': `${prefs.textSize}px`, '--reading-line-height': prefs.lineSpacing }}
        >
          {blocks.map((block, i) => renderBlock(block, i))}
        </div>

        <div className="shared-view-save-section">
          <button
            className={`shared-view-save-btn${saved ? ' saved' : ''}`}
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? 'saved ✓' : 'save this text to my library'}
          </button>
        </div>
      </div>

      {showToast && <div className="save-toast">saved to your library</div>}

      {panelOpen && (
        <TranslationPanel
          word={translationQuery}
          lang={translationLang}
          sourceLang={sourceLang}
          translations={translationResult.translations}
          examples={translationResult.examples}
          loading={translationResult.loading}
          exampleSentence={translationExample}
          deepl={deeplResult}
          onDeeplRequest={() => setDeeplQuery(translationExample || translationQuery)}
          onClose={() => setTranslationQuery(null)}
          onLangChange={(targetLang) => onUpdateTranslationLanguage(sourceLang, targetLang)}
          dictionary={dictionaryResult}
          define={defineResult}
          onAddCard={(front, back, example) => {
            const deckId = data.discoveredWordsDecks?.[sourceLang] ?? 'deck-discovered-words';
            const card = makeCard(deckId, front, back, example);
            onSaveCard(card);
          }}
        />
      )}
    </div>
  );
}
