import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { makeId } from '../utils/id';
import { processImageFile } from '../storage/images';
import { SOURCE_LANGUAGES } from '../utils/language';

const textImageKey = (id) => `srs-text-image-${id}`;

function TextImageView({ node }) {
  const { src } = node.attrs;
  let resolvedSrc = src;
  if (src && src.startsWith('text-image://')) {
    const imageId = src.slice('text-image://'.length);
    resolvedSrc = localStorage.getItem(textImageKey(imageId)) || src;
  }
  return (
    <NodeViewWrapper style={{ display: 'block' }}>
      <img
        src={resolvedSrc}
        alt=""
        draggable={false}
        style={{ maxWidth: '100%', display: 'block' }}
      />
    </NodeViewWrapper>
  );
}

const ImageWithResolver = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TextImageView);
  },
});

function countWordsInTipTapDoc(doc) {
  const texts = [];
  function walk(node) {
    if (node.type === 'text') texts.push(node.text || '');
    if (node.content) node.content.forEach(walk);
  }
  if (doc.content) doc.content.forEach(walk);
  return texts.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

export default function ImportTextModal({ onClose, onSave, defaultLang = 'tr' }) {
  const [title, setTitle] = useState('');
  const [sourceLang, setSourceLang] = useState(defaultLang);
  const [hasContent, setHasContent] = useState(false);

  const [urlImportState, setUrlImportState] = useState('closed');
  const [urlInputValue, setUrlInputValue] = useState('');
  const [urlImportError, setUrlImportError] = useState(null);
  const [urlProgressMessage, setUrlProgressMessage] = useState('');
  const [articleSiteName, setArticleSiteName] = useState(null);
  const [partialContentLoaded, setPartialContentLoaded] = useState(false);

  const isFetching = urlImportState === 'fetching';
  const valid = title.trim().length > 0 && hasContent && !isFetching;

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageWithResolver,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Paste your text here.', showOnlyCurrent: false }),
    ],
    onUpdate({ editor }) {
      setHasContent(!editor.isEmpty);
    },
    editorProps: {
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith('image/'));
        if (!imageItem) return false;

        const file = imageItem.getAsFile();
        if (!file) return false;

        processImageFile(file).then((base64) => {
          const imageId = makeId();
          localStorage.setItem(textImageKey(imageId), base64);
          const imageNode = view.state.schema.nodes.image.create({ src: `text-image://${imageId}` });
          view.dispatch(view.state.tr.replaceSelectionWith(imageNode));
        });

        return true;
      },
    },
  });

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isFetching);
  }, [editor, isFetching]);

  async function handleUrlFetch() {
    const trimmed = urlInputValue.trim();
    if (!trimmed) return;

    setUrlImportState('fetching');
    setUrlImportError(null);
    setUrlProgressMessage('Fetching the article…');

    let data;
    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      data = await res.json();
    } catch {
      setUrlImportState('error');
      setUrlImportError('fetch_failed');
      return;
    }

    if (data.error === 'invalid_url') {
      setUrlImportState('error');
      setUrlImportError('invalid_url');
      return;
    }
    if (data.error === 'fetch_failed') {
      setUrlImportState('error');
      setUrlImportError('fetch_failed');
      return;
    }
    if (data.error === 'extraction_failed') {
      setUrlImportState('error');
      setUrlImportError('extraction_failed');
      return;
    }

    // content_too_short or full success — load content
    setUrlProgressMessage('Cleaning up the content…');

    if (data.title) setTitle(data.title);

    let siteName = data.siteName || null;
    if (!siteName) {
      try { siteName = new URL(trimmed).hostname; } catch { /* leave null */ }
    }
    setArticleSiteName(siteName);

    if (editor && data.contentHtml) {
      editor.commands.setContent(data.contentHtml, true, { preserveWhitespace: 'full' });
    }

    setUrlImportState('closed');

    if (data.error === 'content_too_short') {
      setPartialContentLoaded(true);
    }
  }

  function handleUrlKeyDown(e) {
    if (e.key === 'Enter') handleUrlFetch();
  }

  function openUrlInput() {
    setUrlImportState('input');
    setUrlImportError(null);
  }

  function closeUrlInput() {
    setUrlImportState('closed');
    setUrlInputValue('');
    setUrlImportError(null);
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSave() {
    if (!valid || !editor) return;

    const doc = editor.getJSON();
    const wordCount = countWordsInTipTapDoc(doc);
    const now = new Date().toISOString();
    onSave({
      id: makeId(),
      title: title.trim(),
      content: doc,
      wordCount,
      wordsReadInThisText: 0,
      sourceLanguage: sourceLang,
      createdAt: now,
      updatedAt: now,
    });
    onClose();
  }

  return createPortal(
    <div className="feedback-overlay" onClick={handleOverlayClick}>
      <div className="import-text-modal">
        <button className="feedback-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="feedback-modal-heading">Import text</h2>

        <div className="import-text-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            className="source-lang-picker"
            style={isFetching ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
          >
            {SOURCE_LANGUAGES.map((lang, i) => (
              <Fragment key={lang.code}>
                {i > 0 && <span className="translation-lang-divider">/</span>}
                <button
                  type="button"
                  className={`source-lang-btn${sourceLang === lang.code ? ' active' : ''}`}
                  onClick={() => setSourceLang(lang.code)}
                >
                  {lang.nativeName}
                </button>
              </Fragment>
            ))}
          </div>

          {/* URL import section */}
          <div>
            <div className="url-import-link-row">
              <button
                type="button"
                className={`url-import-link${urlImportState !== 'closed' ? ' url-import-link-soft' : ''}`}
                onClick={urlImportState === 'closed' ? openUrlInput : undefined}
                disabled={isFetching}
              >
                or paste a link
              </button>
              {(urlImportState === 'input' || urlImportState === 'error') && (
                <button type="button" className="url-import-dismiss" onClick={closeUrlInput} aria-label="Close URL input">×</button>
              )}
            </div>

            {(urlImportState === 'input' || urlImportState === 'error') && (
              <div className="url-import-input-row">
                <input
                  type="url"
                  className="url-import-input"
                  placeholder="Paste a URL and press Enter"
                  value={urlInputValue}
                  onChange={(e) => { setUrlInputValue(e.target.value); setUrlImportError(null); }}
                  onKeyDown={handleUrlKeyDown}
                  autoFocus
                />
                <button type="button" className="url-import-fetch-button" onClick={handleUrlFetch}>
                  Fetch
                </button>
              </div>
            )}

            {urlImportState === 'fetching' && (
              <div className="url-import-progress">
                <span className="url-import-progress-dot" />
                <span className="url-import-progress-text">{urlProgressMessage}</span>
              </div>
            )}

            {urlImportState === 'error' && urlImportError && (
              <p className="url-import-warning">
                {urlImportError === 'extraction_failed' && 'We couldn\'t find the article content at that URL. Try copy-pasting it instead.'}
                {urlImportError === 'fetch_failed' && 'We couldn\'t reach that URL. Check the link and try again, or copy-paste the article instead.'}
                {urlImportError === 'invalid_url' && 'That doesn\'t appear to be a valid web address. Please check and try again.'}
              </p>
            )}
          </div>

          <input
            className="input"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ boxSizing: 'border-box' }}
            disabled={isFetching}
          />

          {articleSiteName && (
            <p className="url-import-source-line">From {articleSiteName}</p>
          )}

          {partialContentLoaded && (
            <p className="url-import-warning">
              Only a small portion of this article could be retrieved. The full article may be behind a paywall or require JavaScript to display. You could try copy-pasting it instead.
            </p>
          )}

          <div className="tiptap-import-editor" style={isFetching ? { opacity: 0.45, pointerEvents: 'none' } : undefined}>
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="import-text-modal-footer">
          <button className="btn btn-quiet px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary px-5 py-2.5"
            onClick={handleSave}
            disabled={!valid}
            style={{ opacity: valid ? 1 : 0.5 }}
          >
            {isFetching ? 'Fetching…' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
