import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
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

  // Translation panel state — replicated from ReadingPane
  // (if a third copy ever appears, factor into a shared hook)
  const [translationQuery, setTranslationQuery]   = useState(null);
  const [translationExample, setTranslationExample] = useState('');
  const [translationResult, setTranslationResult] = useState({ translations: [], examples: [], loading: false });
  const [deeplQuery, setDeeplQuery]   = useState(null);
  const [deeplResult, setDeeplResult] = useState({ sentence: null, translation: null, loading: false, error: null });
  const deeplSentenceRef  = useRef('');
  const isMultiWordRef    = useRef(false);
  const [dictionaryQuery, setDictionaryQuery]   = useState(null);
  const [dictionaryResult, setDictionaryResult] = useState({ word: null, phonetic: null, audio: null, meanings: [], loading: false, error: null });

  const sourceLang = shareData?.sourceLanguage || 'tr';
  const translationLang = data.translationLanguagesBySource?.[sourceLang] ?? TRANSLATION_DEFAULTS[sourceLang] ?? 'ru';
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!translationQuery) return;
    setTranslationResult({ translations: [], examples: [], loading: true });
    fetch(`/api/glosbe?word=${encodeURIComponent(translationQuery)}&lang=${translationLang}&sourceLang=${sourceLang}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json) => {
        const translations = json.translations || [];
        const examples = json.examples || [];
        setTranslationResult({ translations, examples, loading: false });
        if (!isMultiWordRef.current && translations.length === 0) {
          setDeeplQuery(deeplSentenceRef.current || translationQuery);
        }
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

  function handleMouseUp(e) {
    if (window.innerWidth <= 900) return;
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
        paraText = paraEl?.textContent?.trim() || wordEl.closest('h1')?.textContent?.trim() || '';
      }
    }
    if (query) {
      const multi = query.split(/\s+/).filter(Boolean).length > 1;
      isMultiWordRef.current = multi;
      deeplSentenceRef.current = multi ? query : findSentence(paraText, query);
      setTranslationQuery(query);
      setTranslationExample(findSentence(paraText, query));
      setDeeplResult({ sentence: null, translation: null, loading: false, error: null });
      if (multi) {
        setDeeplQuery(query);
      } else {
        setDeeplQuery(null);
      }
      setDictionaryResult({ word: null, phonetic: null, audio: null, meanings: [], loading: false, error: null });
      if (sourceLang === 'en' && !multi) {
        setDictionaryQuery(query);
      } else {
        setDictionaryQuery(null);
      }
    }
  }

  function handleTranslateSentence() {
    setDeeplQuery(deeplSentenceRef.current || translationQuery);
  }

  const images = shareData?.images || {};

  function renderBlock(node, index) {
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} data-paragraph-index={index} className="reading-para">
            {renderInline(node.content)}
          </p>
        );

      case 'heading': {
        const level = node.attrs?.level || 2;
        const Tag = `h${Math.min(level + 1, 6)}`;
        return (
          <Tag key={index} data-paragraph-index={index} className="reading-heading">
            {renderInline(node.content)}
          </Tag>
        );
      }

      case 'bulletList':
        return (
          <ul key={index} data-paragraph-index={index} className="reading-list">
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
          <ol key={index} data-paragraph-index={index} className="reading-list">
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
          <blockquote key={index} data-paragraph-index={index} className="reading-blockquote">
            {(node.content || []).map((p, i) => (
              <p key={i} className="reading-para" style={{ margin: 0 }}>{renderInline(p.content)}</p>
            ))}
          </blockquote>
        );

      case 'codeBlock': {
        const codeText = (node.content || []).map((n) => n.text || '').join('');
        return (
          <pre key={index} data-paragraph-index={index} className="reading-code">
            <code>{codeText}</code>
          </pre>
        );
      }

      case 'horizontalRule':
        return <hr key={index} data-paragraph-index={index} className="reading-rule" />;

      case 'image': {
        let src = node.attrs?.src || '';
        if (src.startsWith('text-image://')) {
          const imageId = src.slice('text-image://'.length);
          src = images[imageId] || src;
        }
        return (
          <div key={index} data-paragraph-index={index}>
            <img src={src} alt="" className="reading-image" />
          </div>
        );
      }

      default:
        if (node.content) {
          return (
            <p key={index} data-paragraph-index={index} className="reading-para">
              {renderInline(node.content)}
            </p>
          );
        }
        return null;
    }
  }

  function handleSave() {
    if (!shareData) return;

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
  const blocks = shareData?.content?.content || [];

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
      <div className="reading-pane-header" style={{ justifyContent: 'flex-end' }}>
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
          onTranslateSentence={handleTranslateSentence}
          onClose={() => setTranslationQuery(null)}
          onLangChange={(targetLang) => onUpdateTranslationLanguage(sourceLang, targetLang)}
          dictionary={dictionaryResult}
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
