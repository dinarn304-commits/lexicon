export default function GuideView({ onBack }) {
  const LogoSvg = () => (
    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
      <path d="M 26,3 C 29,5 28,10 24,15 C 21,19 17,23 12,27 L 8,29 L 9,25 C 13,23 17,19 21,15 C 24,11 26,7 26,3 Z" fill="var(--terracotta)" />
      <line x1="9" y1="26" x2="24" y2="6" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <line x1="11" y1="22" x2="15" y2="24" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <line x1="14" y1="18" x2="18" y2="20" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <line x1="18" y1="13" x2="22" y2="15" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <line x1="21" y1="9" x2="25" y2="11" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );

  const Divider = () => (
    <div className="guide-divider" aria-hidden="true">· · ·</div>
  );

  return (
    <div className="guide-view fade-up">
      <div className="guide-body">

        {/* Back link */}
        <div className="guide-back-row">
          <button className="guide-back-btn" onClick={onBack}>« Back</button>
        </div>

        {/* Logo */}
        <button className="guide-logo-unit" onClick={onBack} aria-label="Back to Lexicon">
          <LogoSvg />
          <span className="logo-wordmark">Lexicon</span>
        </button>

        {/* Title */}
        <h1 className="guide-title">Guide</h1>

        {/* Introduction */}
        <p className="guide-intro">
          A short tour of Lexicon — how it works, what each part does, and where to find
          everything. Read from top to bottom, or jump to whatever section you need.
        </p>

        <Divider />

        {/* Section: Welcome */}
        <section className="guide-section">
          <h2 className="guide-heading">Welcome</h2>
          <p>
            Lexicon is a quiet tool for learning vocabulary. Whether you are working through
            a new language from the beginning, building specialised terminology in a field
            you know, or simply keeping older words fresh, the approach is the same: a small
            collection of cards, shown again at the right moment, held in your hands and no
            one else's.
          </p>
          <p>
            There is no account to create. Nothing in this app is sent over any network.
            The words you add here are stored only in this browser, on this device.
          </p>
          <p>
            Read on for a brief tour of what Lexicon can do — or close the guide and start.
          </p>
        </section>

        <Divider />

        {/* Section: Adding words */}
        <section className="guide-section">
          <h2 className="guide-heading">Adding words</h2>
          <p>
            To create a card, open a deck and click <strong>Add card</strong> — or press{' '}
            <strong>N</strong>. The form asks for two things: the front, which carries the
            word or phrase you are learning, and the back, its meaning in whatever language
            you find most useful. These two fields are all that is required.
          </p>
          <p>
            Three optional fields are available beneath. The <strong>example sentence</strong>{' '}
            places the word in a fragment of real language, often the most useful addition of
            all. The <strong>notes</strong> field is good for grammatical reminders, mnemonics,
            or word families that help a card stick. And you may attach an <strong>image</strong>,
            which can anchor concrete nouns or give an abstract word something to hold on to.
          </p>
          <p>
            Once you save, the form clears. Each card is its own self-contained piece of
            paper; the form carries nothing forward into the next one.
          </p>
        </section>

        <Divider />

        {/* Section: Reviewing cards */}
        <section className="guide-section">
          <h2 className="guide-heading">Reviewing cards</h2>
          <p>
            When you open a deck and begin a session, each card is shown face-down. Recall
            what you can, then reveal the answer and ask yourself honestly how well you
            remembered it. Your rating tells the app how long to wait before showing this
            card again.
          </p>
          <p>
            There are four ratings. <strong>Again</strong> means you had forgotten — the
            card will return soon, within the same session if it can. <strong>Hard</strong>{' '}
            means you found the word but with effort, or your memory was approximate.{' '}
            <strong>Good</strong> means you got there; it may have taken a moment, but the
            answer came. <strong>Easy</strong> means you knew it before you had quite
            finished reading the question.
          </p>
          <p>
            The interval between reviews grows with each honest response: a few days, then
            a week, then months. The algorithm is patient. It is also honest with you: if
            you press Good when you actually struggled, the interval stretches further than
            it should, and the card will feel harder the next time you meet it. Being
            truthful with yourself — pressing Again when the answer did not come — is how
            the system does its work.
          </p>
        </section>

        <Divider />

        {/* Section: Organising decks */}
        <section className="guide-section">
          <h2 className="guide-heading">Organising decks</h2>
          <p>
            To create a deck, click <strong>New deck</strong> and give it a name. You may
            add a description and a language label if you like; both are optional.
          </p>
          <p>
            To rename or edit a deck, open it and click the small pencil icon near the deck
            title. To reorder decks on the home page, drag and drop them into the position
            you prefer. To delete a deck, open it and scroll to the bottom of the page.
          </p>
          <p>
            Decks can be arranged in whatever way suits your thinking — by language, by
            chapter, by theme, by period of study. There are no rules. Organise them in a
            way that feels natural to you.
          </p>
        </section>

        <Divider />

        {/* Section: Speaking practice */}
        <section className="guide-section">
          <h2 className="guide-heading">Speaking practice</h2>
          <p>
            The speaking mode — reachable by clicking <strong>speaking</strong> at the top
            of the page — is a different kind of practice. No cards, no ratings. Instead,
            the app draws a topic at random and gives you time to prepare before a speaking
            timer begins.
          </p>
          <p>
            You choose between two levels: <strong>A1–A2</strong>, for everyday vocabulary
            and shorter responses, and <strong>B1–B2</strong>, for more nuanced topics and
            freer expression. A preparation window runs first — a short interval whose
            length you can set in the controls below the topic card — during which you
            gather your thoughts. Then the speaking timer counts down.
          </p>
          <p>
            When the timer ends, you may draw a new topic or stop. The app is a quiet
            companion here, not a tutor. It does not listen, and it does not evaluate.
            What matters is that you speak aloud — the act of forming sentences in the
            air is what builds the habit of speaking.
          </p>
        </section>

        <Divider />

        {/* Section: Keyboard shortcuts */}
        <section className="guide-section">
          <h2 className="guide-heading">Keyboard shortcuts</h2>
          <p>Most actions in Lexicon have a keyboard shortcut:</p>
          <table className="guide-shortcuts">
            <tbody>
              <tr>
                <td><kbd>Enter</kbd></td>
                <td>Start the next obvious action — begin a session, reveal a card, or draw a speaking topic</td>
              </tr>
              <tr>
                <td><kbd>Space</kbd></td>
                <td>Reveal a card or draw a new speaking topic</td>
              </tr>
              <tr>
                <td><kbd>N</kbd></td>
                <td>Add a new card (when inside an open deck)</td>
              </tr>
              <tr>
                <td><kbd>1</kbd></td>
                <td>Rate the current card: Again</td>
              </tr>
              <tr>
                <td><kbd>2</kbd></td>
                <td>Rate the current card: Hard</td>
              </tr>
              <tr>
                <td><kbd>3</kbd></td>
                <td>Rate the current card: Good</td>
              </tr>
              <tr>
                <td><kbd>4</kbd></td>
                <td>Rate the current card: Easy</td>
              </tr>
            </tbody>
          </table>
        </section>

        <Divider />

        {/* Section: Languages */}
        <section className="guide-section">
          <h2 className="guide-heading">Languages</h2>
          <p>
            A language switcher will soon allow you to use Lexicon in English, Turkish,
            or Russian. This is in progress; for now, the interface is in English.
          </p>
        </section>

        <Divider />

        {/* Section: Your data */}
        <section className="guide-section">
          <h2 className="guide-heading">Your data</h2>
          <p>
            Everything you create in Lexicon — your decks, your cards, your learning
            history — lives only in your browser, on your device. It is never sent to a
            server. Anthropic does not have it. The author of Lexicon does not have it.
          </p>
          <p>
            If you clear your browser's local storage, your decks and cards will be lost.
            An export feature is on the way: it will let you save your data as a plain
            file and restore it whenever you like. Until then, this browser is the only
            place your words live.
          </p>
        </section>

        {/* Closing flourish */}
        <div className="guide-closing">
          « Made with care, for those who collect words. »
        </div>

        {/* Bottom back link */}
        <div className="guide-bottom-back">
          <button className="guide-back-btn" onClick={onBack}>« Back to Lexicon</button>
        </div>

      </div>
    </div>
  );
}
