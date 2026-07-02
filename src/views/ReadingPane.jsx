import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import WordCounter from '../components/WordCounter';
import ReadingControl from '../components/ReadingControl';
import TranslationPanel from '../components/TranslationPanel';
import ShareModal from '../components/ShareModal';
import { makeCard } from '../utils/card';
import { findSentence } from '../utils/sentence';
import { translateSentence, isRTL } from '../utils/language';
import { segmentParagraph, countWords } from '../utils/tokenize';
import NotFoundView from './NotFoundView';

const MARGIN_OPTIONS = ['narrow', 'normal', 'wide'];
const MARGIN_WIDTHS  = { narrow: '28rem', normal: '36rem', wide: '48rem' };
// On mobile the absolute rem widths all exceed the phone content lane, so we
// map the preference to side-padding on the body instead.
const MOBILE_BODY_PADDING = { narrow: '0 24px', normal: '0 8px', wide: '0' };
const SPACING_OPTIONS = [1.1, 1.3, 1.5, 1.7, 1.9];

const textImageKey = (id) => `srs-text-image-${id}`;

function renderInline(nodes, sourceLang) {
  if (!nodes?.length) return null;
  return nodes.map((node, i) => {
    if (node.type === 'text') {
      const tokens = segmentParagraph(node.text || '', sourceLang);
      return (
        <Fragment key={i}>
          {tokens.map((tok, j) => {
            if (!tok.text) return null;
            if (!tok.isWord) return tok.text;
            let inner = <>{tok.text}</>;
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

function countBlockWords(node, sourceLang) {
  const parts = [];
  function walk(n) {
    if (n.type === 'text') parts.push(n.text || '');
    if (n.content) n.content.forEach(walk);
  }
  walk(node);
  return countWords(parts.join(' ').trim(), sourceLang);
}

export default function ReadingPane({
  data,
  onUpdateReadingProgress,
  onUpdateReadingPreferences,
  onSaveCard,
  onUpdateTranslationLanguage,
}) {
  const { textSlug } = useParams();
  const text = data.texts?.find((t) => t.slug === textSlug);
  const sourceLang = text?.sourceLanguage || 'tr';
  const prefs = data.readingPreferences || { textSize: 18, marginWidth: 'normal', lineSpacing: 1.5 };

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.title = text ? `Lexicon · ${text.title}` : 'Lexicon';
  }, [text?.title]);

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
    () => text?.content?.content || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text?.id]
  );

  const cumulativeWords = useMemo(() => {
    let total = 0;
    return blocks.map((b) => { total += countBlockWords(b, sourceLang); return total; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text?.id]);

  const wordsReadRef = useRef(text?.wordsReadInThisText ?? 0);
  useEffect(() => { wordsReadRef.current = text?.wordsReadInThisText ?? 0; });

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
        const wordsRead = Math.min(cumulativeWords[maxReadIndex] || 0, text?.wordCount ?? 0);
        if (wordsRead > wordsReadRef.current) {
          wordsReadRef.current = wordsRead;
          onUpdateRef.current(text?.id, wordsRead);
        }
      }, 100);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text?.id]);

  paragraphRefs.current = [];
  function blockRef(index) {
    return (el) => { if (el) paragraphRefs.current[index] = el; };
  }

  const [shareState, setShareState] = useState(null); // null | 'loading' | 'done' | 'error'
  const [shareUrl, setShareUrl]     = useState(null);

  async function handleShare() {
    const images = {};
    function walkForImages(node) {
      if (node.type === 'image' && node.attrs?.src?.startsWith('text-image://')) {
        const id = node.attrs.src.slice('text-image://'.length);
        const data = localStorage.getItem(textImageKey(id));
        if (data) images[id] = data;
      }
      if (node.content) node.content.forEach(walkForImages);
    }
    if (text.content) walkForImages(text.content);

    setShareState('loading');
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: text.title,
          content: text.content,
          images,
          sourceLanguage: text.sourceLanguage,
          slug: text.slug || text.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setShareState('error');
      } else {
        setShareUrl(json.url);
        setShareState('done');
      }
    } catch {
      setShareState('error');
    }
  }

  const [translationQuery, setTranslationQuery]   = useState(null);
  const [translationExample, setTranslationExample] = useState('');
  const [translationResult, setTranslationResult] = useState({ translations: [], examples: [], loading: false });

  const [deeplQuery, setDeeplQuery]   = useState(null);
  const [deeplResult, setDeeplResult] = useState({ sentence: null, translation: null, loading: false, error: null });

  const [dictionaryQuery, setDictionaryQuery]   = useState(null);
  const [dictionaryResult, setDictionaryResult] = useState({ word: null, phonetic: null, audio: null, meanings: [], loading: false, error: null });

  const [defineQuery, setDefineQuery] = useState(null);
  const [defineResult, setDefineResult] = useState({ base: null, isInflected: false, meaningBase: null, noteTarget: null, noteSource: null, loading: false, error: null });

  const TRANSLATION_DEFAULTS = { tr: 'ru', en: 'ru', es: 'ru', fr: 'ru', hi: 'ru', ar: 'ru', fa: 'ru', zh: 'ru' };

  const translationLang = data.translationLanguagesBySource?.[sourceLang] ?? TRANSLATION_DEFAULTS[sourceLang] ?? 'ru';
  const bodyRef = useRef(null);
  const handledByTouchRef = useRef(false);
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (!translationQuery) return;
    if (countWords(translationQuery.trim(), sourceLang) > 2) return;
    if (translationLang === sourceLang) return; // same-language pair: Glosbe is meaningless, don't fetch
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
    if (translationLang === sourceLang) return; // same-language pair: translation is meaningless, don't fetch
    setDeeplResult({ sentence: deeplQuery, translation: null, loading: true, error: null });
    translateSentence({ text: deeplQuery, sourceLang, targetLang: translationLang })
      .then(({ translation, error }) => {
        setDeeplResult({ sentence: deeplQuery, translation, loading: false, error });
      });
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

  // Lock body scroll while the bottom-sheet is open on mobile, restore without jump.
  useEffect(() => {
    if (translationQuery === null || !isMobile) return;
    const scrollY = window.scrollY;
    Object.assign(document.body.style, {
      overflow: 'hidden',
      position: 'fixed',
      top: `-${scrollY}px`,
      width: '100%',
    });
    return () => {
      Object.assign(document.body.style, {
        overflow: '',
        position: '',
        top: '',
        width: '',
      });
      window.scrollTo(0, scrollY);
    };
  }, [translationQuery, isMobile]);

  function handleQueryFound(query, paraText) {
    const wordCount = countWords(query, sourceLang);
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

    if (query) {
      handleQueryFound(query, paraText);
      window.getSelection()?.removeAllRanges();
    }
  }

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleContextMenu(e) {
    // Suppress iOS 16+ text-selection action menu (UIEditMenuInteraction fires
    // contextmenu). Guard preserves desktop right-click (maxTouchPoints === 0).
    if (navigator.maxTouchPoints > 0) {
      e.preventDefault();
    }
  }

  function handleTouchEnd(e) {
    // Capture query + paraText synchronously, but defer ALL selection/DOM/state
    // mutation out of the touch gesture. Clearing the range, opening the panel
    // (which triggers the position:fixed scroll-lock), and any style writes done
    // synchronously inside touchend can wedge iOS WebKit's selection machinery —
    // a deterministic, reload-requiring hard freeze on certain paragraphs. By
    // letting touchend fully resolve before we touch anything, WebKit finishes
    // its own selection transaction first. Desktop's mouseup path never does
    // these mobile-only mutations, which is why it has always been freeze-free.
    const sel = window.getSelection();
    let query = '';
    let paraText = '';

    if (sel && !sel.isCollapsed) {
      const selected = sel.toString().trim();
      if (selected && bodyRef.current?.contains(sel.anchorNode)) {
        const paraEl = sel.anchorNode?.parentElement?.closest('[data-paragraph-index]');
        query = selected;
        paraText = paraEl?.textContent?.trim() || '';
      }
    } else {
      const touch = e.changedTouches[0];
      const start = touchStartRef.current;
      if (start && (Math.abs(touch.clientY - start.y) > 12 || Math.abs(touch.clientX - start.x) > 12)) return;

      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const wordEl = el?.closest('.reading-word');
      if (wordEl && bodyRef.current?.contains(wordEl)) {
        query = (wordEl.textContent || '').replace(/[,.!?;:'")\]…]+$/, '').trim();
        const paraEl = wordEl.closest('[data-paragraph-index]');
        paraText = paraEl?.textContent?.trim()
          || wordEl.closest('h1')?.textContent?.trim()
          || '';
      }
    }

    if (!query) return;

    // Suppress the synthetic mouseup that follows touchend (must be synchronous).
    handledByTouchRef.current = true;

    // Defer the mutating work until after the gesture has fully resolved.
    setTimeout(() => {
      window.getSelection()?.removeAllRanges();
      handleQueryFound(query, paraText);
    }, 0);
  }

  function renderBlock(node, index) {
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-para">
            {renderInline(node.content, sourceLang)}
          </p>
        );

      case 'heading': {
        const level = node.attrs?.level || 2;
        const Tag = `h${Math.min(level + 1, 6)}`;
        return (
          <Tag key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-heading">
            {renderInline(node.content, sourceLang)}
          </Tag>
        );
      }

      case 'bulletList':
        return (
          <ul key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-list">
            {(node.content || []).map((item, i) => (
              <li key={i}>
                {(item.content || []).map((p, j) => (
                  <Fragment key={j}>{renderInline(p.content, sourceLang)}</Fragment>
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
                  <Fragment key={j}>{renderInline(p.content, sourceLang)}</Fragment>
                ))}
              </li>
            ))}
          </ol>
        );

      case 'blockquote':
        return (
          <blockquote key={index} ref={blockRef(index)} data-paragraph-index={index} className="reading-blockquote">
            {(node.content || []).map((p, i) => (
              <p key={i} className="reading-para" style={{ margin: 0 }}>{renderInline(p.content, sourceLang)}</p>
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
              {renderInline(node.content, sourceLang)}
            </p>
          );
        }
        return null;
    }
  }

  if (!text) return <NotFoundView />;

  const panelOpen = translationQuery !== null;
  const shareModalOpen = shareState === 'done' || shareState === 'error';

  return (
    <div className="reading-pane fade-up">
      <div className="reading-pane-header">
        <Link className="guide-back-btn" to="/reading">← Back to library</Link>
        <div className="reading-pane-header-right">
          <div className="reading-controls-row">
            {shareState === 'loading'
              ? <span className="share-inline-pulse" />
              : <button className="share-btn" onClick={handleShare}>share ↗</button>}
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
        style={isMobile
          ? { padding: MOBILE_BODY_PADDING[prefs.marginWidth] }
          : {
              maxWidth: panelOpen
                ? `min(${MARGIN_WIDTHS[prefs.marginWidth]}, calc(100vw - 26rem))`
                : MARGIN_WIDTHS[prefs.marginWidth],
            }
        }
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        <h1
          className="reading-pane-title"
          dir={isRTL(sourceLang) ? 'rtl' : undefined}
          data-lang={sourceLang === 'zh' ? 'zh' : undefined}
        >
          {segmentParagraph(text.title, sourceLang).map((tok, i) =>
            !tok.text ? null : !tok.isWord ? tok.text : (
              <span key={i} className="reading-word">{tok.text}</span>
            )
          )}
        </h1>
        <div
          className="reading-pane-text"
          dir={isRTL(sourceLang) ? 'rtl' : undefined}
          data-lang={sourceLang === 'zh' ? 'zh' : undefined}
          style={{ '--reading-font-size': `${prefs.textSize}px`, '--reading-line-height': prefs.lineSpacing }}
        >
          {blocks.map((block, i) => renderBlock(block, i))}
        </div>
      </div>

      {shareModalOpen && (
        <ShareModal
          shareUrl={shareUrl}
          error={shareState === 'error'}
          onClose={() => { setShareState(null); setShareUrl(null); }}
        />
      )}

      {panelOpen && (
        <TranslationPanel
          word={translationQuery}
          lang={translationLang}
          sourceLang={sourceLang}
          samePair={translationLang === sourceLang}
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
            const deckId = data.discoveredWordsDecks?.[text.sourceLanguage] ?? 'deck-discovered-words';
            const card = makeCard(deckId, front, back, example);
            onSaveCard(card);
          }}
        />
      )}
    </div>
  );
}
