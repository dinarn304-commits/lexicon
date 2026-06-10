import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Volume2 } from 'lucide-react';

const ALL_TARGET_LANGS = ['tr', 'en', 'es', 'fr', 'ru', 'de', 'ar', 'zh'];

export default function TranslationPanel({
  word,
  lang,
  sourceLang,
  samePair,
  translations,
  examples,
  loading,
  exampleSentence,
  deepl,
  dictionary,
  onClose,
  onLangChange,
  onAddCard,
  onDeeplRequest,
  define,
}) {
  const [addingToDeck, setAddingToDeck] = useState(false);
  const [frontText, setFrontText] = useState(word);
  const [backText, setBackText] = useState('');
  const [exampleText, setExampleText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [glosbeExpanded, setGlosbeExpanded] = useState(true);
  const [deeplExpanded, setDeeplExpanded] = useState(false);

  // ── Swipe-to-dismiss drag state ────────────────────────────────────────────
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // mounted: false while the CSS entry animation is running (220ms), true after.
  // When false we apply no inline style so the keyframe runs uncontested.
  // When true we apply animation:none + inline transform so the drag can take over.
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);
  const panelBodyRef = useRef(null);
  const dragStartRef = useRef(null);
  const dragYRef = useRef(0);
  // Keep a ref to onClose so the non-passive native listener never captures a stale copy
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const wordCount = word ? word.trim().split(/\s+/).filter(Boolean).length : 0;
  const isShortSelection = wordCount <= 2;

  useEffect(() => {
    setAddingToDeck(false);
    setConfirmed(false);
    setFrontText(word);
    setBackText(translations[0] || '');
    setExampleText(exampleSentence || '');
    setGlosbeExpanded(true);
    setDeeplExpanded(false);
  }, [word, translations, exampleSentence]);

  // After the 220ms entry animation completes, hand control to inline transform.
  // We wait 230ms (10ms margin) so the fill-mode holds before we cancel.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 230);
    return () => clearTimeout(t);
  }, []);

  // Non-passive touchmove so we can preventDefault and stop body scroll while dragging.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    function onMove(e) {
      if (dragStartRef.current === null) return;
      const dy = e.touches[0].clientY - dragStartRef.current;
      if (dy > 0) {
        e.preventDefault();
        dragYRef.current = dy;
        setDragY(dy);
      }
    }
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  function handleSave() {
    onAddCard(frontText.trim(), backText.trim(), exampleText.trim());
    setAddingToDeck(false);
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 2000);
  }

  function handleDeeplRowTap() {
    if (!deeplExpanded && deepl.sentence === null) {
      onDeeplRequest();
    }
    setDeeplExpanded((e) => !e);
  }

  function playAudio(url) {
    try { new Audio(url).play(); } catch {}
  }

  function handlePanelTouchStart(e) {
    const bodyEl = panelBodyRef.current;
    const atTop = !bodyEl || bodyEl.scrollTop === 0;
    if (atTop) {
      dragStartRef.current = e.touches[0].clientY;
      dragYRef.current = 0;
      setIsDragging(true);
    }
  }

  function handlePanelTouchEnd() {
    if (dragStartRef.current === null) return;
    dragStartRef.current = null;
    const dy = dragYRef.current;
    dragYRef.current = 0;
    if (dy > 80) {
      onCloseRef.current();
    } else {
      // Two-step snap-back: first commit transition:ease, then in the next
      // frame change the transform value — browser sees a value change with a
      // transition in place and animates it correctly.
      setIsDragging(false);
      requestAnimationFrame(() => setDragY(0));
    }
  }

  const defaultBack = isShortSelection
    ? (define?.meaningBase || translations[0] || deepl?.translation || '')
    : (deepl?.translation || '');

  const showDefineSection = define && !define.error && (define.loading || (define.base && define.meaningBase));

  return createPortal(
    <>
      <div className="translation-backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        className="translation-panel"
        style={mounted ? {
          animation: 'none',
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
        } : undefined}
        onTouchStart={handlePanelTouchStart}
        onTouchEnd={handlePanelTouchEnd}
      >
        <div className="translation-panel-handle" aria-hidden="true">
          <div className="translation-panel-handle-bar" />
        </div>
        <button className="translation-panel-close" onClick={onClose} aria-label="Close">
          ×
        </button>

      <div className="translation-panel-header">
        <h3 className="translation-panel-word">{word}</h3>
        <div className="translation-lang-toggle">
          {ALL_TARGET_LANGS.map((l, i) => (
            <Fragment key={l}>
              {i > 0 && <span className="translation-lang-divider">·</span>}
              <button
                className={`translation-lang-btn${lang === l ? ' active' : ''}`}
                onClick={() => onLangChange(l)}
              >
                {l}
              </button>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="translation-panel-body" ref={panelBodyRef}>
        {isShortSelection ? (
          <>
            {/* GPT define section */}
            {showDefineSection && (
              <div className="define-section">
                <p className="define-label">· dictionary form ·</p>
                {define.loading ? (
                  <div className="define-progress-bar" />
                ) : (
                  <>
                    <div className="define-form-line" dir="auto">
                      {define.isInflected ? (
                        <>
                          <span className="define-input-word">{word}</span>
                          <span className="define-arrow">→</span>
                          <span className="define-base">{define.base}</span>
                        </>
                      ) : (
                        <span className="define-base">{define.base}</span>
                      )}
                    </div>
                    <p className="define-meaning" dir="auto">{define.meaningBase}</p>
                    {define.noteSource && (
                      <p className="define-note" dir="auto">{define.noteSource}</p>
                    )}
                    {define.noteSource && define.noteTarget && (
                      <p className="define-note" dir="auto">{define.noteTarget}</p>
                    )}
                  </>
                )}
                {!samePair && (
                  <div
                    className="define-glosbe-toggle"
                    role="button"
                    tabIndex={0}
                    onClick={() => setGlosbeExpanded((e) => !e)}
                    onKeyDown={(e) => e.key === 'Enter' && setGlosbeExpanded((v) => !v)}
                  >
                    <span className="define-glosbe-line" />
                    <span className="define-glosbe-chevron">{glosbeExpanded ? '−' : '+'}</span>
                    <span className="define-glosbe-line" />
                  </div>
                )}
              </div>
            )}

            {/* Glosbe section — skipped entirely for a same-language pair */}
            {!samePair && glosbeExpanded && (
              loading ? (
                <p className="translation-loading">looking up…</p>
              ) : translations.length > 0 ? (
                <>
                  <ul className="translation-list">
                    {translations.map((t, i) => (
                      <li key={i} className="translation-item" dir="auto">{t}</li>
                    ))}
                  </ul>
                  {examples.length > 0 && (
                    <div className="translation-examples">
                      {examples.slice(0, 2).map((ex, i) => (
                        <p key={i} className="translation-example">{ex}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="translation-empty">no translation found</p>
              )
            )}

            {/* DeepL pill button — hidden for a same-language pair */}
            {!samePair && (
            <div className="deepl-pill-wrapper">
              <button
                className={`deepl-pill${deeplExpanded ? ' deepl-pill-open' : ''}`}
                onClick={handleDeeplRowTap}
              >
                <span className="deepl-pill-label">DeepL — translation</span>
                <span className="deepl-pill-chevron">{deeplExpanded ? '−' : '+'}</span>
              </button>
              {deeplExpanded && (
                <div className="deepl-pill-result">
                  {deepl.loading ? (
                    <span className="define-loading" />
                  ) : deepl.error ? (
                    <p className="deepl-fallback">Translation unavailable just now.</p>
                  ) : deepl.translation ? (
                    <p className="deepl-translation" dir="auto">{deepl.translation}</p>
                  ) : null}
                </div>
              )}
              {!deeplExpanded && (
                <p className="deepl-pill-caption">for when you need the whole sentence translated</p>
              )}
            </div>
            )}
          </>
        ) : (
          /* 3+ word path: DeepL is the primary response */
          <div className="deepl-primary">
            {samePair ? (
              <p className="deepl-same-pair-note">Phrases can be translated into any other language.</p>
            ) : deepl.loading ? (
              <span className="define-loading" />
            ) : deepl.error ? (
              <p className="deepl-fallback">Translation unavailable just now.</p>
            ) : deepl.translation ? (
              <p className="deepl-translation" dir="auto">{deepl.translation}</p>
            ) : null}
          </div>
        )}

        {/* Free Dictionary — auto-displayed for English source, both paths */}
        {sourceLang === 'en' && (dictionary.loading || dictionary.word || dictionary.error) && (
          <div className="dictionary-section">
            <hr className="dictionary-divider" />
            {dictionary.loading ? (
              <span className="define-loading" />
            ) : dictionary.error === 'not_found' ? (
              <p className="dictionary-unavailable">No entry found.</p>
            ) : dictionary.error ? (
              <p className="dictionary-unavailable">Definitions unavailable just now.</p>
            ) : dictionary.word ? (
              <>
                {(dictionary.phonetic || dictionary.audio) && (
                  <div className="dictionary-phonetic-row">
                    {dictionary.phonetic && (
                      <span className="dictionary-phonetic">{dictionary.phonetic}</span>
                    )}
                    {dictionary.audio && (
                      <button
                        className="dictionary-audio-btn"
                        onClick={() => playAudio(dictionary.audio)}
                        aria-label="Play pronunciation"
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                  </div>
                )}
                {(dictionary.meanings || []).map((meaning, i) => (
                  <div key={i} className="dictionary-meaning">
                    <p className="dictionary-pos">{meaning.partOfSpeech}</p>
                    {meaning.definitions.map((def, j) => (
                      <div key={j} className="dictionary-def-item">
                        <p className="dictionary-definition">{def.definition}</p>
                        {def.example && (
                          <p className="dictionary-example">{def.example}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : null}
          </div>
        )}

        {addingToDeck && (
          <div className="translation-add-form">
            <div>
              <p className="translation-add-form-label">Front</p>
              <input
                value={frontText}
                onChange={(e) => setFrontText(e.target.value)}
                placeholder="Front"
              />
            </div>
            <div>
              <p className="translation-add-form-label">Back</p>
              <input
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
                placeholder="Back"
              />
            </div>
            <div>
              <p className="translation-add-form-label">Example</p>
              <textarea
                value={exampleText}
                onChange={(e) => setExampleText(e.target.value)}
                placeholder="Example sentence"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      <div className="translation-panel-footer">
        {confirmed ? (
          <p className="translation-confirmed">Added to deck</p>
        ) : addingToDeck ? (
          <div className="translation-add-form-actions">
            <button
              className="btn btn-quiet"
              style={{ fontSize: '0.85rem', padding: '4px 10px' }}
              onClick={() => setAddingToDeck(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '4px 12px' }}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            className="translation-add-btn"
            onClick={() => {
              setFrontText(define?.base || word);
              setBackText(defaultBack);
              setAddingToDeck(true);
            }}
          >
            + Add to deck
          </button>
        )}
      </div>
      </div>
    </>,
    document.body
  );
}
