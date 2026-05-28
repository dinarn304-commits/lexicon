import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { applyRating, migrateCard } from './algorithm/scheduler';
import { loadAppData, saveAppData } from './storage/storage';
import { removeCardImage } from './storage/images';
import { checkStorageHealth, requestPersistentStorage } from './storage/persistence';
import { createSampleData } from './utils/card';
import { getLanguageMeta } from './utils/language';
import { slugify, ensureUniqueSlug } from './utils/slug';
import ThemeStyles from './components/ThemeStyles';
import Loader from './components/Loader';
import PageFooter from './components/PageFooter';
import FeedbackModal from './components/FeedbackModal';
import HomeView from './views/HomeView';
import DeckView from './views/DeckView';
import ReviewView from './views/ReviewView';
import SpeakingView from './views/SpeakingView';
import ReadingView from './views/ReadingView';
import ReadingPane from './views/ReadingPane';
import SharedTextView from './views/SharedTextView';
import GuideView from './views/GuideView';
import NotFoundView from './views/NotFoundView';

function migrateSlugs(saved) {
  const existingDeckSlugs = new Set(saved.decks.filter((d) => d.slug).map((d) => d.slug));
  const existingTextSlugs = new Set((saved.texts || []).filter((t) => t.slug).map((t) => t.slug));
  let changed = false;

  const decks = saved.decks.map((deck) => {
    if (deck.slug) return deck;
    const slug = ensureUniqueSlug(slugify(deck.name), existingDeckSlugs);
    existingDeckSlugs.add(slug);
    changed = true;
    return { ...deck, slug };
  });

  const texts = (saved.texts || []).map((text) => {
    if (text.slug) return text;
    const slug = ensureUniqueSlug(slugify(text.title), existingTextSlugs);
    existingTextSlugs.add(slug);
    changed = true;
    return { ...text, slug };
  });

  return { changed, data: changed ? { ...saved, decks, texts } : saved };
}

