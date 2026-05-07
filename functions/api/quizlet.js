// Cloudflare Pages Function — server-side Quizlet set fetcher.
//
// Endpoint: POST /api/quizlet  (or GET with ?url=…)
// Body / query: { url: "https://quizlet.com/<id>/<slug>" }
//
// Why server-side? Browser fetch() to quizlet.com is blocked by CORS,
// and iOS Safari's bookmarklet path is annoying. With this Function
// the user just pastes a URL into the DeckGrab page and gets cards
// back without ever touching the bookmarklet.
//
// Strategy: fetch the set page with a desktop User-Agent, then walk
// the embedded Next.js __NEXT_DATA__ JSON for cardSides / word /
// definition pairs — same logic the bookmarklet runs in-browser.
// We also fall back to inline-script regex if NEXT_DATA isn't there.

export async function onRequest(context) {
  const { request } = context;

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // Resolve the user-supplied URL from query string OR JSON body
  let target = "";
  try {
    const u = new URL(request.url);
    target = u.searchParams.get("url") || "";
    if (!target && request.method === "POST") {
      const body = await request.json();
      target = (body && body.url) || "";
    }
  } catch (e) { /* fall through to error response */ }

  // Validate: must be a real Quizlet set URL
  if (!target || !/^https?:\/\/(?:www\.)?quizlet\.com\/\d+\//i.test(target)) {
    return json({
      ok: false,
      error: "Provide a Quizlet set URL like https://quizlet.com/12345/title",
    }, 400, cors);
  }

  // Fetch with a desktop UA so Quizlet doesn't redirect us to mobile
  // app store. Their server-rendered HTML still embeds __NEXT_DATA__
  // even when serving mobile pages, but desktop is cleaner.
  let html = "";
  try {
    const upstream = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 " +
          "(KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!upstream.ok) {
      // 403 here usually means Quizlet's bot-detection blocked us
      // (they aggressively reject server-side fetches, even with
      // realistic browser headers). 404 means the set doesn't exist.
      const friendly = upstream.status === 403
        ? "Quizlet blocked the server fetch (their bot protection is " +
          "very aggressive). The bookmarklet path on this page still " +
          "works — drag it to your bookmarks bar (or use the iOS install " +
          "instructions below) and click it on the set page."
        : `Quizlet returned HTTP ${upstream.status}. The set may be private or moved.`;
      return json({ ok: false, error: friendly, code: upstream.status }, 502, cors);
    }
    html = await upstream.text();
  } catch (e) {
    return json({
      ok: false,
      error: "Couldn't reach Quizlet. Check the URL and try again.",
    }, 502, cors);
  }

  // Extract NEXT_DATA — Quizlet uses Next.js so the full set is
  // serialized into <script id="__NEXT_DATA__" type="application/json">.
  const cards = [];
  const seen = new Set();
  const add = (term, def) => {
    term = clean(term);
    def = clean(def);
    if (!term || !def || term === def) return;
    if (term.length > 500 || def.length > 2000) return;
    const key = term + " " + def;
    if (seen.has(key)) return;
    seen.add(key);
    cards.push({ term, definition: def });
  };

  const ndMatch = html.match(
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json"\s*>([\s\S]*?)<\/script>/
  );
  if (ndMatch) {
    try {
      const root = JSON.parse(ndMatch[1]);
      walk(root, add);
    } catch (e) { /* fall through to regex pass */ }
  }

  // Fallback: scan inline JSON-y blobs for the patterns Quizlet uses
  if (cards.length < 3) {
    const patterns = [
      /"word":"((?:[^"\\]|\\.)*)","definition":"((?:[^"\\]|\\.)*)"/g,
      /"term":"((?:[^"\\]|\\.)*)","definition":"((?:[^"\\]|\\.)*)"/g,
      /"prompt":"((?:[^"\\]|\\.)*)","answer":"((?:[^"\\]|\\.)*)"/g,
    ];
    for (const re of patterns) {
      const matches = html.matchAll(re);
      for (const m of matches) {
        try {
          const t = JSON.parse('"' + m[1] + '"');
          const d = JSON.parse('"' + m[2] + '"');
          add(t, d);
        } catch (e) { /* skip malformed */ }
      }
    }
  }

  if (!cards.length) {
    return json({
      ok: false,
      error:
        "Couldn't find any cards on that page. The set may be private, " +
        "or Quizlet may have changed their layout. Try the bookmarklet path instead.",
    }, 404, cors);
  }

  // Try to grab the set title
  let title = "";
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = clean(titleMatch[1])
      .replace(/\s*[|·]\s*Quizlet\s*$/i, "")
      .trim();
  }

  return json({
    ok: true,
    count: cards.length,
    title: title || "Quizlet set",
    cards,
  }, 200, cors);
}

// ---- helpers ---------------------------------------------------------

function clean(s) {
  return String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Recursively walk NEXT_DATA looking for term/definition pairs.
// Same heuristics the bookmarklet uses — Quizlet's JSON shape varies
// across set pages so we try several common shapes.
function walk(o, add) {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) { o.forEach(item => walk(item, add)); return; }

  const pairs = [
    ["word", "definition"],
    ["term", "definition"],
    ["prompt", "answer"],
    ["front", "back"],
    ["frontText", "backText"],
    ["question", "answer"],
    ["side1Text", "side2Text"],
    ["termText", "definitionText"],
    ["side1", "side2"],
  ];
  for (const [a, b] of pairs) {
    if (typeof o[a] === "string" && typeof o[b] === "string") {
      add(o[a], o[b]);
    }
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

  for (const k in o) walk(o[k], add);
}

function pickText(side) {
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
}

function json(payload, status, cors) {
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}
