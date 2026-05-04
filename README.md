# DeckGrab

> Yank any Quizlet set into plain text. Free. Open source. No login.

**[deckgrab.pages.dev](https://deckgrab.pages.dev/)**

A one-click bookmarklet that exports any Quizlet set as TSV, CSV, JSON, or Anki — straight from your authenticated browser session, with no scraping server in the middle.

## Why?

- Quizlet removed bulk export. You wrote your cards. They should be portable.
- Your data should travel with you to Anki, StudyDeck, Google Sheets, anywhere.
- No login. No scraping API. Runs entirely in your browser.

## How it works

1. **Drag the "⭐ Grab cards" pill** from the homepage to your bookmarks bar.
2. **Open any Quizlet set page** (`quizlet.com/<id>/<title>`).
3. **Click the bookmark.** It scrapes the page in your authenticated session, copies the cards to your clipboard as TSV, and opens DeckGrab so you can pick a format.

The scraper tries (in order):
- Quizlet's `__NEXT_DATA__` JSON blob
- Inline `<script>` regex matching for known card-shape JSON
- DOM containers with class names matching `term`/`card`/`flashcard`
- Per-container `innerText` newline-split fallback (handles obfuscated class names)
- A last-resort generic scan of `div`/`li`/`article` siblings

## Export formats

- **TSV** — paste into Quizlet (yes, it supports import via TSV), Anki, Google Sheets
- **CSV** — for spreadsheets and most flashcard apps
- **Anki CSV** — comma-separated, no header, ready for File → Import in Anki
- **JSON** — for programmatic use
- **StudyDeck** — one-click handoff to [studydeck.pages.dev](https://studydeck.pages.dev/) (free flashcard app — also open source)

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
