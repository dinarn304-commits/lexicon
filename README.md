# Lexicon

A personal language-learning app built around spaced repetition — create decks, study flashcards, and track your progress over time.

**Live app:** https://lexicon-lingua.vercel.app

## What it does

- Create and manage vocabulary decks
- Study cards using a spaced repetition algorithm (the more you know a word, the less often it shows up)
- Speaking practice mode with randomised topics
- Works entirely in the browser — no account or server needed, data stays on your device

## Tech

Built with React and Vite, styled with Tailwind CSS. Deployed on Vercel.

## Development

```bash
npm run dev      # start local dev server at localhost:5173
npm run build    # build for production
```

To deploy changes: edit locally, test with `npm run dev`, then:

```bash
git add .
git commit -m "describe your change"
git push
```

Vercel picks up the push automatically and redeploys within about 30 seconds.
