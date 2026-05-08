/* ====================================================================
   DeckGrab — Free flashcards. Study them or export them.
   Vanilla JS / hash router / no dependencies.
==================================================================== */

(() => {
  // -------- The bookmarklet (auto-updating loader) ------------------
  // PRE-v1.5: the SCRAPER source was inlined here as a giant string and
  // URL-encoded into the bookmarklet's javascript: URL. Every change to
  // the scraper logic required users to re-drag a fresh bookmarklet to
  // their bookmarks bar.
  //
  // NOW: the bookmarklet is a tiny loader. It fetches the real scraper
  // code from deckgrab.pages.dev/scraper.js (or scraper-simple.js for
  // Safari) at click time and runs it via new Function(code). We deploy
  // a new scraper.js → every existing user gets it on their next click,
  // no re-install needed. The website serves these files with a short
  // 60s cache TTL via _headers so propagation is near-instant.
  //
  // The loader uses fetch() + new Function() rather than <script src>
  // injection because Quizlet's CSP could block external scripts but
  // generally allows fetch() of cross-origin resources. new Function()
  // evaluates the code in a fresh scope, which CSP usually permits for
  // bookmarklet-initiated execution.
  const SCRAPER_URL        = "https://deckgrab.pages.dev/scraper.js";
  const SCRAPER_SIMPLE_URL = "https://deckgrab.pages.dev/scraper-simple.js";

  const LOADER = "(async()=>{try{const r=await fetch('" + SCRAPER_URL +
    "?t='+Date.now());if(!r.ok)throw new Error('HTTP '+r.status);" +
    "new Function(await r.text())()}catch(e){alert('DeckGrab loader: '+e.message)}})();";

  const LOADER_SIMPLE = "(()=>{fetch('" + SCRAPER_SIMPLE_URL +
    "?t='+Date.now()).then(r=>r.text()).then(c=>new Function(c)())" +
    ".catch(e=>alert('DeckGrab loader: '+e.message))})();";

  const BOOKMARKLET        = "javascript:" + encodeURIComponent(LOADER);
  const BOOKMARKLET_SIMPLE = "javascript:" + encodeURIComponent(LOADER_SIMPLE);

  // -------- Tiny DOM helpers -----------------------------------------

  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") e.className = attrs[k];
        else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === "draggable") e.setAttribute("draggable", attrs[k] ? "true" : "false");
        else e.setAttribute(k, attrs[k]);
      }
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      if (Array.isArray(c)) for (const cc of c) e.appendChild(cc instanceof Node ? cc : document.createTextNode(String(cc)));
      else e.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return e;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function svgEl(tag, attrs) {
    const ns = "http://www.w3.org/2000/svg";
    const e = document.createElementNS(ns, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function makeLogoSvg() {
    const svg = svgEl("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none" });
    const arrow = svgEl("path", {
      d: "M5 6h10a3 3 0 013 3v3M5 6l4 4M5 6l4-4",
      stroke: "white", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round",
    });
    const card = svgEl("rect", {
      x: "11", y: "12", width: "9", height: "8", rx: "1.4",
      fill: "white",
    });
    svg.appendChild(arrow);
    svg.appendChild(card);
    return svg;
  }

  function toast(msg) {
    const t = el("div", { class: "dg-toast" }, msg);
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.transition = "opacity 0.2s, transform 0.2s";
      t.style.opacity = "0";
      t.style.transform = "translate(-50%, 20px)";
      setTimeout(() => t.remove(), 220);
    }, 1800);
  }


  // -------- Browser extension zone (best UX for desktop) -------------
  // Manifest-V3 extension that injects a floating "Yoink to DeckGrab"
  // button on every Quizlet set page. One click → cards land in
  // DeckGrab via URL fragment. Same scrape logic as the bookmarklet
  // (NEXT_DATA walk + regex + DOM fallback). No bot detection
  // because it runs inside the user's own browser.

  function makeExtensionZone() {
    const grid = el("div", { class: "dg-ext-grid" });

    grid.appendChild(el("div", { class: "dg-ext-step" },
      el("div", { class: "dg-ext-num" }, "1"),
      el("div", { class: "dg-ext-step-name" }, "Download the extension"),
      el("p", null,
        "It's a tiny ", el("code", null, "deckgrab-extension.zip"),
        " (~14 KB). Same flashcard scraping power as the bookmarklet, no install dance.",
      ),
      el("a", {
        class: "dg-ext-dl-btn",
        href: "/deckgrab-extension.zip",
        download: "deckgrab-extension.zip",
      }, "↓ Download deckgrab-extension.zip"),
    ));

    grid.appendChild(el("div", { class: "dg-ext-step" },
      el("div", { class: "dg-ext-num" }, "2"),
      el("div", { class: "dg-ext-step-name" }, "Unzip + load it"),
      el("p", null,
        "Double-click the zip to unzip — you get a ", el("strong", null, "deckgrab-extension"), " folder.",
      ),
      el("ol", { class: "dg-ext-substeps" },
        el("li", null, "Open ", el("code", null, "chrome://extensions"), " (Chrome / Edge / Brave / Arc) or ", el("code", null, "about:debugging"), " (Firefox)."),
        el("li", null, "Toggle ", el("strong", null, "Developer mode"), " on (top-right)."),
        el("li", null, "Click ", el("strong", null, "Load unpacked"), " → pick the unzipped ", el("code", null, "deckgrab-extension"), " folder."),
      ),
    ));

    grid.appendChild(el("div", { class: "dg-ext-step" },
      el("div", { class: "dg-ext-num" }, "3"),
      el("div", { class: "dg-ext-step-name" }, "Yoink any Quizlet set"),
      el("p", null,
        "Open any Quizlet set page. A floating ", el("strong", null, "🦺 Yoink to DeckGrab"),
        " button appears in the bottom-right corner. Click it → cards open in DeckGrab. That's the whole flow.",
      ),
    ));

    return el("section", { class: "dg-ext-zone" },
      el("div", { class: "dg-ext-eyebrow" }, "🧩 New · Browser Extension"),
      el("h2", { class: "dg-ext-title" }, "One click on every Quizlet page."),
      el("p", { class: "dg-ext-sub" },
        "Works on Chrome, Edge, Brave, Arc, Firefox, and any Chromium-based browser. Free, open source, no permissions beyond ",
        el("code", null, "quizlet.com"),
        ". Drops in via the extensions developer mode — three steps, ~30 seconds.",
      ),
      grid,
      el("div", { class: "dg-ext-tip" },
        el("strong", null, "Why developer mode?"),
        " Listing on the Chrome Web Store costs $5 + a few weeks of review. Side-loading is instant and the source is right there for you to inspect ",
        el("a", { href: "https://github.com/bendawg2010/DeckGrab/tree/main/extension", target: "_blank", rel: "noopener" }, "on GitHub"),
        ".",
      ),
    );
  }

  // -------- Header / footer (shared) ---------------------------------

  function makeHeader() {
    const logo = el("a", { class: "dg-logo", href: "#/" },
      el("div", { class: "dg-logo-icon" }, makeLogoSvg()),
      "DeckGrab",
    );

    const nav = el("nav", { class: "dg-nav" },
      el("a", { href: "https://github.com/bendawg2010/DeckGrab", target: "_blank", rel: "noopener" }, "★ GitHub"),
      el("a", { href: "https://github.com/sponsors/bendawg2010", target: "_blank", rel: "noopener" }, "Sponsor"),
    );

    return el("header", { class: "dg-header" }, logo, nav);
  }

  function makeFooter() {
    return el("footer", { class: "dg-footer" },
      el("div", null, "© DeckGrab · MIT licensed · ",
        el("a", { href: "https://github.com/bendawg2010/DeckGrab", target: "_blank", rel: "noopener" }, "open source")),
      el("div", null,
        el("a", { href: "https://github.com/sponsors/bendawg2010", target: "_blank", rel: "noopener" }, "Sponsor"),
        " · ",
        el("a", { href: "https://cash.app/$Dryeetsolutions", target: "_blank", rel: "noopener" }, "Tip $1"),
      ),
    );
  }

  // -------- Landing page ---------------------------------------------

  function renderLanding() {
    const root = document.getElementById("root");
    clear(root);

    root.appendChild(makeHeader());

    // Hero
    const hero = el("section", { class: "dg-hero" },
      el("h1", null, "Free flashcards. ", el("span", { class: "accent" }, "In your browser.")),
      el("p", null, "Drop the bookmarklet on desktop or follow the install steps for mobile. One click on any Quizlet set imports it. Study right here or export to TSV / CSV / JSON / Anki. No login. Open source."),
    );
    root.appendChild(hero);

    // ---- 1. Chrome / desktop bookmarklet (PRIMARY PATH) ----
    // The bread-and-butter flow: drag the pill onto your bookmarks bar,
    // click it on any Quizlet set, cards land in DeckGrab. Works in
    // Chrome / Edge / Brave / Arc / Firefox out of the box.
    const pill = el("a", {
      class: "dg-pill",
      href: BOOKMARKLET,
      title: "Drag this to your bookmarks bar",
      onclick: (e) => {
        e.preventDefault();
        toast("Don’t click — DRAG it up to your bookmarks bar.");
      },
      draggable: true,
    }, "⭐ Grab cards");

    const drop = el("section", { class: "dg-bookmark-zone" },
      el("div", { class: "dg-pill-eyebrow" }, "Recommended · Chrome / Edge / Brave / Arc / Firefox"),
      el("div", { class: "pill-row" }, pill),
      el("div", { class: "dg-bookmark-instructions" },
        el("strong", null, "Drag this button"),
        " up to your browser’s ",
        el("strong", null, "bookmarks bar"),
        ". Click it on any Quizlet set page to import.",
      ),
      // Helpful tip for users without a bookmarks bar visible
      makeBookmarkBarHelp(),
      // Manual-install fallback (collapsed by default)
      makeManualBookmarkFallback(),
    );
    root.appendChild(drop);

    // ---- 2. Safari (desktop) — simple-version bookmarklet ----
    // Safari blocks window.open after async work, so the regular
    // bookmarklet's hop-to-DeckGrab path doesn't fire. The simple
    // version paints an overlay on the Quizlet page with Copy + Open
    // in DeckGrab buttons instead. Same scrape logic underneath.
    const simplePill = el("a", {
      class: "dg-pill dg-pill-simple",
      href: BOOKMARKLET_SIMPLE,
      title: "Drag this to your bookmarks bar — Safari simple version",
      onclick: (e) => {
        e.preventDefault();
        toast("Don’t click — DRAG it up to your bookmarks bar.");
      },
      draggable: true,
    }, "🦺 Grab cards (Safari)");

    const simpleZone = el("section", { class: "dg-bookmark-zone dg-bookmark-zone-simple" },
      el("div", { class: "dg-pill-eyebrow" }, "Safari (desktop)"),
      el("div", { class: "pill-row" }, simplePill),
      el("div", { class: "dg-bookmark-instructions" },
        el("strong", null, "Drag this button"),
        " to your bookmarks bar. It works ",
        el("strong", null, "differently"),
        " — when you click it on a Quizlet set, it shows the cards in an overlay right on the page with ",
        el("em", null, "Copy"),
        " and ",
        el("em", null, "Open in DeckGrab"),
        " buttons. No popups, no automatic redirect.",
      ),
    );
    root.appendChild(simpleZone);

    // ---- 3. iOS Safari — bookmark-edit dance ----
    root.appendChild(makeIOSInstall());

    // ---- 4. Android (Chrome / Samsung / Brave / Edge / Firefox) ----
    root.appendChild(makeAndroidInstall());

    // ---- 5. Browser-extension zone (alternate desktop path) ----
    // One-click floating "Yoink" button on every Quizlet page if you'd
    // rather load an unpacked extension than maintain a bookmarklet.
    root.appendChild(makeExtensionZone());

    // Demo video — actual yoink in action
    const video = el("video", {
      src: "demo.mp4",
      autoplay: true,
      loop: true,
      muted: true,
      playsinline: true,
      preload: "metadata",
      "aria-label": "DeckGrab in action — yoinking flashcards from Quizlet",
    });
    video.muted = true; // belt-and-suspenders for autoplay
    const demo = el("section", { class: "dg-demo" },
      el("div", { class: "dg-demo-eyebrow" }, "Live demo"),
      el("h2", null, "Watch a yoink in real time."),
      el("div", { class: "dg-demo-frame" },
        el("span", { class: "dg-demo-glow", "aria-hidden": "true" }),
        el("div", { class: "dg-demo-inner" }, video),
      ),
      el("div", { class: "dg-demo-cap" }, "One drag, one click, dozens of cards. No login, no scraping server."),
    );
    root.appendChild(demo);

    // If we have a recent deck cached, offer a "Resume study" jump
    const cached = loadCardsLS();
    if (cached.length) {
      root.appendChild(el("section", { class: "dg-resume" },
        el("div", { class: "dg-resume-text" },
          el("strong", null, "Resume your last deck"),
          " · ", String(cached.length), " cards cached locally."
        ),
        el("div", { style: "display:flex; gap:8px;" },
          el("a", { class: "dg-export-btn primary", href: "#/study" }, "📖 Study"),
          el("a", { class: "dg-export-btn", href: "#/cards" }, "⬇ Export"),
        ),
      ));
    }

    // 3 steps
    root.appendChild(makeSteps());

    // Compatibility row
    root.appendChild(el("section", { class: "dg-compat" },
      el("strong", null, "Use them anywhere:"),
      el("span", { class: "dg-compat-tag" }, "Study here"),
      el("span", { class: "dg-compat-tag" }, "TSV"),
      el("span", { class: "dg-compat-tag" }, "CSV"),
      el("span", { class: "dg-compat-tag" }, "JSON"),
      el("span", { class: "dg-compat-tag" }, "Anki"),
      el("span", { class: "dg-compat-tag" }, "StudyDeck"),
    ));

    root.appendChild(makeFooter());
  }

  // Prominent "show your bookmarks bar" tutorial — universal keyboard
  // shortcut on top, then a grid with menu paths for the major browsers
  // for users who'd rather click than type a shortcut.
  function makeBookmarkBarHelp() {
    const browsers = [
      { name: "Chrome",  letter: "C", color: "#4285F4",
        path: "View → Always Show Bookmarks Bar" },
      { name: "Firefox", letter: "F", color: "#FF7139",
        path: "View → Toolbars → Bookmarks Toolbar" },
      { name: "Edge",    letter: "E", color: "#0078D4",
        path: "Settings → Appearance → Show favorites bar" },
      { name: "Brave",   letter: "B", color: "#FB542B",
        path: "View → Always Show Bookmarks Bar" },
      { name: "Arc",     letter: "A", color: "#FF6B97",
        path: "Bookmarks live in the sidebar by default" },
      { name: "Safari",  letter: "S", color: "#0FB5EE",
        path: "View → Show Favorites Bar (use Safari version below)" },
    ];

    const grid = el("div", { class: "dg-browsers-grid" });
    browsers.forEach((b) => {
      const card = el("div", {
        class: "dg-browser-card" + (b.unsupported ? " is-unsupported" : ""),
      },
        el("div", { class: "dg-browser-mark", style: { background: b.color } }, b.letter),
        el("div", { class: "dg-browser-body" },
          el("div", { class: "dg-browser-name" }, b.name,
            b.unsupported ? el("span", { class: "dg-browser-tag" }, "soon") : null,
          ),
          el("div", { class: "dg-browser-path" }, b.path),
        ),
      );
      grid.appendChild(card);
    });

    return el("section", { class: "dg-bar-help" },
      el("div", { class: "dg-bar-help-eyebrow" }, "💡 Don’t see your bookmarks bar?"),
      el("h3", { class: "dg-bar-help-title" }, "Show it first."),
      el("div", { class: "dg-bar-help-shortcut" },
        el("div", { class: "dg-shortcut-line" },
          el("kbd", null, "⌘"), " ", el("kbd", null, "Shift"), " ", el("kbd", null, "B"),
          el("span", { class: "dg-shortcut-platform" }, "Mac"),
        ),
        el("div", { class: "dg-shortcut-line" },
          el("kbd", null, "Ctrl"), " ", el("kbd", null, "Shift"), " ", el("kbd", null, "B"),
          el("span", { class: "dg-shortcut-platform" }, "Windows / Linux"),
        ),
      ),
      el("div", { class: "dg-bar-help-or" },
        "Or use the menu in your browser:",
      ),
      grid,
    );
  }

  // iOS install zone — full how-to for Safari on iPhone / iPad.
  // iOS Safari can't drag bookmarklets onto a bar (there's no bar), and
  // pasting a javascript: URL into the New Bookmark dialog gets stripped.
  // The workaround that works in 2024+ iOS: bookmark any page, then
  // EDIT that bookmark's URL — Safari leaves javascript: alone in edit
  // mode. Once installed, the user runs it from address-bar autocomplete.
  function makeIOSInstall() {
    const iosURLBox = el("textarea", {
      class: "dg-manual-url",
      readonly: "readonly",
      rows: "4",
      "aria-label": "iOS bookmarklet URL — copy this",
    });
    iosURLBox.value = BOOKMARKLET_SIMPLE;

    const iosCopyBtn = el("button", {
      class: "dg-export-btn primary",
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(BOOKMARKLET_SIMPLE);
          toast("✓ Copied — paste into your bookmark's URL field");
        } catch (e) {
          // iOS will refuse clipboard.writeText if not user-gesture.
          // Surface the textarea so the user can long-press → Copy.
          iosURLBox.focus();
          iosURLBox.select();
          toast("Long-press the box, choose Copy");
        }
      },
    }, "📋 Copy iOS bookmarklet");

    const grid = el("div", { class: "dg-ios-grid" });

    // Step 1 — bookmark this page so there's something to edit
    grid.appendChild(el("div", { class: "dg-ios-step" },
      el("div", { class: "dg-ios-num" }, "1"),
      el("div", { class: "dg-ios-step-name" }, "Bookmark this page"),
      el("ol", { class: "dg-ios-step-list" },
        el("li", null, "Tap the ", el("strong", null, "Share"), " button (the square with an up-arrow)."),
        el("li", null, "Choose ", el("em", null, "Add Bookmark"), "."),
        el("li", null, "Tap ", el("strong", null, "Save"), " — any folder is fine."),
      ),
    ));

    // Step 2 — replace the bookmark URL with the javascript: bookmarklet
    grid.appendChild(el("div", { class: "dg-ios-step" },
      el("div", { class: "dg-ios-num" }, "2"),
      el("div", { class: "dg-ios-step-name" }, "Swap its URL for this"),
      el("ol", { class: "dg-ios-step-list" },
        el("li", null, "Tap the ", el("strong", null, "Bookmarks"), " book icon at the bottom."),
        el("li", null, "Tap ", el("em", null, "Edit"), " (bottom-right corner)."),
        el("li", null, "Tap your bookmark, clear the URL, and paste the one below."),
        el("li", null, "Rename it ", el("strong", null, "DeckGrab"), " and tap ", el("em", null, "Done"), "."),
      ),
      iosURLBox,
      iosCopyBtn,
    ));

    // Step 3 — run it from address bar
    grid.appendChild(el("div", { class: "dg-ios-step" },
      el("div", { class: "dg-ios-num" }, "3"),
      el("div", { class: "dg-ios-step-name" }, "Run it on Quizlet"),
      el("ol", { class: "dg-ios-step-list" },
        el("li", null, "Open any Quizlet set in Safari and scroll to the bottom so all terms load."),
        el("li", null, "Tap the address bar, type ", el("strong", null, "deckgrab"), "."),
        el("li", null, "Tap the matching ", el("em", null, "Bookmarks"), " suggestion to run it."),
        el("li", null, "Cards show in an overlay → tap ", el("strong", null, "Open in DeckGrab"), "."),
      ),
    ));

    return el("section", { class: "dg-bookmark-zone dg-ios-zone" },
      el("div", { class: "dg-pill-eyebrow dg-ios-eyebrow" }, "📱 iPhone or iPad · iOS Safari"),
      el("h3", { class: "dg-ios-title" }, "iOS doesn’t have a bookmarks bar — but Safari still runs bookmarklets."),
      el("p", { class: "dg-ios-sub" },
        "Three taps to install once, then it’s a one-tap yoink on every Quizlet set. About 60 seconds of setup."
      ),
      grid,
      el("div", { class: "dg-ios-tip" },
        el("strong", null, "Why the URL swap?"),
        " iOS Safari strips ",
        el("code", null, "javascript:"),
        " URLs from the New-Bookmark dialog — but it leaves them alone when you edit an existing bookmark. So we make a placeholder bookmark, then swap its URL.",
        el("br"),
        el("br"),
        el("strong", null, "Using Chrome / Firefox / Edge on iPhone?"),
        " They all run on WebKit (Apple's rule) but with bookmarklets disabled. Switch to Safari for iOS — it's the only iOS browser that runs them reliably.",
      ),
    );
  }

  // Android install zone — mostly Chrome but the same flow works on
  // Brave / Edge / Samsung / Opera / Vivaldi (all Chromium) and Android
  // Firefox. The shared mechanic is: bookmark a page, edit that bookmark
  // to point at javascript:..., then start typing the bookmark name in
  // the address bar — Chrome shows the bookmark as a suggestion under
  // "Bookmarks", and tapping it fires the JS against the page you were
  // already on.
  function makeAndroidInstall() {
    const aURLBox = el("textarea", {
      class: "dg-manual-url",
      readonly: "readonly",
      rows: "4",
      "aria-label": "Android bookmarklet URL — copy this",
    });
    aURLBox.value = BOOKMARKLET_SIMPLE;

    const aCopyBtn = el("button", {
      class: "dg-export-btn primary",
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(BOOKMARKLET_SIMPLE);
          toast("✓ Copied — paste into your bookmark's URL field");
        } catch (e) {
          aURLBox.focus();
          aURLBox.select();
          toast("Long-press the box, choose Copy");
        }
      },
    }, "📋 Copy Android bookmarklet");

    const grid = el("div", { class: "dg-ios-grid" });

    grid.appendChild(el("div", { class: "dg-ios-step" },
      el("div", { class: "dg-ios-num" }, "1"),
      el("div", { class: "dg-ios-step-name" }, "Bookmark this page"),
      el("ol", { class: "dg-ios-step-list" },
        el("li", null, "Tap the ", el("strong", null, "⋮"), " menu (top-right)."),
        el("li", null, "Tap the ", el("strong", null, "☆"), " star to bookmark."),
        el("li", null,
          el("em", null, "Firefox: ⋮ → Add to → Bookmarks. Samsung Internet: ☰ → ☆."),
        ),
      ),
    ));

    grid.appendChild(el("div", { class: "dg-ios-step" },
      el("div", { class: "dg-ios-num" }, "2"),
      el("div", { class: "dg-ios-step-name" }, "Swap its URL for this"),
      el("ol", { class: "dg-ios-step-list" },
        el("li", null, "Tap ", el("strong", null, "⋮ → Bookmarks"), " to open the list."),
        el("li", null, "Tap the ", el("strong", null, "⋮"), " next to the bookmark → ", el("em", null, "Edit"), "."),
        el("li", null, "Replace the URL with the one below. Rename it ", el("strong", null, "DeckGrab"), "."),
        el("li", null, "Tap ", el("em", null, "Save"), " (✓ on Firefox)."),
      ),
      aURLBox,
      aCopyBtn,
    ));

    grid.appendChild(el("div", { class: "dg-ios-step" },
      el("div", { class: "dg-ios-num" }, "3"),
      el("div", { class: "dg-ios-step-name" }, "Run it on Quizlet"),
      el("ol", { class: "dg-ios-step-list" },
        el("li", null, "Open a Quizlet set, scroll to load all terms."),
        el("li", null, "Tap the address bar, type ", el("strong", null, "deckgrab"), "."),
        el("li", null, "Tap the bookmark under ", el("em", null, "Bookmarks"), " in the dropdown."),
        el("li", null, "Overlay shows the cards → tap ", el("strong", null, "Open in DeckGrab"), "."),
      ),
    ));

    return el("section", { class: "dg-bookmark-zone dg-android-zone" },
      el("div", { class: "dg-pill-eyebrow dg-android-eyebrow" }, "🤖 Android · Chrome / Firefox / Brave / Edge / Samsung"),
      el("h3", { class: "dg-ios-title dg-android-title" }, "Android works the same way — bookmark, edit, run."),
      el("p", { class: "dg-ios-sub" },
        "Same idea as iOS but the menus are slightly different. Steps below cover Chrome; Firefox / Samsung / Brave use the same flow with their own ⋮ menu placement."
      ),
      grid,
      el("div", { class: "dg-ios-tip" },
        el("strong", null, "Heads-up:"),
        " when you tap the bookmark from address-bar autocomplete, Chrome shows it grouped under ",
        el("em", null, "Bookmarks"),
        ". If it shows under ",
        el("em", null, "Search suggestions"),
        " instead, Chrome will treat it as a search query — back out and tap ",
        el("strong", null, "Bookmarks"),
        " explicitly.",
      ),
    );
  }

  // Three installation methods, with method 1 (drag) as primary above.
  // This builds the collapsible "Or install it manually" panel below the
  // pill, covering right-click + paste-as-bookmark.
  function makeManualBookmarkFallback() {
    const details = el("details", { class: "dg-manual-install" });
    const summary = el("summary", null, "Other ways to install the bookmark →");
    details.appendChild(summary);

    const grid = el("div", { class: "dg-manual-grid" });

    // Method 2 — right-click
    grid.appendChild(el("div", { class: "dg-manual-card" },
      el("div", { class: "dg-manual-num" }, "2"),
      el("div", { class: "dg-manual-name" }, "Right-click"),
      el("ol", { class: "dg-manual-steps" },
        el("li", null, "Right-click the ", el("strong", null, "⭐ Grab cards"), " button above."),
        el("li", null, "Pick ", el("em", null, "Bookmark this link"), " (Chrome) or ", el("em", null, "Add link to bookmarks"), " (Safari/Firefox)."),
        el("li", null, "Save it anywhere — folder, bookmarks menu, anywhere."),
      ),
    ));

    // Method 3 — paste URL
    const urlBox = el("textarea", {
      class: "dg-manual-url",
      readonly: "readonly",
      rows: "4",
      "aria-label": "Bookmarklet URL — copy this",
    });
    urlBox.value = BOOKMARKLET;
    const copyBtn = el("button", {
      class: "dg-export-btn primary",
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(BOOKMARKLET);
          toast("✓ Bookmarklet URL copied — now paste it as a new bookmark");
        } catch (e) {
          // Fallback: select the textarea so the user can Cmd+C manually
          urlBox.focus();
          urlBox.select();
          toast("Press Cmd/Ctrl+C to copy");
        }
      },
    }, "📋 Copy the URL");

    grid.appendChild(el("div", { class: "dg-manual-card" },
      el("div", { class: "dg-manual-num" }, "3"),
      el("div", { class: "dg-manual-name" }, "Copy + paste a bookmark"),
      el("ol", { class: "dg-manual-steps" },
        el("li", null, "Hit ", el("kbd", null, "⌘ D"), " / ", el("kbd", null, "Ctrl D"), " on any page to add a bookmark, then edit it."),
        el("li", null, "Replace the URL with the one below."),
        el("li", null, "Rename it to ", el("strong", null, "Grab cards"), " and save."),
      ),
      urlBox,
      copyBtn,
    ));

    details.appendChild(grid);
    return details;
  }

  function makeSteps() {
    return el("section", { class: "dg-steps" },
      // Step 1
      el("div", { class: "dg-step" },
        el("div", { class: "dg-step-number" }, "1"),
        el("h3", null, "Drag to bookmarks bar"),
        el("p", null, "Press ", el("strong", null, "Cmd/Ctrl+Shift+B"), " to show your bookmarks bar, then drag the button above onto it."),
        miniBrowser([
          el("div", { class: "dg-mini-content" },
            el("div", { style: "font-size: 13px; font-weight: 800; margin-bottom: 4px;" }, "deckgrab.pages.dev"),
            el("div", { style: "opacity: 0.7; font-size: 9px;" }, "Drag the button above onto the bookmarks bar."),
          ),
        ]),
      ),

      // Step 2
      el("div", { class: "dg-step" },
        el("div", { class: "dg-step-number" }, "2"),
        el("h3", null, "Click on any Quizlet set"),
        el("p", null, "Open ", el("strong", null, "quizlet.com/<id>/<title>"), " (the page where you can see all the terms), wait for it to load, then click the bookmark."),
        miniBrowser([
          el("div", { class: "dg-mini-content" },
            el("div", { class: "dg-mini-row" }, el("span", null, "bonjour"), el("span", { style: "opacity: 0.75;" }, "hello")),
            el("div", { class: "dg-mini-row" }, el("span", null, "merci"), el("span", { style: "opacity: 0.75;" }, "thank you")),
            el("div", { class: "dg-mini-row" }, el("span", null, "chat"), el("span", { style: "opacity: 0.75;" }, "cat")),
            el("div", { class: "dg-mini-toast" }, "DeckGrab: 247 cards"),
          ),
        ]),
      ),

      // Step 3
      el("div", { class: "dg-step" },
        el("div", { class: "dg-step-number" }, "3"),
        el("h3", null, "Study or export"),
        el("p", null, "Cards land in your clipboard and on this page. Hit ", el("strong", null, "Study"), " for flashcards (↑ flip, ←→ navigate). Or export to TSV / CSV / JSON / Anki."),
        miniBrowser([
          el("div", { class: "dg-mini-export-grid" },
            el("div", { class: "dg-mini-export-btn primary" }, "📖 Study"),
            el("div", { class: "dg-mini-export-btn" }, "Copy TSV"),
            el("div", { class: "dg-mini-export-btn" }, "Anki"),
            el("div", { class: "dg-mini-export-btn" }, "StudyDeck"),
          ),
        ]),
      ),
    );
  }

  function miniBrowser(content) {
    return el("div", { class: "dg-mini-browser" },
      el("div", { class: "dg-mini-titlebar" },
        el("div", { class: "dg-traffic r" }),
        el("div", { class: "dg-traffic y" }),
        el("div", { class: "dg-traffic g" }),
      ),
      el("div", { class: "dg-mini-bookmarks" },
        "★ News  ★ GitHub",
        el("span", { class: "dg-mini-bookmark-pill" }, "⭐ Grab cards"),
      ),
      ...content,
    );
  }

  // -------- Local persistence ----------------------------------------

  const LS_KEY = "dg_cards_v1";

  function saveCardsLS(cards) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        cards,
        savedAt: Date.now(),
      }));
    } catch (e) { /* quota or private mode — ignore */ }
  }

  function loadCardsLS() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const obj = JSON.parse(raw);
      if (Array.isArray(obj?.cards)) return obj.cards;
    } catch (e) {}
    return [];
  }

  // -------- Cards receiver page (#/cards) ----------------------------

  let CURRENT_CARDS = [];

  async function renderCards() {
    const root = document.getElementById("root");
    clear(root);
    root.appendChild(makeHeader());

    const params = parseHashQuery();
    const expected = parseInt(params.n || "0", 10) || 0;
    const fromClipboard = params.c === "1";
    // The Safari simple bookmarklet passes TSV directly in the URL
    // hash (?d=...) instead of the clipboard, since Safari blocks
    // cross-origin clipboard reads.
    const fromUrl = !!params.d;

    const wrapper = el("section", { class: "dg-receiver" });
    root.appendChild(wrapper);

    let raw = "";

    if (fromUrl) {
      // params.d is already URI-decoded by parseHashQuery
      raw = String(params.d || "");
    } else if (fromClipboard) {
      try {
        raw = await navigator.clipboard.readText();
      } catch (err) {
        // Try the local cache before falling back to error state
        const cached = loadCardsLS();
        if (cached.length) {
          CURRENT_CARDS = cached;
          renderCardsContent(wrapper);
          root.appendChild(makeFooter());
          return;
        }
        renderClipboardErrorState(wrapper, expected);
        root.appendChild(makeFooter());
        return;
      }
    }

    let cards = parseTSV(raw);

    // Fallback: if there's nothing fresh on the clipboard but we have a
    // cached deck, use that — supports refresh / coming back later.
    if (!cards.length && !fromClipboard) {
      cards = loadCardsLS();
    }

    if (!cards.length) {
      renderEmptyState(wrapper, expected);
      root.appendChild(makeFooter());
      return;
    }

    CURRENT_CARDS = cards;
    saveCardsLS(cards);

    // Cool fly-in animation when cards arrive fresh from a yoink
    if ((fromClipboard || fromUrl) && raw) {
      await playYoinkAnimation(cards.length);
    }

    renderCardsContent(wrapper);
    root.appendChild(makeFooter());
  }

  // -------- Yoink animation ------------------------------------------

  function playYoinkAnimation(count) {
    return new Promise((resolve) => {
      const overlay = el("div", { class: "dg-yoink-overlay" });
      const swirl = el("div", { class: "dg-yoink-swirl" });

      // Counter that ticks up
      const counter = el("div", { class: "dg-yoink-count" }, "0");
      const label = el("div", { class: "dg-yoink-label" }, "YOINKING");
      const stack = el("div", { class: "dg-yoink-stack" });

      // Generate flying card silhouettes — random angles, staggered
      const N = Math.min(18, Math.max(8, Math.round(count / 16)));
      for (let i = 0; i < N; i++) {
        const card = el("div", { class: "dg-yoink-card" });
        const angle = (i / N) * Math.PI * 2 + Math.random() * 0.6;
        const dist = 600 + Math.random() * 400;
        const fromX = Math.cos(angle) * dist;
        const fromY = Math.sin(angle) * dist;
        const fromRot = (Math.random() - 0.5) * 720;
        card.style.setProperty("--from-x", `${fromX}px`);
        card.style.setProperty("--from-y", `${fromY}px`);
        card.style.setProperty("--from-rot", `${fromRot}deg`);
        card.style.animationDelay = `${i * 0.045}s`;
        // Random hue along brand gradient
        const hue = i % 3 === 0 ? "#FFB454" : i % 3 === 1 ? "#FF6B6B" : "#C147FF";
        card.style.setProperty("--card-hue", hue);
        stack.appendChild(card);
      }

      swirl.appendChild(stack);
      swirl.appendChild(label);
      swirl.appendChild(counter);
      overlay.appendChild(swirl);
      document.body.appendChild(overlay);

      // Tick the counter from 0 → count over ~1.0s
      const dur = 900;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        counter.textContent = String(Math.round(eased * count));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);

      // Total animation is ~1.6s (cards land ~1.4s, hold + fade out ~0.2s)
      setTimeout(() => {
        label.textContent = "YOINKED ✓";
        label.classList.add("dg-yoink-done");
      }, 1100);

      setTimeout(() => {
        overlay.classList.add("dg-yoink-out");
      }, 1500);

      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 1850);
    });
  }

  function makePasteFallback() {
    const ta = el("textarea", {
      id: "manualPaste",
      placeholder: "…or paste your tab-separated card data here",
      style: "width: 100%; min-height: 240px; margin-top: 24px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); padding: 18px; border-radius: 14px; font-family: var(--mono); font-size: 14px; line-height: 1.5; resize: vertical;",
    });
    const btn = el("button", {
      class: "dg-export-btn primary",
      style: "margin-top: 16px;",
      onclick: () => {
        const raw = ta.value;
        const cards = parseTSV(raw);
        if (!cards.length) { toast("No cards detected — each line should be term TAB definition"); return; }
        CURRENT_CARDS = cards;
        const wrapper = document.querySelector(".dg-receiver");
        if (wrapper) renderCardsContent(wrapper);
      },
    }, "Import this");
    return [ta, btn];
  }

  function renderClipboardErrorState(wrapper, expected) {
    const fallback = makePasteFallback();
    wrapper.appendChild(el("div", { class: "dg-empty" },
      el("h2", null, "Couldn’t read clipboard"),
      el("p", null, "Click below to grant clipboard access, then we’ll show your ", String(expected), " cards."),
      el("div", { class: "dg-export-bar" },
        el("button", {
          class: "dg-export-btn primary",
          onclick: async () => {
            try {
              const raw = await navigator.clipboard.readText();
              CURRENT_CARDS = parseTSV(raw);
              if (CURRENT_CARDS.length) renderCards();
              else toast("Clipboard didn’t contain card data");
            } catch (e) { toast("Couldn’t read clipboard — paste manually below"); }
          },
        }, "Read clipboard"),
        el("a", { class: "dg-export-btn", href: "#/" }, "← Back"),
      ),
      ...fallback,
    ));
  }

  function renderEmptyState(wrapper, expected) {
    const fallback = makePasteFallback();
    wrapper.appendChild(el("div", { class: "dg-empty" },
      el("h2", null, "No cards to show"),
      el("p", null, expected
        ? `We expected ${expected} cards but couldn’t read your clipboard. Try clicking the bookmarklet again, or paste manually below.`
        : "Click the bookmarklet on a Quizlet set page — your cards will appear here."),
      el("div", { class: "dg-export-bar" },
        el("a", { class: "dg-export-btn primary", href: "#/" }, "← Back to instructions"),
      ),
      ...fallback,
    ));
  }

  function renderCardsContent(wrapper) {
    clear(wrapper);

    wrapper.appendChild(el("div", { class: "dg-receiver-header" },
      el("h1", null, "Your cards are ", el("span", { class: "accent" }, "yoinked.")),
      el("p", null, `We grabbed ${CURRENT_CARDS.length} cards. Pick where to send them.`),
    ));

    // Export bar — primary path first
    wrapper.appendChild(el("div", { class: "dg-export-bar" },
      el("button", { class: "dg-export-btn primary", onclick: () => sendToStudyDeck() }, "→ StudyDeck"),
      el("a", { class: "dg-export-btn", href: "#/study" }, "📖 Study here"),
      el("button", { class: "dg-export-btn", onclick: () => copyTSV() }, "📋 Copy TSV"),
      el("button", { class: "dg-export-btn", onclick: () => copyCSV() }, "📋 Copy CSV"),
      el("button", { class: "dg-export-btn", onclick: () => downloadFile("deck.csv", buildCSV(), "text/csv") }, "⬇ CSV"),
      el("button", { class: "dg-export-btn", onclick: () => downloadFile("deck.tsv", buildTSV(), "text/tab-separated-values") }, "⬇ TSV"),
      el("button", { class: "dg-export-btn", onclick: () => downloadFile("deck-anki.csv", buildAnkiCSV(), "text/csv") }, "⬇ Anki CSV"),
      el("button", { class: "dg-export-btn", onclick: () => downloadFile("deck.json", buildJSON(), "application/json") }, "⬇ JSON"),
    ));

    // Cards list
    const list = el("div", { class: "dg-cards-list" });
    rebuildList(list);

    const frame = el("div", { class: "dg-cards-frame" },
      el("div", { class: "dg-cards-toolbar" },
        el("div", { class: "dg-card-count" }, `${CURRENT_CARDS.length} cards`),
        el("div", { class: "dg-toolbar-actions" },
          el("button", { class: "dg-mini-btn", onclick: () => {
            CURRENT_CARDS = CURRENT_CARDS.map(c => ({ t: c.d, d: c.t }));
            renderCardsContent(wrapper);
          } }, "↔ Swap term/def"),
        ),
      ),
      list,
    );
    wrapper.appendChild(frame);
  }

  function rebuildList(list) {
    clear(list);
    CURRENT_CARDS.forEach((card, i) => list.appendChild(makeCardRow(card, i)));
  }

  function makeCardRow(card, idx) {
    const tInput = el("input", { type: "text", value: card.t, oninput: (e) => CURRENT_CARDS[idx].t = e.target.value });
    const dInput = el("input", { type: "text", value: card.d, oninput: (e) => CURRENT_CARDS[idx].d = e.target.value });
    return el("div", { class: "dg-card-row" },
      el("div", { class: "dg-card-num" }, String(idx + 1)),
      el("div", { class: "dg-card-cell term" }, tInput),
      el("div", { class: "dg-card-cell def" }, dInput),
      el("button", {
        class: "dg-card-delete",
        title: "Remove",
        onclick: () => {
          CURRENT_CARDS.splice(idx, 1);
          const wrapper = document.querySelector(".dg-receiver");
          if (wrapper) renderCardsContent(wrapper);
        },
      }, "×"),
    );
  }

  // -------- Parsing / formatting helpers -----------------------------

  // Only header rows ('Term' / 'Definition' literal labels) are filtered,
  // and only when BOTH sides match — so a real vocab card with "Term" or
  // "Definition" as the value still passes through.
  const HEADER_LABELS = new Set([
    "term", "word", "question", "prompt", "front",
    "definition", "meaning", "answer", "translation", "back",
  ]);
  function isHeaderRow(t, d) {
    const tl = String(t || "").toLowerCase().trim();
    const dl = String(d || "").toLowerCase().trim();
    return HEADER_LABELS.has(tl) && HEADER_LABELS.has(dl);
  }

  function parseTSV(raw) {
    if (!raw) return [];
    const out = [];
    const lines = String(raw).split(/\r?\n/);
    for (const line of lines) {
      const idx = line.indexOf("\t");
      if (idx < 0) continue;
      const t = line.slice(0, idx).trim();
      const d = line.slice(idx + 1).trim();
      if (!t || !d) continue;
      if (isHeaderRow(t, d)) continue;
      out.push({ t, d });
    }
    return out;
  }

  function buildTSV() {
    return CURRENT_CARDS.map(c => `${c.t}\t${c.d}`).join("\n");
  }

  function csvEscape(s) {
    const v = String(s ?? "");
    if (/[,"\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  }

  function buildCSV() {
    const head = "term,definition\n";
    return head + CURRENT_CARDS.map(c => `${csvEscape(c.t)},${csvEscape(c.d)}`).join("\n");
  }

  function buildAnkiCSV() {
    return CURRENT_CARDS.map(c => `${csvEscape(c.t)},${csvEscape(c.d)}`).join("\n");
  }

  function buildJSON() {
    return JSON.stringify(
      CURRENT_CARDS.map(c => ({ term: c.t, definition: c.d })),
      null, 2,
    );
  }

  async function copyTSV() {
    try {
      await navigator.clipboard.writeText(buildTSV());
      toast("✓ Copied TSV — paste into Quizlet, Anki, Sheets, anywhere");
    } catch (e) {
      toast("Couldn’t copy — try the download button");
    }
  }

  async function copyCSV() {
    try {
      await navigator.clipboard.writeText(buildCSV());
      toast("✓ Copied CSV");
    } catch (e) {
      toast("Couldn’t copy — try the download button");
    }
  }

  function downloadFile(name, content, mime) {
    const blob = new Blob([content], { type: mime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`✓ Downloaded ${name}`);
  }

  async function sendToStudyDeck() {
    const tsv = buildTSV();
    // Best-effort clipboard write so users can also Cmd+V into StudyDeck's
    // manual fallback if needed. Doesn't block — Safari may reject.
    try { await navigator.clipboard.writeText(tsv); } catch (e) {}
    // Always pass the TSV via URL fragment too. StudyDeck reads it directly,
    // so the cross-origin clipboard hop never happens — works in Safari.
    const url = `https://studydeck.pages.dev/#/import-quizlet?n=${CURRENT_CARDS.length}&d=${encodeURIComponent(tsv)}`;
    window.open(url, "_blank");
  }

  // -------- Study mode (#/study) -------------------------------------
  // Flashcards UI: ↑ flip, ↓ unflip, ← prev, → next, S shuffle, R restart.

  let STUDY_KEY_HANDLER = null;

  function renderStudy() {
    // Clean up any previous global key handler
    if (STUDY_KEY_HANDLER) {
      document.removeEventListener("keydown", STUDY_KEY_HANDLER);
      STUDY_KEY_HANDLER = null;
    }

    const root = document.getElementById("root");
    clear(root);
    root.appendChild(makeHeader());

    // Resolve cards: in-memory first, then localStorage.
    let cards = CURRENT_CARDS.length ? CURRENT_CARDS : loadCardsLS();
    if (!cards.length) {
      const wrap = el("section", { class: "dg-receiver" });
      wrap.appendChild(el("div", { class: "dg-empty" },
        el("h2", null, "No cards to study yet"),
        el("p", null, "Drop the bookmark on your bookmarks bar, then click it on a Quizlet set. Cards will land here ready to study."),
        el("a", { class: "dg-export-btn primary", href: "#/" }, "← How to import"),
      ));
      root.appendChild(wrap);
      root.appendChild(makeFooter());
      return;
    }
    CURRENT_CARDS = cards;

    let order = cards.map((_, i) => i);
    let pos = 0;
    let flipped = false;

    const wrap = el("section", { class: "dg-study" });

    // Header / progress
    const counter = el("div", { class: "dg-study-counter" });
    const progress = el("div", { class: "dg-study-progress" },
      el("div", { class: "dg-study-progress-fill" }),
    );
    const headerRow = el("div", { class: "dg-study-head" },
      el("a", { class: "dg-export-btn", href: "#/cards" }, "← Back"),
      counter,
      el("div", { style: "display:flex; gap:8px;" },
        el("button", { class: "dg-export-btn", onclick: () => { shuffle(); render(); } }, "🔀 Shuffle"),
        el("button", { class: "dg-export-btn", onclick: () => { restart(); render(); } }, "↻ Restart"),
      ),
    );
    wrap.appendChild(headerRow);
    wrap.appendChild(progress);

    // Card stage
    const stage = el("div", { class: "dg-study-stage" });
    const cardEl = el("div", { class: "dg-flashcard" });
    const innerEl = el("div", { class: "dg-flashcard-inner" });
    const frontEl = el("div", { class: "dg-flashcard-face dg-flashcard-front" });
    const backEl = el("div", { class: "dg-flashcard-face dg-flashcard-back" });

    innerEl.appendChild(frontEl);
    innerEl.appendChild(backEl);
    cardEl.appendChild(innerEl);

    cardEl.addEventListener("click", () => {
      flipped = !flipped;
      render();
    });

    stage.appendChild(cardEl);
    wrap.appendChild(stage);

    // Hint row
    const hint = el("div", { class: "dg-study-hint" },
      el("span", null, kbHint("↑"), " ", kbHint("↓"), " or click to flip"),
      el("span", null, kbHint("←"), " ", kbHint("→"), " navigate"),
      el("span", null, kbHint("S"), " shuffle"),
      el("span", null, kbHint("R"), " restart"),
    );
    wrap.appendChild(hint);

    // Done state (shown when reaching end + flipping next on last card)
    const doneEl = el("div", { class: "dg-study-done", style: { display: "none" } },
      el("div", { class: "dg-study-done-emoji" }, "🎉"),
      el("h2", null, "Reviewed all ", el("span", { class: "accent" }, String(cards.length), " cards.")),
      el("p", null, "Run it back, shuffle for variety, or jump back to export."),
      el("div", { style: "display:flex; gap:10px; flex-wrap:wrap; justify-content:center;" },
        el("button", { class: "dg-export-btn primary", onclick: () => { restart(); render(); } }, "↻ Restart"),
        el("button", { class: "dg-export-btn", onclick: () => { shuffle(); render(); } }, "🔀 Shuffle & restart"),
        el("a", { class: "dg-export-btn", href: "#/cards" }, "← Back to deck"),
      ),
    );
    wrap.appendChild(doneEl);

    root.appendChild(wrap);
    root.appendChild(makeFooter());

    // ---- Mutations ----

    function shuffle() {
      // Fisher-Yates
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      pos = 0;
      flipped = false;
    }
    function restart() {
      order = cards.map((_, i) => i);
      pos = 0;
      flipped = false;
    }
    function next() {
      if (pos < order.length - 1) {
        pos++;
        flipped = false;
        render();
      } else {
        // Done state
        stage.style.display = "none";
        hint.style.display = "none";
        progress.style.display = "none";
        doneEl.style.display = "flex";
      }
    }
    function prev() {
      if (pos > 0) {
        pos--;
        flipped = false;
        render();
      }
    }

    // ---- Render ----

    function render() {
      const card = cards[order[pos]];
      counter.innerHTML = "";
      counter.appendChild(el("strong", null, String(pos + 1)));
      counter.appendChild(document.createTextNode(" / " + cards.length));

      // Progress bar
      const fill = progress.querySelector(".dg-study-progress-fill");
      const pct = ((pos + 1) / cards.length) * 100;
      fill.style.width = pct + "%";

      // Faces
      clear(frontEl);
      clear(backEl);
      frontEl.appendChild(el("div", { class: "dg-flashcard-eyebrow" }, "TERM"));
      frontEl.appendChild(el("div", { class: "dg-flashcard-text" }, card.t));
      frontEl.appendChild(el("div", { class: "dg-flashcard-tip" }, "↑ ↓ or click to flip"));

      backEl.appendChild(el("div", { class: "dg-flashcard-eyebrow", style: { color: "#FF9DC3" } }, "DEFINITION"));
      backEl.appendChild(el("div", { class: "dg-flashcard-text" }, card.d));
      backEl.appendChild(el("div", { class: "dg-flashcard-tip" }, "→ next · ← prev · ↑↓ flip"));

      cardEl.classList.toggle("is-flipped", flipped);
      stage.style.display = "";
      hint.style.display = "";
      progress.style.display = "";
      doneEl.style.display = "none";
    }

    render();

    // ---- Keyboard ----

    STUDY_KEY_HANDLER = (e) => {
      const tag = (e.target && e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown":
        case " ":
          // Up + Down + Space all flip / unflip the card
          e.preventDefault();
          flipped = !flipped;
          render();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "s":
        case "S":
          shuffle(); render();
          toast("Shuffled");
          break;
        case "r":
        case "R":
          restart(); render();
          toast("Restarted");
          break;
      }
    };
    document.addEventListener("keydown", STUDY_KEY_HANDLER);
  }

  function kbHint(key) {
    return el("kbd", { class: "dg-kbd" }, key);
  }

  // -------- Routing --------------------------------------------------

  function parseHashQuery() {
    const out = {};
    const hash = window.location.hash || "#/";
    const q = hash.indexOf("?");
    if (q < 0) return out;
    const search = hash.slice(q + 1);
    for (const pair of search.split("&")) {
      if (!pair) continue;
      const [k, v] = pair.split("=");
      out[decodeURIComponent(k)] = v ? decodeURIComponent(v) : "";
    }
    return out;
  }

  function getRoute() {
    const h = (window.location.hash || "#/").split("?")[0];
    return h;
  }

  function route() {
    // Tear down any study key handler when leaving the route
    if (STUDY_KEY_HANDLER) {
      document.removeEventListener("keydown", STUDY_KEY_HANDLER);
      STUDY_KEY_HANDLER = null;
    }
    const path = getRoute();
    if (path === "#/cards" || path === "#/import-quizlet") {
      renderCards();
    } else if (path === "#/study") {
      renderStudy();
    } else {
      renderLanding();
    }
  }

  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", route);
  if (document.readyState !== "loading") route();
})();
