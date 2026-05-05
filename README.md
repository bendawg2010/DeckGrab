# DeckGrab

> Free flashcards. In your browser. No login.

**[deckgrab.pages.dev](https://deckgrab.pages.dev/)**

A free, open-source flashcard app. Drop the bookmarklet on your bookmarks bar, click it on any Quizlet set, and your cards land in DeckGrab — ready to study with ↑/←/→ or export as TSV, CSV, JSON, or Anki. Local-first, no signup, no scraping server in the middle.

## Features

- **Study mode** — flashcards with keyboard controls:
  - `↑` flip the card to reveal the definition
  - `↓` flip back
  - `←` previous card
  - `→` next card
  - `Space` toggle flip
  - `S` shuffle the deck
  - `R` restart from card 1
- **Cool yoink animation** when fresh cards arrive — flying card silhouettes converge on the counter as it ticks up
- **Multi-format export** — TSV, CSV (regular + Anki-flavored), JSON, hand-off to StudyDeck
- **Local-first** — every card is cached in `localStorage`, so you can refresh / come back later and pick up where you left off
- **Edit before exporting** — tap any card row to fix typos, swap term ↔ definition in one click, delete cards you don't need
- **Manual paste fallback** — if the clipboard handoff fails (Safari + private browsing), paste your TSV directly

## Import from Quizlet

The bookmarklet runs in your authenticated browser session — no scraping API, no man-in-the-middle. It tries (in order):

1. Quizlet's `__NEXT_DATA__` JSON blob
2. Inline `<script>` regex matching for known card-shape JSON
3. DOM containers with class names matching `term`/`card`/`flashcard`
4. Per-container `innerText` newline-split fallback (handles obfuscated class names)
5. A last-resort generic scan of `div`/`li`/`article` siblings

After scraping, it copies your cards to the clipboard as TSV and opens DeckGrab so you can study or export.

## Local dev

It's a static site. Open `index.html` directly, or:

```sh
npx serve .
```

## Deploy

Cloudflare Pages, single command:

```sh
npx wrangler pages deploy . --project-name=deckgrab --branch=main
```

## License

MIT. Use it, fork it, ship it.

## Tip jar

If this saved you an afternoon of retyping cards: [Cash App $Dryeetsolutions](https://cash.app/$Dryeetsolutions) · [GitHub Sponsors](https://github.com/sponsors/bendawg2010)
