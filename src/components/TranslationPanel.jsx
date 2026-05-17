import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Volume2 } from 'lucide-react';

const ALL_TARGET_LANGS = ['tr', 'en', 'es', 'fr', 'ru', 'de', 'ar', 'zh'];

export default function TranslationPanel({
  word,
  lang,
  sourceLang,
  translations,
  examples,
  loading,
  exampleSentence,
  deepl,
  dictionary,
  onTranslateSentence,
  onClose,
  onLangChange,
  onAddCard,
}) {
  const [addingToDeck, setAddingToDeck] = useState(false);
  const [frontText, setFrontText] = useState(word);
  const [backText, setBackText] = useState('');
  const [exampleText, setExampleText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [defsExpanded, setDefsExpanded] = useState(true);

  useEffect(() => {
    setAddingToDeck(false);
    setConfirmed(false);
    setFrontText(word);
    setBackText(translations[0] || '');
    setExampleText(exampleSentence || '');
  }, [word, translations, exampleSentence]);

  function handleSave() {
    onAddCard(frontText.trim(), backText.trim(), exampleText.trim());
    setAddingToDeck(false);
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 2000);
  }

  const deeplActive = Boolean(deepl?.sentence);

  const isMultiWord = word ? word.split(/\s+/).filter(Boolean).length > 1 : false;
  const showDictionary = sourceLang === 'en'
    && !isMultiWord
    && dictionary?.error !== 'not_found'
    && (dictionary?.loading || dictionary?.word !== null || dictionary?.error != null);

  function playAudio(url) {
    try { new Audio(url).play(); } catch {}
  }

  return createPortal(
    <div className="translation-panel">
      <button className="translation-panel-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <div className="translation-panel-header">
        <h3 className="translation-panel-word">{word}</h3>
        <div className="translation-lang-toggle">
          {ALL_TARGET_LANGS.filter((l) => l !== sourceLang).map((l, i) => (
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

      <div className="translation-panel-body">
        {loading ? (
          <p className="translation-loading">looking up…</p>
        ) : (
          <>
            {translations.length > 0 ? (
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
            ) : !deeplActive ? (
              <p className="translation-empty">no translation found</p>
            ) : null}
          </>
        )}

        {deeplActive && (
          <div className="deepl-section">
            <hr className="deepl-divider" />
            <p className="deepl-label">sentence</p>
            <p className="deepl-source">{deepl.sentence}</p>
            {deepl.loading ? (
              <p className="deepl-loading">· · ·</p>
            ) : deepl.error ? (
              <p className="deepl-fallback">Sentence translation unavailable just now.</p>
            ) : (
              <p className="deepl-translation" dir="auto">{deepl.translation}</p>
            )}
          </div>
        )}

        {!loading && translations.length > 0 && !deeplActive && (
          <button className="translation-translate-sentence" onClick={onTranslateSentence}>
            Translate sentence
          </button>
        )}

        {showDictionary && (
          <div className="dictionary-section">
            <hr className="dictionary-divider" />
            <div className="dictionary-label-row" onClick={() => setDefsExpanded(e => !e)}>
              <span className="dictionary-label">definitions</span>
              <span className="dictionary-toggle">{defsExpanded ? '−' : '+'}</span>
            </div>
            {defsExpanded && (
              dictionary.loading ? (
                <p className="deepl-loading">· · ·</p>
              ) : dictionary.error ? (
                <p className="dictionary-unavailable">Definitions unavailable just now.</p>
              ) : (
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
              )
            )}
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
            onClick={() => { setBackText(translations[0] || deepl?.translation || ''); setAddingToDeck(true); }}
          >
            + Add to deck
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
