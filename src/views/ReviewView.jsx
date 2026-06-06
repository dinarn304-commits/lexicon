import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { isDue, applyRating } from '../algorithm/scheduler';
import { loadCardImage } from '../storage/images';
import { previewInterval } from '../utils/interval';
import SpeakerButton from '../components/SpeakerButton';

export default function ReviewView({ data, direction = 'forward', onPersistCard }) {
  const { deckSlug } = useParams();
  const navigate = useNavigate();

  const deck = data.decks.find((d) => d.slug === deckSlug);
  const deckCards = deck ? data.cards.filter((c) => c.deckId === deck.id) : [];

  const [reviewQueue, setReviewQueue] = useState(() =>
    deck ? deckCards.filter(isDue).sort(() => Math.random() - 0.5) : []
  );
  const [sessionStats, setSessionStats] = useState({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });
  const [revealed, setRevealed] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    document.title = deck ? `Lexicon · Reviewing ${deck.name}` : 'Lexicon';
  }, [deck?.name]);

  useEffect(() => {
    if (!deck) return;
    if (reviewQueue.length === 0 && sessionStats.total === 0) {
      navigate(`/vocabulary/${deckSlug}`, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const card = reviewQueue[0];

  useEffect(() => { setRevealed(false); }, [card?.id]);

  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!revealed) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRevealed(true); }
      } else {
        if (e.key === '1') rateCard(1);
        else if (e.key === '2') rateCard(3);
        else if (e.key === '3') rateCard(4);
        else if (e.key === '4') rateCard(5);
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rateCard(4); }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, reviewQueue]);

  useEffect(() => {
    setImageSrc(null);
    if (!card || !card.hasImage) return;
    let cancelled = false;
    loadCardImage(card.id).then((url) => {
      if (!cancelled) setImageSrc(url);
    });
    return () => { cancelled = true; };
  }, [card?.id]);

  function rateCard(quality) {
    const current = reviewQueue[0];
    if (!current) return;
    const updated = applyRating(current, quality);
    onPersistCard(updated);

    const key = quality === 1 ? 'again' : quality === 3 ? 'hard' : quality === 4 ? 'good' : 'easy';
    setSessionStats((s) => ({ ...s, total: s.total + 1, [key]: s[key] + 1 }));

    if (quality === 1) {
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

  if (!card) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center fade-up">
        <div className="ornament text-xs mb-4">· · ·</div>
        <Sparkles size={28} style={{ color: 'var(--terracotta)', margin: '0 auto 16px' }} />
        <h1 className="display text-4xl mb-3">Session complete</h1>
        <p className="italic text-lg mb-2" style={{ color: 'var(--ink-soft)' }}>
          You reviewed {sessionStats.total} card{sessionStats.total === 1 ? '' : 's'}.
        </p>
        <p className="mono text-sm mb-10" style={{ color: 'var(--ink-faint)' }}>
          {sessionStats.again} again · {sessionStats.hard} hard · {sessionStats.good} good · {sessionStats.easy} easy
        </p>
        <Link className="btn btn-primary px-6 py-3" to={`/vocabulary/${deckSlug}`}>Return to deck</Link>
      </div>
    );
  }

  const ratings = [
    { label: 'Again', quality: 1, interval: previewInterval(card, 1) },
    { label: 'Hard',  quality: 3, interval: previewInterval(card, 3) },
    { label: 'Good',  quality: 4, interval: previewInterval(card, 4) },
    { label: 'Easy',  quality: 5, interval: previewInterval(card, 5) },
  ];

  const isReverse = direction === 'reverse';
  const promptLabel = isReverse ? '· MEANING ·' : '· WORD ·';
  const promptText  = isReverse ? card.back     : card.front;
  const answerLabel = isReverse ? '· WORD ·'    : '· MEANING ·';
  const answerText  = isReverse ? card.front    : card.back;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 fade-up">
      <div className="flex items-center justify-between mb-8">
        <Link className="btn btn-quiet text-sm flex items-center gap-1" to={`/vocabulary/${deckSlug}`}>
          <ChevronLeft size={16} /> End session
        </Link>
        <div className="mono text-xs" style={{ color: 'var(--ink-soft)' }}>
          {reviewQueue.length} remaining
        </div>
      </div>

      <div className="flashcard p-12 mb-6" onClick={() => !revealed && setRevealed(true)}>
        <SpeakerButton text={card.front} language={deck.language} className="review-card-speaker" size={24} />
        <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 280 }}>
          <div className="ornament text-xs mb-6">{promptLabel}</div>
          <div className="display text-5xl mb-4" style={{ lineHeight: 1.15 }}>
            {promptText}
          </div>
          {isReverse && imageSrc && (
            <div className="image-frame review mt-4">
              <img src={imageSrc} alt="" />
            </div>
          )}
          {revealed ? (
            <>
              <div className="my-4 flex items-center gap-3" style={{ width: '100%', maxWidth: '200px' }}>
                <hr style={{ flex: 1, borderColor: 'var(--rule)' }} />
                <span className="ornament text-xs">❧</span>
                <hr style={{ flex: 1, borderColor: 'var(--rule)' }} />
              </div>
              <div className="ornament text-xs mb-4">{answerLabel}</div>
              <div className="display text-5xl mb-4" style={{ lineHeight: 1.15 }}>
                {answerText}
              </div>
              {!isReverse && imageSrc && (
                <div className="image-frame review mt-4 fade-up">
                  <img src={imageSrc} alt="" />
                </div>
              )}
              {card.example && (
                <div className="italic mt-4 max-w-md" style={{ color: 'var(--ink-soft)' }}>
                  "{card.example}"
                </div>
              )}
              {card.notes && (
                <div className="mono text-xs mt-4 px-3 py-1 rounded" style={{ background: 'var(--rule-soft)', color: 'var(--ink-soft)' }}>
                  {card.notes}
                </div>
              )}
            </>
          ) : (
            <div className="mt-8 text-sm italic" style={{ color: 'var(--ink-faint)' }}>
              Click to reveal
            </div>
          )}
        </div>
      </div>

      {revealed && (
        <>
          <div className="grid grid-cols-4 gap-2 fade-up">
            {ratings.map((r) => (
              <button key={r.label} className="rate-btn" onClick={() => rateCard(r.quality)}>
                <div className="label">{r.label}</div>
                <div className="interval">{r.interval}</div>
              </button>
            ))}
          </div>
          <p className="mono text-xs text-center mt-3" style={{ color: 'var(--ink-faint)' }}>
            1 again · 2 hard · 3 good · 4 easy · space for good
          </p>
        </>
      )}
    </div>
  );
}
