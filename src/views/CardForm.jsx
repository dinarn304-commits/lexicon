import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { processImageFile, loadCardImage, saveCardImage, removeCardImage } from '../storage/images';
import { makeCard } from '../utils/card';

export default function CardForm({ deck, onSave, onCancel, userAddedCount = 0, existingCard = null }) {
  const isEdit = existingCard !== null;
  const frontInputRef = useRef(null);
  const [front, setFront] = useState(existingCard?.front || '');
  const [back, setBack] = useState(existingCard?.back || '');
  const [example, setExample] = useState(existingCard?.example || '');
  const [notes, setNotes] = useState(existingCard?.notes || '');
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [imageStatus, setImageStatus] = useState('idle'); // idle | loading | error
  const [savedCount, setSavedCount] = useState(0);
  const showHints = !isEdit && userAddedCount < 3;

  useEffect(() => {
    if (isEdit && existingCard.hasImage) {
      setImageStatus('loading');
      loadCardImage(existingCard.id).then((url) => {
        if (url) setImageDataUrl(url);
        setImageStatus('idle');
      });
    }
  }, [isEdit, existingCard]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageStatus('loading');
    try {
      const dataUrl = await processImageFile(file);
      setImageDataUrl(dataUrl);
      setImageStatus('idle');
    } catch (err) {
      console.error(err);
      setImageStatus('error');
    }
    e.target.value = '';
  }

  function removeImage() {
    setImageDataUrl(null);
  }

  function clearForm() {
    setFront(''); setBack(''); setExample(''); setNotes('');
    setImageDataUrl(null);
  }

  function handleTextKeyDown(e) {
    if (e.key !== 'Enter') return;
    if (!front.trim() || !back.trim() || imageStatus === 'loading') return;
    e.preventDefault();
    if (isEdit) {
      submit(false);
    } else {
      submit(true).then(() => frontInputRef.current?.focus());
    }
  }

  async function submit(addAnother = false) {
    if (!front.trim() || !back.trim()) return;

    if (isEdit) {
      const updated = {
        ...existingCard,
        front: front.trim(),
        back: back.trim(),
        example: example.trim(),
        notes: notes.trim(),
        hasImage: imageDataUrl !== null,
      };
      if (imageDataUrl) {
        await saveCardImage(existingCard.id, imageDataUrl);
      } else if (existingCard.hasImage) {
        await removeCardImage(existingCard.id);
      }
      onSave(updated);
    } else {
      const card = makeCard(deck.id, front.trim(), back.trim(), example.trim(), notes.trim());
      if (imageDataUrl) {
        card.hasImage = true;
        await saveCardImage(card.id, imageDataUrl);
      }
      onSave(card);
      setSavedCount((c) => c + 1);
      if (addAnother) clearForm();
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 fade-up">
      <button className="btn btn-quiet text-sm flex items-center gap-1 mb-6" onClick={onCancel}>
        <ChevronLeft size={16} /> Back to {deck.name}
      </button>
      <div className="ornament text-xs mb-3">· {isEdit ? 'EDIT CARD' : 'NEW CARD'} ·</div>
      <h1 className="display text-3xl mb-2">{isEdit ? 'Refine this card' : 'Add a word'}</h1>
      {!isEdit && savedCount > 0 && (
        <p className="italic text-sm mb-6" style={{ color: 'var(--moss)' }}>
          ✓ {savedCount} card{savedCount === 1 ? '' : 's'} added in this session
        </p>
      )}

      <div className="space-y-4 mt-6">
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Word / phrase (front)
          </label>
          <input
            ref={frontInputRef}
            className="input"
            placeholder={showHints ? 'anlam' : ''}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            onKeyDown={handleTextKeyDown}
            autoFocus
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Translation (back)
          </label>
          <input
            className="input"
            placeholder={showHints ? 'meaning' : ''}
            value={back}
            onChange={(e) => setBack(e.target.value)}
            onKeyDown={handleTextKeyDown}
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Example sentence (optional)
          </label>
          <input
            className="input"
            placeholder={showHints ? 'Hayatın anlamı nedir?' : ''}
            value={example}
            onChange={(e) => setExample(e.target.value)}
            onKeyDown={handleTextKeyDown}
          />
        </div>
        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Notes (optional)
          </label>
          <input
            className="input"
            placeholder={showHints ? 'mesela, aynı kökü paylaşan kelimeler: anlamlı, anlamsız, anlamlandırmak...' : ''}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleTextKeyDown}
          />
        </div>

        <div>
          <label className="mono text-xs uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
            Image (optional)
          </label>
          {imageDataUrl ? (
            <div className="flex items-start gap-3 flex-wrap">
              <div className="image-frame">
                <img src={imageDataUrl} alt="card preview" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="image-upload-label">
                  <RotateCcw size={14} />
                  Replace
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </label>
                <button className="btn btn-quiet text-sm flex items-center gap-1" onClick={removeImage}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="image-upload-label">
              <Plus size={14} />
              {imageStatus === 'loading' ? 'Processing…' : 'Choose an image'}
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={imageStatus === 'loading'} />
            </label>
          )}
          {imageStatus === 'error' && (
            <p className="italic text-sm mt-2" style={{ color: 'var(--terracotta)' }}>
              Sorry — that image couldn't be read. Try another.
            </p>
          )}
          {showHints && !imageDataUrl && (
            <p className="italic text-xs mt-2" style={{ color: 'var(--ink-faint)' }}>
              A picture appears alongside the meaning during review — useful for object words.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2 flex-wrap">
          {isEdit ? (
            <>
              <button
                className="btn btn-primary px-5 py-2.5"
                onClick={() => submit(false)}
                disabled={!front.trim() || !back.trim() || imageStatus === 'loading'}
                style={{ opacity: front.trim() && back.trim() && imageStatus !== 'loading' ? 1 : 0.5 }}
              >
                Save changes
              </button>
              <button className="btn btn-ghost px-5 py-2.5" onClick={onCancel}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary px-5 py-2.5"
                onClick={() => submit(true)}
                disabled={!front.trim() || !back.trim() || imageStatus === 'loading'}
                style={{ opacity: front.trim() && back.trim() && imageStatus !== 'loading' ? 1 : 0.5 }}
              >
                Save & add another
              </button>
              <button
                className="btn btn-ghost px-5 py-2.5"
                onClick={async () => { await submit(false); onCancel(); }}
                disabled={!front.trim() || !back.trim() || imageStatus === 'loading'}
                style={{ opacity: front.trim() && back.trim() && imageStatus !== 'loading' ? 1 : 0.5 }}
              >
                Save & close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
