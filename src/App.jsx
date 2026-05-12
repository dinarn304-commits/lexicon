import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { isDue, applyRating, migrateCard } from './algorithm/scheduler';
import { loadAppData, saveAppData } from './storage/storage';
import { removeCardImage } from './storage/images';
import { createSampleData } from './utils/card';
import ThemeStyles from './components/ThemeStyles';
import Loader from './components/Loader';
import PageFooter from './components/PageFooter';
import FeedbackModal from './components/FeedbackModal';
import HomeView from './views/HomeView';
import DeckView from './views/DeckView';
import ReviewView from './views/ReviewView';
import DeckForm from './views/DeckForm';
import CardForm from './views/CardForm';
import SpeakingView from './views/SpeakingView';
import ReadingView from './views/ReadingView';
import GuideView from './views/GuideView';

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('srs-active-mode') || 'vocabulary');
  const [view, setView] = useState('home');
  const [previousLocation, setPreviousLocation] = useState(null);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [data, setData] = useState({ decks: [], cards: [] });
  const [loading, setLoading] = useState(true);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [sessionStats, setSessionStats] = useState({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await loadAppData();
      if (saved) {
        saved.cards = (saved.cards || []).map(migrateCard);
        setData(saved);
      } else {
        const initial = createSampleData();
        setData(initial);
        await saveAppData(initial);
      }
      setLoading(false);
    })();
  }, []);

  async function persist(newData) {
    setData(newData);
    await saveAppData(newData);
  }

  const activeDeck = data.decks.find((d) => d.id === activeDeckId);
  const deckCards = data.cards.filter((c) => c.deckId === activeDeckId);

  function openDeck(id) { setActiveDeckId(id); setView('deck'); }
  function backHome() { setActiveDeckId(null); setView('home'); }

  function startReview() {
    const due = data.cards
      .filter((c) => c.deckId === activeDeckId && isDue(c))
      .sort(() => Math.random() - 0.5);
    if (due.length === 0) return;
    setReviewQueue(due);
    setSessionStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });
    setView('review');
  }

  function rateCard(quality) {
    const card = reviewQueue[0];
    if (!card) return;
    const updated = applyRating(card, quality);
    persist({ ...data, cards: data.cards.map((c) => (c.id === card.id ? updated : c)) });

    const key = quality === 1 ? 'again' : quality === 3 ? 'hard' : quality === 4 ? 'good' : 'easy';
    setSessionStats((s) => ({ ...s, total: s.total + 1, [key]: s[key] + 1 }));

    if (quality === 1) {
      // "Again" always requeues to the end of the session so forgotten cards
      // are consolidated within the same sitting, regardless of the algorithm's
      // calculated next-review time (lapseStep = 20 min, which would otherwise
      // fall outside the 5-minute window and drop the card from the session).
      setReviewQueue((q) => [...q.slice(1), updated]);
    } else {
      const minutesUntilNext = (new Date(updated.nextReview) - new Date()) / 60000;
      if (minutesUntilNext < 5) {
        setReviewQueue((q) => [...q.slice(1), updated]);
      } else {
        setReviewQueue((q) => q.slice(1));
      }
    }
  }

  function endSession() { setView('deck'); }

  function reorderDecks(newDecks) {
    persist({ ...data, decks: newDecks });
  }

  function saveDeck(deck) {
    persist({ ...data, decks: [...data.decks, deck] });
    setActiveDeckId(deck.id);
    setView('deck');
  }

  function saveCard(card) {
    persist({
      ...data,
      cards: [...data.cards, card],
      cardsAddedByUser: (data.cardsAddedByUser || 0) + 1,
    });
  }

  function updateCard(updatedCard) {
    persist({ ...data, cards: data.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)) });
    setEditingCardId(null);
    setView('deck');
  }

  function updateDeck(updatedDeck) {
    persist({ ...data, decks: data.decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)) });
    setView('deck');
  }

  async function deleteCard(id) {
    const card = data.cards.find((c) => c.id === id);
    if (card?.hasImage) await removeCardImage(id);
    persist({ ...data, cards: data.cards.filter((c) => c.id !== id) });
  }

  async function deleteDeck() {
    const cardsToRemove = data.cards.filter((c) => c.deckId === activeDeckId);
    await Promise.all(cardsToRemove.filter((c) => c.hasImage).map((c) => removeCardImage(c.id)));
    persist({
      ...data,
      decks: data.decks.filter((d) => d.id !== activeDeckId),
      cards: data.cards.filter((c) => c.deckId !== activeDeckId),
    });
    backHome();
  }

  const vocabBtnRef = useRef(null);
  const speakBtnRef = useRef(null);
  const readBtnRef = useRef(null);
  const highlightRef = useRef(null);

  useLayoutEffect(() => {
    const btn =
      mode === 'vocabulary' ? vocabBtnRef.current :
      mode === 'speaking'   ? speakBtnRef.current :
                              readBtnRef.current;
    const highlight = highlightRef.current;
    if (!btn || !highlight) return;
    highlight.style.left = btn.offsetLeft + 'px';
    highlight.style.width = btn.offsetWidth + 'px';
  }, [mode]);

  function switchMode(m) {
    setMode(m);
    localStorage.setItem('srs-active-mode', m);
  }

  function openGuide() {
    setPreviousLocation({ mode, view });
    setView('guide');
  }

  function closeGuide() {
    if (previousLocation) {
      if (previousLocation.mode !== mode) switchMode(previousLocation.mode);
      setView(previousLocation.view);
      setPreviousLocation(null);
    } else {
      setView('home');
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="srs-root">
      <ThemeStyles />
      <div className="srs-content">
        <div className="srs-main">
        {/* Mode switcher */}
        <div className="mode-switcher-band">
          <span className="mode-hairline-l" />
          <div className="mode-switcher-track">
            <span className="mode-switcher-highlight" ref={highlightRef} />
            <button
              ref={vocabBtnRef}
              className="mode-opt"
              style={{ color: mode === 'vocabulary' ? 'var(--ink)' : undefined }}
              onClick={() => switchMode('vocabulary')}
            >
              vocabulary
            </button>
            <span className="mode-dot" aria-hidden="true">·</span>
            <button
              ref={speakBtnRef}
              className="mode-opt"
              style={{ color: mode === 'speaking' ? 'var(--ink)' : undefined }}
              onClick={() => switchMode('speaking')}
            >
              speaking
            </button>
            <span className="mode-dot" aria-hidden="true">·</span>
            <button
              ref={readBtnRef}
              className="mode-opt"
              style={{ color: mode === 'reading' ? 'var(--ink)' : undefined }}
              onClick={() => switchMode('reading')}
            >
              reading
            </button>
          </div>
          <span className="mode-hairline-r" />
        </div>

        {view === 'guide' ? (
        <GuideView onBack={closeGuide} />
      ) : mode === 'reading' ? <ReadingView /> : mode === 'speaking' ? <SpeakingView /> : (
        <>
        {view === 'home' && (
          <HomeView data={data} onOpenDeck={openDeck} onNewDeck={() => setView('addDeck')} onReorderDecks={reorderDecks} onOpenGuide={openGuide} />
        )}
        {view === 'deck' && activeDeck && (
          <DeckView
            deck={activeDeck}
            cards={deckCards}
            onBack={backHome}
            onStartReview={startReview}
            onAddCard={() => setView('addCard')}
            onEditCard={(id) => { setEditingCardId(id); setView('editCard'); }}
            onDeleteCard={deleteCard}
            onDeleteDeck={deleteDeck}
            onEditDeck={() => setView('editDeck')}
          />
        )}
        {view === 'review' && (
          <ReviewView queue={reviewQueue} onRate={rateCard} onEnd={endSession} sessionStats={sessionStats} />
        )}
        {view === 'addDeck' && (
          <DeckForm onSave={saveDeck} onCancel={backHome} />
        )}
        {view === 'editDeck' && activeDeck && (
          <DeckForm initialDeck={activeDeck} onSave={updateDeck} onCancel={() => setView('deck')} />
        )}
        {view === 'addCard' && activeDeck && (
          <CardForm
            deck={activeDeck}
            onSave={saveCard}
            onCancel={() => setView('deck')}
            userAddedCount={data.cardsAddedByUser || 0}
          />
        )}
        {view === 'editCard' && activeDeck && editingCardId && (
          <CardForm
            deck={activeDeck}
            existingCard={data.cards.find((c) => c.id === editingCardId)}
            onSave={updateCard}
            onCancel={() => { setEditingCardId(null); setView('deck'); }}
          />
        )}
        </>
        )}
        </div>
        {view !== 'guide' && (
          <PageFooter onGuideClick={openGuide} onFeedbackClick={() => setFeedbackOpen(true)} />
        )}
      </div>
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
