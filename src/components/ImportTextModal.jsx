import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { makeId } from '../utils/id';
import { processImageFile } from '../storage/images';

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

export default function ImportTextModal({ onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [hasContent, setHasContent] = useState(false);
  const valid = title.trim().length > 0 && hasContent;

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageWithResolver,
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
          <input
            className="input"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ boxSizing: 'border-box' }}
          />
          <div className="tiptap-import-editor">
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
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
