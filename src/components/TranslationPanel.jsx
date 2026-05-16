import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function TranslationPanel({
  word,
  lang,
  translations,
  examples,
  loading,
  exampleSentence,
  deepl,
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

  return createPortal(
    <div className="translation-panel">
      <button className="translation-panel-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <h3 className="translation-panel-word">{word}</h3>

      <div className="translation-lang-toggle">
        <button
          className={`translation-lang-btn${lang === 'ru' ? ' active' : ''}`}
          onClick={() => onLangChange('ru')}
        >
          ru
        </button>
        <span className="translation-lang-divider">/</span>
        <button
          className={`translation-lang-btn${lang === 'en' ? ' active' : ''}`}
          onClick={() => onLangChange('en')}
        >
          en
        </button>
      </div>

      {loading ? (
        <p className="translation-loading">looking up…</p>
      ) : (
        <>
          {translations.length > 0 ? (
            <>
              <ul className="translation-list">
                {translations.map((t, i) => (
                  <li key={i} className="translation-item">{t}</li>
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
            <p className="deepl-translation">{deepl.translation}</p>
          )}
        </div>
      )}

      {!loading && translations.length > 0 && !deeplActive && (
        <button className="translation-translate-sentence" onClick={onTranslateSentence}>
          Translate sentence
        </button>
      )}

      {deeplActive ? (
        <div style={{ marginTop: '0.85rem' }} />
      ) : (
        <hr className="translation-divider" />
      )}

      {confirmed ? (
        <p className="translation-confirmed">Added to deck</p>
      ) : addingToDeck ? (
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
        </div>
      ) : (
        <button className="translation-add-btn" onClick={() => { setBackText(translations[0] || deepl?.translation || ''); setAddingToDeck(true); }}>
          + Add to deck
        </button>
      )}
    </div>,
    document.body
  );
}
