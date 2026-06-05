import Wordmark from '../components/Wordmark';

export default function GuideView({ onBack }) {
  return (
    <div className="guide-view fade-up">
      <div className="guide-body">

        {/* Back link */}
        <div className="guide-back-row">
          <button className="guide-back-btn" onClick={onBack}>Back</button>
        </div>

        {/* Logo */}
        <Wordmark onClick={onBack} />

        {/* Title */}
        <h1 className="guide-title">Guide</h1>

        {/* Introduction */}
        <p className="guide-intro">
          A short tour of Lexicon — how it works, what each part does, and where to find
          everything. Read from top to bottom, or jump to whatever section you need.
        </p>

        {/* Section: Welcome */}
        <section className="guide-section">
          <h2 className="guide-heading">Welcome</h2>
          <p>
            Lexicon is a quiet place to learn a language and live with it a while. Whether
            you are starting a new language from nothing, building specialised vocabulary in
            a field you already know, reading your first real articles in another tongue, or
            simply keeping older words from slipping away, the idea is the same: a small
            collection of words and texts, returned to you at the right moments, held in your
            hands and no one else's.
          </p>
          <p>
            Lexicon began as a notebook for one teacher's students and is meant to be useful
            to anyone, in any language, doing the same patient work. You will find no streaks,
            no badges, no points, and nothing to perform — only your words, your texts, and
            the time you give them. Nothing here is sent across any network, and there is no
            account to create for now.
          </p>
          <p>
            The words you add live in this browser, on this device, and nowhere else.
          </p>
          <p>
            Lexicon is tended often — small improvements arrive almost daily, and there is
            more on the way. What follows is a tour of what it can do today.
          </p>
        </section>

        {/* Section: Adding words */}
        <section className="guide-section">
          <h2 className="guide-heading">Adding words</h2>
          <p>
            To create a card, open a deck and click <strong>Add card</strong> — or press{' '}
            <strong>N</strong>. The form asks for two things: the front, which carries the
            word or phrase you are learning, and the back, its meaning in whatever language
            is most useful to you. Those two fields are all that is required.
          </p>
          <p>
            Three optional fields sit beneath. The example sentence places the word inside a
            fragment of real language, which is often the most useful addition of all. The
            notes field is good for grammatical reminders, mnemonics, or word families that
            help a card take root. And you may attach an image, which can anchor a concrete
            noun or give an abstract word something to hold on to.
          </p>
          <p>
            Once you save, the form clears. Each card is its own self-contained slip of
            paper; the form carries nothing forward into the next one.
          </p>
        </section>

        {/* Section: Reviewing cards */}
        <section className="guide-section">
          <h2 className="guide-heading">Reviewing cards</h2>
          <p>
            When you open a deck and begin a session, each card is shown face-down. Recall
            what you can, then reveal the answer and ask yourself honestly how well you
            remembered. Your rating tells Lexicon how long to wait before showing you that
            card again.
          </p>
          <p>
            There are four ratings. <strong>Again</strong> means you had forgotten — the
            card returns soon. <strong>Hard</strong> means you found it, but with effort.{' '}
            <strong>Good</strong> means you got there; it may have taken a moment, but the
            answer came. <strong>Easy</strong> is a special option, that exists for very
            special occasions. We don't recommend clicking on it unless the word is very
            similar to one in your native language (e.g. bureaucracy in English and
            bureaucratie in French). The intervals for '<strong>Easy</strong>' are much
            longer than for any other option — you might not see the word again for quite a
            while if you click on '<strong>Easy</strong>'.
          </p>
          <p>
            The interval between reviews grows with each honest answer: a few days, then a
            week, then months. The scheduler is patient, and it is honest with you — if you
            press <strong>Good</strong> when you truly struggled, the interval stretches
            further than it should, and the card will feel harder the next time you meet it.
            Being truthful with yourself — pressing <strong>Again</strong> when the answer
            did not come — is how the whole thing works. Forgetting is treated gently here: a
            lapse is a partial step back, never a return to the very beginning.
          </p>
          <p>
            You can review in either direction, too — from the word to its meaning, or from
            the meaning back to the word — whichever way your memory needs the exercise.
          </p>
        </section>

        {/* Section: Organising decks */}
        <section className="guide-section">
          <h2 className="guide-heading">Organising decks</h2>
          <p>
            To create a deck, click <strong>New deck</strong> and give it a name. You may add
            a description and a language label if you like; both are optional.
          </p>
          <p>
            To rename or edit a deck, open it and click the small pencil near the title. To
            reorder your decks, drag and drop them on the home page into whatever arrangement
            suits you. To delete a deck, open it and scroll to the bottom.
          </p>
          <p>
            Decks can be arranged however your thinking runs — by language, by chapter, by
            theme, by period of study. There are no rules. Organise them in a way that feels
            natural to you.
          </p>
        </section>

        {/* Section: Reading */}
        <section className="guide-section">
          <h2 className="guide-heading">Reading</h2>
          <p>
            Lexicon is not only for words in isolation; it is also a place to read. Open the
            reading section from the top of any page, and you can bring in a text of your own
            — paste it directly, or give Lexicon a web address and let it fetch the article
            for you. Your texts gather into a small library, each showing how far through it
            you have read.
          </p>
          <p>
            While you read, tap or click any word you do not know, and a panel rises with its
            meaning — a dictionary form, a translation, definitions where they exist. Select a
            longer phrase and the whole fragment is translated for you. Any word worth keeping
            can be saved straight into a deck with a single tap, so the things you meet while
            reading become the things you study later. This is the quiet heart of Lexicon's
            idea: that reading and remembering are not separate activities but one continuous
            motion.
          </p>
          <p>
            Reading works as well in the hand as at the desk — on a phone, the translation
            panel rises gently from the bottom; on a wider screen, it rests at the side. You
            can adjust the text size, the margins, and the line spacing to whatever is
            comfortable, and your place is kept as you go.
          </p>
          <p>
            Your reading library can be arranged just as your decks can — drag your texts into
            whatever order suits you.
          </p>
        </section>

        {/* Section: Sharing a text */}
        <section className="guide-section">
          <h2 className="guide-heading">Sharing a text</h2>
          <p>
            Any text you have brought into Lexicon can be shared. Open it and choose to share,
            and Lexicon creates a private web address for that text alone — a single page
            anyone can open and read, with the same tap-to-translate panel and the option to
            save it into their own library. It is a gentle way to hand a reading to a student,
            or a friend, without handing over anything else.
          </p>
        </section>

        {/* Section: Speaking practice */}
        <section className="guide-section">
          <h2 className="guide-heading">Speaking practice</h2>
          <p>
            The speaking section — reached from the top of the page — is a different kind of
            work. No cards, no ratings. Instead, Lexicon draws a topic at random and gives you
            time to gather your thoughts before a speaking timer begins.
          </p>
          <p>
            You choose between two levels: A1–A2, for everyday vocabulary and shorter answers,
            and B1–B2, for more nuanced topics and freer expression. A preparation window runs
            first — a short interval whose length you set — during which you gather what you
            want to say. Then the speaking timer counts down.
          </p>
          <p>
            When it ends, you may draw a new topic or stop. Lexicon is a quiet companion here,
            not a tutor: it does not listen, and it does not judge. What matters is that you
            speak aloud — the act of forming sentences in the air is what builds the habit of
            speaking.
          </p>
        </section>

        {/* Section: Keeping and moving your words */}
        <section className="guide-section">
          <h2 className="guide-heading">Keeping and moving your words</h2>
          <p>
            Everything you create in Lexicon — your decks, your cards, your texts, your whole
            reading and learning history — lives only in this browser, on this device. It is
            never sent to a server. It is yours alone.
          </p>
          <p>
            Because of that, Lexicon gives you ways to hold on to your work and carry it
            between your devices. From <strong>Settings</strong>, you can create a full{' '}
            <strong>backup</strong> of your entire library — every deck, card, image, and text
            — saved to a single file you can keep somewhere safe. You can restore from a{' '}
            <strong>backup</strong> at any time, and restoring is gentle: it brings your words
            back as fresh copies alongside whatever you already have, and never replaces or
            removes anything that is already there.
          </p>
          <p>
            You can also work at a smaller scale: from any deck, you can <strong>export</strong>{' '}
            the whole deck or hand-pick particular words, and <strong>import</strong> them into
            another deck — on the same device or a different one. A word's memory travels with
            it: a card that was due in sixty days arrives still due in sixty days, its patient
            schedule unbroken.
          </p>
          <p>
            If you ever clear your browser's storage without a <strong>backup</strong>, your
            words will be lost — so a <strong>backup</strong> now and then is a kindness to
            your future self.
          </p>
        </section>

        {/* Section: Keyboard shortcuts */}
        <section className="guide-section">
          <h2 className="guide-heading">Keyboard shortcuts</h2>
          <p>Most actions in Lexicon have a keyboard shortcut.</p>
          <table className="guide-shortcuts">
            <tbody>
              <tr>
                <td><kbd>Enter</kbd></td>
                <td>Start the next obvious action (begin a session, reveal a card, or draw a speaking topic)</td>
              </tr>
              <tr>
                <td><kbd>Space</kbd></td>
                <td>Reveal a card, or draw a new speaking topic</td>
              </tr>
              <tr>
                <td><kbd>N</kbd></td>
                <td>Add a new card (when inside an open deck)</td>
              </tr>
              <tr>
                <td><kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> / <kbd>4</kbd></td>
                <td>Rate the current card (Again, Hard, Good, Easy)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section: Languages */}
        <section className="guide-section">
          <h2 className="guide-heading">Languages</h2>
          <p>
            Lexicon's interface is in English for now. A language switcher is coming soon, to
            let you use Lexicon in English, Turkish, or Russian — one of several things being
            built as the project grows.
          </p>
        </section>

        {/* Closing flourish */}
        <div className="guide-closing">
          «Made with care, for those who collect words»
        </div>

        {/* Bottom back link */}
        <div className="guide-bottom-back">
          <button className="guide-back-btn" onClick={onBack}>Back to Lexicon</button>
        </div>

      </div>
    </div>
  );
}
