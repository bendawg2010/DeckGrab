// DeckGrab — content script
//
// Runs on every quizlet.com page. If we're on a set page (URL pattern
// /<id>/<slug>), we inject a floating "Yoink" button in the bottom-
// right corner. Click it → scrape the set the same way our bookmarklet
// does → hand off to deckgrab.pages.dev with cards in the URL fragment.
//
// Why content script + button instead of just popup? Less friction.
// The user sees a button on every Quizlet page; one click and they're
// in DeckGrab. No popup discovery, no toolbar hunting.

(() => {
  "use strict";

  // Only run on actual set pages (URL like quizlet.com/12345/title-slug)
  const SET_URL_RE = /^\/\d+\//;
  let mounted = false;

  function maybeMount() {
    if (!SET_URL_RE.test(location.pathname)) {
      const existing = document.getElementById("dg-yoink-fab");
      if (existing) existing.remove();
      mounted = false;
      return;
    }
    if (mounted) return;
    mountButton();
    mounted = true;
  }

  function mountButton() {
    if (document.getElementById("dg-yoink-fab")) return;

    const wrap = document.createElement("div");
    wrap.id = "dg-yoink-fab";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dg-yoink-btn";
    btn.title = "Yoink this Quizlet set into DeckGrab";

    const emoji = document.createElement("span");
    emoji.className = "dg-yoink-emoji";
    emoji.textContent = "🦺";
    btn.appendChild(emoji);

    const label = document.createElement("span");
    label.className = "dg-yoink-label";
    label.textContent = "Yoink to DeckGrab";
    btn.appendChild(label);

    const status = document.createElement("div");
    status.className = "dg-yoink-status";
    wrap.appendChild(btn);
    wrap.appendChild(status);

    btn.addEventListener("click", () => yoink(btn, status));
    document.body.appendChild(wrap);
  }

  async function yoink(btn, status) {
    btn.disabled = true;
    setStatus(status, "Scrolling to load all terms…");
    await scrollToBottomToHydrate();

    setStatus(status, "Reading flashcards…");
    const cards = scrapeCards();

    if (!cards.length) {
      setStatus(status, "Couldn't find any cards on this page.", "error");
      btn.disabled = false;
      return;
    }

    setStatus(status, "✓ Got " + cards.length + " — opening DeckGrab…", "ok");
    const tsv = cards.map((c) => c.t + "\t" + c.d).join("\n");
    const url =
      "https://deckgrab.pages.dev/#/cards?n=" +
      cards.length +
      "&d=" +
      encodeURIComponent(tsv);
    window.open(url, "_blank", "noopener");
    setTimeout(() => {
      btn.disabled = false;
      setStatus(status, "");
    }, 1800);
  }

  function setStatus(el, msg, kind) {
    el.textContent = msg || "";
    el.className =
      "dg-yoink-status" + (kind ? " is-" + kind : "") + (msg ? " is-visible" : "");
  }

  // Quizlet lazy-loads cards as you scroll. Force them all to render
  // by scrolling to the bottom in increments and waiting for the page
  // height to stop growing.
  async function scrollToBottomToHydrate() {
    let lastHeight = 0;
    for (let i = 0; i < 24; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(350);
      if (document.body.scrollHeight === lastHeight && i > 3) break;
      lastHeight = document.body.scrollHeight;
    }
    window.scrollTo(0, 0);
    await sleep(150);
  }

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // ---- Scraper logic — same as the DeckGrab bookmarklet -----------

  function scrapeCards() {
    const cards = [];
    const seen = new Set();
    const HEADER = new Set([
      "term", "word", "question", "prompt", "front",
      "definition", "meaning", "answer", "translation", "back",
    ]);
    const sanitize = (s) =>
      String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    const add = (t, d) => {
      t = sanitize(t);
      d = sanitize(d);
      if (!t || !d || t === d) return;
      if (t.length > 500 || d.length > 2000) return;
      const tl = t.toLowerCase(), dl = d.toLowerCase();
      if (HEADER.has(tl) && HEADER.has(dl)) return;
      const k = t + " " + d;
      if (seen.has(k)) return;
      seen.add(k);
      cards.push({ t: t, d: d });
    };

    const pickText = (side) => {
      if (!side) return null;
      if (typeof side.text === "string") return side.text;
      if (typeof side.content === "string") return side.content;
      if (typeof side.plainText === "string") return side.plainText;
      if (Array.isArray(side.media) && side.media[0]) {
        const m = side.media[0];
        if (typeof m.text === "string") return m.text;
        if (typeof m.plainText === "string") return m.plainText;
        if (typeof m.content === "string") return m.content;
        if (m.richText && typeof m.richText.html === "string") return m.richText.html;
      }
      if (side.richText && typeof side.richText.html === "string") return side.richText.html;
      return null;
    };

    const PAIRS = [
      ["word", "definition"], ["term", "definition"],
      ["prompt", "answer"], ["front", "back"],
      ["frontText", "backText"], ["question", "answer"],
      ["side1Text", "side2Text"], ["termText", "definitionText"],
      ["side1", "side2"],
    ];
    const walk = (o) => {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      for (const [a, b] of PAIRS) {
        if (typeof o[a] === "string" && typeof o[b] === "string") add(o[a], o[b]);
      }
      if (o.cardSides) {
        const sides = Array.isArray(o.cardSides) ? o.cardSides : Object.values(o.cardSides);
        if (sides.length >= 2) {
          const t = pickText(sides[0]);
          const d = pickText(sides[1]);
          if (t && d) add(t, d);
        }
      }
      if (o.studiableItem || o.studyableItem) {
        const it = o.studiableItem || o.studyableItem;
        if (it && it.cardSides) {
          const sides = Array.isArray(it.cardSides) ? it.cardSides : Object.values(it.cardSides);
          if (sides.length >= 2) {
            const t = pickText(sides[0]);
            const d = pickText(sides[1]);
            if (t && d) add(t, d);
          }
        }
      }
      for (const k in o) walk(o[k]);
    };

    const nd = document.getElementById("__NEXT_DATA__");
    if (nd) {
      try { walk(JSON.parse(nd.textContent)); } catch (e) {}
    }

    if (cards.length < 3) {
      document.querySelectorAll("script").forEach((s) => {
        const x = s.textContent || "";
        const re = /"word":"((?:[^"\\]|\\.)*)","definition":"((?:[^"\\]|\\.)*)"/g;
        const matches = x.matchAll(re);
        for (const m of matches) {
          try { add(JSON.parse('"' + m[1] + '"'), JSON.parse('"' + m[2] + '"')); } catch (e) {}
        }
      });
    }

    if (cards.length < 3) {
      const TS = [
        '[data-testid*="word"]', '[data-testid*="term"]',
        '[data-test*="word"]', '[data-test*="term"]',
        '[class*="wordText"]', '[class*="TermText"][class*="word"]',
        '[class*="SetPageTerm-word"]', '[class*="Term__word"]',
        '[class*="Term__term"]', ".SetPageTerm-word",
      ];
      const DS = [
        '[data-testid*="definition"]', '[data-test*="definition"]',
        '[class*="definitionText"]', '[class*="TermText"][class*="definition"]',
        '[class*="SetPageTerm-definition"]', '[class*="Term__definition"]',
        ".SetPageTerm-definition",
      ];
      const CONT =
        '[class*="SetPageTerm"],[class*="erm-content"],li[id*="term"],' +
        '[data-testid*="term-card"],[data-testid*="set-page-term"],' +
        '[class*="TermPair"],[class*="StudySetPageTerm"],article[class*="Term"],' +
        '[class*="set-page-term"],[class*="flashcard"]';
      const SKIP = (n) => {
        if (!n) return true;
        if (n.querySelector("video,iframe,canvas")) return true;
        const al = (n.getAttribute && (n.getAttribute("aria-label") || "")) || "";
        if (/video player|playback speed|fullscreen/i.test(al)) return true;
        const role = (n.getAttribute && (n.getAttribute("role") || "")) || "";
        if (role === "dialog" || role === "banner" || role === "alert" || role === "status") return true;
        return false;
      };
      const containers = document.querySelectorAll(CONT);
      containers.forEach((n) => {
        if (SKIP(n)) return;
        let tEl = null, dEl = null;
        for (const s of TS) if (!tEl) tEl = n.querySelector(s);
        for (const s of DS) if (!dEl) dEl = n.querySelector(s);
        if (tEl && dEl) add(tEl.innerText || tEl.textContent, dEl.innerText || dEl.textContent);
      });
      if (cards.length < 3) {
        containers.forEach((n) => {
          if (SKIP(n)) return;
          if (n.querySelector("h1,h2,h3,h4,h5,h6")) return;
          const txt = (n.innerText || n.textContent || "").trim();
          if (!txt || txt.length > 1200) return;
          const lines = txt.split(/\n+/).map((s) => s.trim()).filter((s) => s.length >= 1 && s.length <= 400);
          if (lines.length >= 2 && lines[0].length <= 120) add(lines[0], lines[1]);
        });
      }
    }

    return cards;
  }

  // ---- SPA navigation handling ------------------------------------

  maybeMount();
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      setTimeout(maybeMount, 400);
    }
  }, 500);
  window.addEventListener("popstate", () => setTimeout(maybeMount, 400));
})();