export default function App() {
  const [data, setData] = useState({ decks: [], cards: [], texts: [] });
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState('forward');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const mode =
    location.pathname.startsWith('/read')     ? 'reading'  :
    location.pathname.startsWith('/speaking') ? 'speaking' :
    'vocabulary';

  useEffect(() => {
    (async () => {
      checkStorageHealth();
      requestPersistentStorage();
      const saved = await loadAppData();
      if (saved) {
        saved.cards = (saved.cards || []).map(migrateCard);
        saved.texts = saved.texts || [];
        const today = new Date().toISOString().slice(0, 10);
        saved.wordsReadToday = saved.wordsReadToday ?? 0;
        saved.wordsReadTotal = saved.wordsReadTotal ?? 0;
        saved.lastReadDate   = saved.lastReadDate   ?? today;
        if (saved.lastReadDate !== today) {
          saved.wordsReadToday = 0;
          saved.lastReadDate   = today;
        }
        if (!saved.readingPreferences) {
          saved.readingPreferences = { textSize: 18, marginWidth: 'normal', lineSpacing: 1.5 };
        }
        if (!saved.translationLanguagesBySource) {
          saved.translationLanguagesBySource = saved.translationLanguage
            ? { tr: saved.translationLanguage }
            : {};
        }
        delete saved.translationLanguage;
        if (!saved.discoveredWordsDecks) {
          const hasLegacyDeck = saved.decks.some((d) => d.id === 'deck-discovered-words');
          saved.discoveredWordsDecks = hasLegacyDeck ? { tr: 'deck-discovered-words' } : {};
          delete saved.discoveredWordsDeckInitialized;
        }
        saved.texts = saved.texts.map((t) => t.sourceLanguage ? t : { ...t, sourceLanguage: 'tr' });

        const { changed, data: migratedData } = migrateSlugs(saved);
        if (changed) {
          await saveAppData(migratedData);
          setData(migratedData);
        } else {
          setData(saved);
        }
      } else {
        const initial = createSampleData();
        const { data: withSlugs } = migrateSlugs(initial);
        setData(withSlugs);
        await saveAppData(withSlugs);
      }
      setLoading(false);
    })();
  }, []);

  async function persist(newData) {
    setData(newData);
    await saveAppData(newData);
  }

  function saveDeck(deck) {
    const existingSlugs = new Set(data.decks.map((d) => d.slug).filter(Boolean));
    const slug = ensureUniqueSlug(slugify(deck.name), existingSlugs);
    const deckWithSlug = { ...deck, slug };
    persist({ ...data, decks: [...data.decks, deckWithSlug] });
    navigate(`/vocabulary/${slug}`);
  }

  function updateDeck(updatedDeck) {
    persist({ ...data, decks: data.decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)) });
  }

  async function deleteDeck(deckId) {
    const cardsToRemove = data.cards.filter((c) => c.deckId === deckId);
    await Promise.all(cardsToRemove.filter((c) => c.hasImage).map((c) => removeCardImage(c.id)));
    await persist({
      ...data,
      decks: data.decks.filter((d) => d.id !== deckId),
      cards: data.cards.filter((c) => c.deckId !== deckId),
    });
    navigate('/vocabulary');
  }

  function persistCard(updatedCard) {
    persist({ ...data, cards: data.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)) });
  }

  function saveCard(card) {
    const deckExists = data.decks.find((d) => d.id === card.deckId);
    if (deckExists) {
      persist({ ...data, cards: [...data.cards, card], cardsAddedByUser: (data.cardsAddedByUser || 0) + 1 });
      return;
    }
    const discoveredEntry = Object.entries(data.discoveredWordsDecks ?? {})
      .find(([, deckId]) => deckId === card.deckId);
    if (discoveredEntry) {
      const [sourceLang] = discoveredEntry;
      const meta = getLanguageMeta(sourceLang);
      const existingDeckSlugs = new Set(data.decks.map((d) => d.slug).filter(Boolean));
      const deckSlug = ensureUniqueSlug(slugify(meta.deckName), existingDeckSlugs);
      const recreatedDeck = {
        id: meta.deckId,
        name: meta.deckName,
        slug: deckSlug,
        description: '',
        language: meta.deckLanguageLabel,
        createdAt: new Date().toISOString(),
      };
      persist({
        ...data,
        decks: [...data.decks, recreatedDeck],
        cards: [...data.cards, card],
        cardsAddedByUser: (data.cardsAddedByUser || 0) + 1,
      });
      return;
    }
    persist({ ...data, cards: [...data.cards, card], cardsAddedByUser: (data.cardsAddedByUser || 0) + 1 });
  }

  function updateCard(updatedCard) {
    persist({ ...data, cards: data.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)) });
  }

  async function deleteCard(id) {
    const card = data.cards.find((c) => c.id === id);
    if (card?.hasImage) await removeCardImage(id);
    persist({ ...data, cards: data.cards.filter((c) => c.id !== id) });
  }

  function saveText(text) {
    const sourceLang = text.sourceLanguage || 'tr';
    const existingTextSlugs = new Set(data.texts.map((t) => t.slug).filter(Boolean));
    const textSlug = ensureUniqueSlug(slugify(text.title), existingTextSlugs);
    const textWithSlug = { ...text, slug: textSlug };

    const newData = { ...data, texts: [...(data.texts || []), textWithSlug] };
    if (!newData.discoveredWordsDecks[sourceLang]) {
      const meta = getLanguageMeta(sourceLang);
      const existingDeckSlugs = new Set(data.decks.map((d) => d.slug).filter(Boolean));
      const deckSlug = ensureUniqueSlug(slugify(meta.deckName), existingDeckSlugs);
      newData.decks = [...newData.decks, {
        id: meta.deckId,
        name: meta.deckName,
        slug: deckSlug,
        description: '',
        language: meta.deckLanguageLabel,
        createdAt: new Date().toISOString(),
      }];
      newData.discoveredWordsDecks = { ...newData.discoveredWordsDecks, [sourceLang]: meta.deckId };
    }
    persist(newData);
  }

  function deleteText(textId) {
    const text = data.texts.find((t) => t.id === textId);
    if (!text) return;
    function walkDoc(node) {
      if (node.type === 'image' && node.attrs?.src?.startsWith('text-image://')) {
        localStorage.removeItem(`srs-text-image-${node.attrs.src.slice('text-image://'.length)}`);
      }
      if (node.content) node.content.forEach(walkDoc);
    }
    walkDoc(text.content);
    persist({ ...data, texts: data.texts.filter((t) => t.id !== textId) });
  }

  function updateReadingPreferences(prefs) {
    persist({ ...data, readingPreferences: prefs });
  }

  function updateTranslationLanguage(sourceLang, targetLang) {
    persist({ ...data, translationLanguagesBySource: { ...data.translationLanguagesBySource, [sourceLang]: targetLang } });
  }

  function updateReadingProgress(textId, newWordsRead) {
    setData((prev) => {
      const text = prev.texts.find((t) => t.id === textId);
      if (!text) return prev;
      const delta = Math.max(0, newWordsRead - text.wordsReadInThisText);
      const next = {
        ...prev,
        texts: prev.texts.map((t) =>
          t.id === textId ? { ...t, wordsReadInThisText: newWordsRead } : t
        ),
        wordsReadToday: (prev.wordsReadToday || 0) + delta,
        wordsReadTotal: (prev.wordsReadTotal || 0) + delta,
      };
      saveAppData(next);
      return next;
    });
  }

  // For shared texts that aren't in data.texts — only the global counters advance.
  function addReadingProgress(delta) {
    if (delta <= 0) return;
    setData((prev) => {
      const next = {
        ...prev,
        wordsReadToday: (prev.wordsReadToday || 0) + delta,
        wordsReadTotal: (prev.wordsReadTotal || 0) + delta,
      };
      saveAppData(next);
      return next;
    });
  }

  function reorderDecks(newDecks) {
    persist({ ...data, decks: newDecks });
  }

  const vocabBtnRef = useRef(null);
  const speakBtnRef = useRef(null);
  const readBtnRef  = useRef(null);
  const highlightRef = useRef(null);

  useLayoutEffect(() => {
    const btn =
      mode === 'vocabulary' ? vocabBtnRef.current :
      mode === 'speaking'   ? speakBtnRef.current :
                              readBtnRef.current;
    const highlight = highlightRef.current;
    if (!btn || !highlight) return;

    function measure() {
      highlight.style.left = btn.offsetLeft + 'px';
      highlight.style.width = btn.offsetWidth + 'px';
    }

    // document.fonts.ready resolves when fonts are downloaded but before the
    // browser has reflowed with the new metrics, so measuring there reads stale
    // fallback-font dimensions. ResizeObserver fires after layout is complete,
    // so it naturally catches the font-load reflow and any subsequent resizes.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(btn);
    return () => ro.disconnect();
  }, [mode, loading]);

  if (loading) return <Loader />;

  return (
    <div className="srs-root">
      <ThemeStyles />
      <div className="srs-content">
        <div className="srs-main">
          <div className="mode-switcher-band">
            <span className="mode-hairline-l" />
            <div className="mode-switcher-track">
              <span className="mode-switcher-highlight" ref={highlightRef} />
              <NavLink
                ref={vocabBtnRef}
                to="/vocabulary"
                className={() => 'mode-opt'}
                style={({ isActive }) => ({ color: isActive ? 'var(--ink)' : undefined })}
              >
                vocabulary
              </NavLink>
              <span className="mode-dot" aria-hidden="true">·</span>
              <NavLink
                ref={speakBtnRef}
                to="/speaking"
                className={() => 'mode-opt'}
                style={({ isActive }) => ({ color: isActive ? 'var(--ink)' : undefined })}
              >
                speaking
              </NavLink>
              <span className="mode-dot" aria-hidden="true">·</span>
              <NavLink
                ref={readBtnRef}
                to="/reading"
                className={() => 'mode-opt'}
                style={({ isActive }) => ({ color: isActive ? 'var(--ink)' : undefined })}
              >
                reading
              </NavLink>
            </div>
            <span className="mode-hairline-r" />
          </div>

          {showGuide ? (
            <GuideView onBack={() => setShowGuide(false)} />
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to="/vocabulary" replace />} />
              <Route path="/vocabulary" element={
                <HomeView
                  data={data}
                  onSaveDeck={saveDeck}
                  onReorderDecks={reorderDecks}
                  onOpenGuide={() => setShowGuide(true)}
                />
              } />
              <Route path="/vocabulary/:deckSlug" element={
                <DeckView
                  data={data}
                  direction={direction}
                  onSetDirection={setDirection}
                  onSaveCard={saveCard}
                  onUpdateCard={updateCard}
                  onUpdateDeck={updateDeck}
                  onDeleteCard={deleteCard}
                  onDeleteDeck={deleteDeck}
                />
              } />
              <Route path="/vocabulary/:deckSlug/review" element={
                <ReviewView
                  data={data}
                  direction={direction}
                  onPersistCard={persistCard}
                />
              } />
              <Route path="/speaking" element={<SpeakingView />} />
              <Route path="/reading" element={
                <ReadingView
                  data={data}
                  onSaveText={saveText}
                  onDeleteText={deleteText}
                  onUpdateReadingProgress={updateReadingProgress}
                  onUpdateReadingPreferences={updateReadingPreferences}
                  onSaveCard={saveCard}
                  onUpdateTranslationLanguage={updateTranslationLanguage}
                />
              } />
              <Route path="/reading/:textSlug" element={
                <ReadingPane
                  data={data}
                  onUpdateReadingProgress={updateReadingProgress}
                  onUpdateReadingPreferences={updateReadingPreferences}
                  onSaveCard={saveCard}
                  onUpdateTranslationLanguage={updateTranslationLanguage}
                />
              } />
              <Route path="/read/:slugAndToken" element={
                <SharedTextView
                  data={data}
                  onSaveCard={saveCard}
                  onSaveText={saveText}
                  onAddReadingProgress={addReadingProgress}
                  onUpdateReadingPreferences={updateReadingPreferences}
                  onUpdateTranslationLanguage={updateTranslationLanguage}
                />
              } />
              <Route path="*" element={<NotFoundView />} />
            </Routes>
          )}
        </div>
        {!showGuide && (
          <PageFooter onGuideClick={() => setShowGuide(true)} onFeedbackClick={() => setFeedbackOpen(true)} />
        )}
      </div>
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
