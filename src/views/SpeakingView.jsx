import { useState, useEffect, useRef } from 'react';
import { Feather } from 'lucide-react';
import { topicsA1A2, topicsB1B2 } from '../speaking/topics';
import { pickTopic } from '../speaking/randomizer';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function playChime(ctx) {
  try {
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'triangle';
    osc1.frequency.value = 660;
    gain1.gain.setValueAtTime(0.12, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
    osc1.start(t);
    osc1.stop(t + 2.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'triangle';
    osc2.frequency.value = 990;
    gain2.gain.setValueAtTime(0.072, t);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
    osc2.start(t);
    osc2.stop(t + 2.6);

    osc2.onended = () => ctx.close();
  } catch {}
}

// 12 intermediate steps; durations slow toward the end so the wheel feels like it's coming to rest
const SHUFFLE_TIMINGS = [130, 145, 155, 160, 165, 175, 185, 205, 235, 270, 330, 380];

export default function SpeakingView() {
  const [level, setLevel] = useState('a1a2');

  const [duration, setDuration] = useState(() => {
    const saved = localStorage.getItem('srs-prep-duration');
    return saved ? Number(saved) : 60;
  });

  const [speakingDuration, setSpeakingDuration] = useState(() => {
    const saved = localStorage.getItem('srs-speaking-duration');
    return saved !== null ? Number(saved) : 120;
  });

  const [displayTopic, setDisplayTopic] = useState(null);
  const [topicKey, setTopicKey] = useState(0);
  const [shuffleStep, setShuffleStep] = useState(0);
  const [shuffling, setShuffling] = useState(false);

  // phase: 'empty' | 'ready' | 'running' | 'done'
  const [phase, setPhase] = useState('empty');
  // timerPhase: 'prep' | 'speaking'
  const [timerPhase, setTimerPhase] = useState('prep');
  // transitioning: true during the 500ms crossfade between prep and speaking
  const [transitioning, setTransitioning] = useState(false);

  const [timeLeft, setTimeLeft] = useState(60);
  const [showDrawAnother, setShowDrawAnother] = useState(false);

  const audioCtxRef = useRef(null);
  const shuffleTimeoutsRef = useRef([]);
  const transitionTimeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('srs-prep-duration', duration);
  }, [duration]);

  useEffect(() => {
    localStorage.setItem('srs-speaking-duration', speakingDuration);
  }, [speakingDuration]);

  const currentTopics = level === 'a1a2' ? topicsA1A2 : topicsB1B2;
  const isEmptyBank = currentTopics.length === 0;

  useEffect(() => {
    return () => {
      shuffleTimeoutsRef.current.forEach(clearTimeout);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  // Timer countdown — paused during phase crossfade
  useEffect(() => {
    if (phase !== 'running' || transitioning) return;
    const id = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, transitioning]);

  // Detect timer completion
  useEffect(() => {
    if (phase !== 'running' || transitioning || timeLeft !== 0) return;

    if (audioCtxRef.current) {
      playChime(audioCtxRef.current);
      audioCtxRef.current = null;
    }

    if (timerPhase === 'prep' && speakingDuration > 0) {
      // Begin crossfade into speaking phase
      setTransitioning(true);
      setTimeLeft(speakingDuration);
      transitionTimeoutRef.current = setTimeout(() => {
        transitionTimeoutRef.current = null;
        try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
        setTimerPhase('speaking');
        setTransitioning(false);
      }, 500);
    } else {
      setPhase('done');
    }
  }, [timeLeft, phase, timerPhase, transitioning, speakingDuration]);

  // Reveal "Draw another" after chime fades (matches 2.5s chime duration)
  useEffect(() => {
    if (phase === 'done') {
      const id = setTimeout(() => setShowDrawAnother(true), 2500);
      return () => clearTimeout(id);
    } else {
      setShowDrawAnother(false);
    }
  }, [phase]);

  function runShuffle(finalTopic, bank) {
    shuffleTimeoutsRef.current.forEach(clearTimeout);
    shuffleTimeoutsRef.current = [];
    setShuffling(true);

    let elapsed = 0;
    SHUFFLE_TIMINGS.forEach((delay, i) => {
      elapsed += delay;
      const isLast = i === SHUFFLE_TIMINGS.length - 1;
      const id = setTimeout(() => {
        if (isLast) {
          setDisplayTopic(finalTopic);
          setTopicKey((k) => k + 1);
          setShuffling(false);
        } else {
          const others = bank.filter((t) => t !== finalTopic);
          const pool = others.length > 0 ? others : bank;
          setDisplayTopic(pool[Math.floor(Math.random() * pool.length)]);
          setShuffleStep((s) => s + 1);
        }
      }, elapsed);
      shuffleTimeoutsRef.current.push(id);
    });
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();

      const topics = level === 'a1a2' ? topicsA1A2 : topicsB1B2;
      const isEmpty = topics.length === 0;

      if (phase === 'empty') {
        if (isEmpty) return;
        const final = pickTopic(topics, level);
        setPhase('ready');
        runShuffle(final, topics);
      } else if (phase === 'ready') {
        if (shuffling) return;
        try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
        setTimerPhase('prep');
        setTimeLeft(duration);
        setPhase('running');
      } else if (phase === 'running') {
        // intentionally blocked during countdown
      } else if (phase === 'done') {
        if (isEmpty) return;
        const final = pickTopic(topics, level);
        setTimerPhase('prep');
        setPhase('ready');
        setTimeLeft(duration);
        runShuffle(final, topics);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, level, duration, shuffling]);

  function drawTopic() {
    if (isEmptyBank) return;
    const final = pickTopic(currentTopics, level);
    setPhase('ready');
    runShuffle(final, currentTopics);
  }

  function startTimerFn() {
    try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    setTimerPhase('prep');
    setTimeLeft(duration);
    setTransitioning(false);
    setPhase('running');
  }

  function stopTimer() {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    setPhase('ready');
    setTimerPhase('prep');
    setTransitioning(false);
    setTimeLeft(duration);
  }

  function drawAnother() {
    if (isEmptyBank) return;
    const final = pickTopic(currentTopics, level);
    setTimerPhase('prep');
    setPhase('ready');
    setTimeLeft(duration);
    runShuffle(final, currentTopics);
  }

  function selectLevel(l) {
    if (phase === 'running') return;
    setLevel(l);
    setDisplayTopic(null);
    setPhase('empty');
  }

  const timerRunning = phase === 'running';

  let hintText = 'Enter to draw';
  if (phase === 'ready') hintText = shuffling ? ' ' : 'Enter to start';
  if (phase === 'running') hintText = ' ';
  if (phase === 'done') hintText = 'Enter to draw another';

  return (
    <div className="max-w-xl mx-auto px-6 py-12 fade-up">
      {/* Header */}
      <header className="mb-10 text-center">
        <div className="ornament mb-4"
             style={{ fontStyle: 'italic', fontWeight: 400, fontSize: 15, letterSpacing: '0.06em' }}>
          «think aloud»
        </div>
        <h1 className="display text-4xl mb-2">Speaking Practice</h1>
        <p className="italic" style={{ color: 'var(--ink-soft)', fontSize: 15 }}>
          Draw a topic, set your timer, speak
        </p>
      </header>

      <div className="divider-flourish mb-8">
        <hr />
        <Feather size={14} />
        <hr />
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-5 mb-8">

        {/* Level */}
        <div className="text-center">
          <div
            className="mono mb-2"
            style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            Level
          </div>
          <div className="flex gap-4 items-center">
            {[['a1a2', 'A1–A2'], ['b1b2', 'B1–B2']].map(([key, label]) => (
              <button
                key={key}
                className={`mode-opt${level === key ? ' active' : ''}`}
                disabled={timerRunning}
                onClick={() => selectLevel(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Preparation duration */}
        <div className="text-center">
          <div
            className="mono mb-2"
            style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.12em' }}
          >
            Preparation time
          </div>
          <div className="flex gap-4 items-center">
            {[[30, '30s'], [60, '1m'], [120, '2m'], [180, '3m']].map(([secs, label]) => (
              <button
                key={secs}
                className={`mode-opt${duration === secs ? ' active' : ''}`}
                disabled={timerRunning}
                onClick={() => setDuration(secs)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Speaking duration */}
        <div className="text-center">
          <div
            className="mono mb-2"
            style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.12em' }}
          >
            Speaking time
          </div>
          <div className="flex gap-2 items-center">
            {[[0, '–'], [60, '1m'], [120, '2m'], [180, '3m'], [300, '5m']].map(([secs, label]) => (
              <button
                key={secs}
                className={`mode-opt${speakingDuration === secs ? ' active' : ''}`}
                disabled={timerRunning}
                onClick={() => setSpeakingDuration(secs)}
                style={{ padding: '4px 6px' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Topic card */}
      <div
        className="paper-card mb-6"
        style={{
          padding: '32px 36px',
          minHeight: 160,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        {isEmptyBank ? (
          <p className="italic" style={{ color: 'var(--ink-soft)', fontSize: 15 }}>
            Yakında — more topics coming soon
          </p>
        ) : !displayTopic ? (
          <p className="italic" style={{ color: 'var(--ink-soft)', fontSize: 15 }}>
            Press "Draw a topic" to begin
          </p>
        ) : (
          <div
            key={shuffling ? `shuffle-${shuffleStep}` : `topic-${topicKey}`}
            className={shuffling ? 'shuffle-in' : 'fade-up'}
            style={{ width: '100%' }}
          >
            <div
              className="ornament mono block text-center mb-3"
              style={{ fontSize: 10, letterSpacing: '0.4em' }}
            >
              · TOPIC ·
            </div>
            <p style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.65, fontFamily: "'Fraunces', Georgia, serif" }}>
              {displayTopic}
            </p>
          </div>
        )}
      </div>

      {/* Timer display */}
      {(phase === 'running' || phase === 'done') && (
        <div className="text-center mb-6">
          {phase === 'running' && (
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--ink-faint)',
                letterSpacing: '0.12em',
                marginBottom: 8,
                opacity: transitioning ? 0 : 1,
                transition: 'opacity 0.25s ease',
              }}
            >
              · {timerPhase === 'prep' ? 'Preparation' : 'Speaking'} ·
            </div>
          )}
          <span
            className={`speaking-timer${phase === 'running' && !transitioning ? ' pulsing' : ''}`}
            style={{
              opacity: phase === 'done' ? 0 : 1,
              transition: phase === 'done' ? 'opacity 2.5s ease' : 'none',
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-3 mb-4">
        {(phase === 'empty' || phase === 'ready') && (
          <button
            className={`btn ${phase === 'ready' ? 'btn-ghost' : 'btn-primary'}`}
            disabled={isEmptyBank || shuffling}
            onClick={drawTopic}
            style={{ padding: '11px 24px', borderRadius: 3, fontSize: 14 }}
          >
            Draw a topic
          </button>
        )}
        {phase === 'ready' && (
          <button
            className="btn btn-primary"
            onClick={startTimerFn}
            disabled={shuffling}
            style={{ padding: '11px 24px', borderRadius: 3, fontSize: 14 }}
          >
            Start timer
          </button>
        )}
        {phase === 'running' && (
          <button
            className="btn btn-ghost"
            onClick={stopTimer}
            style={{ padding: '11px 24px', borderRadius: 3, fontSize: 14 }}
          >
            Stop
          </button>
        )}
        {phase === 'done' && (
          <button
            className="btn btn-primary"
            onClick={drawAnother}
            style={{
              padding: '11px 24px',
              borderRadius: 3,
              fontSize: 14,
              opacity: showDrawAnother ? 1 : 0,
              transition: 'opacity 0.4s ease',
              pointerEvents: showDrawAnother ? 'auto' : 'none',
            }}
          >
            Draw another
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="mono text-center" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
        {hintText}
      </p>
    </div>
  );
}
