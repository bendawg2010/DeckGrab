/* ====================================================================
   DeckGrab — Free flashcards. Study them or export them.
   Vanilla JS / hash router / no dependencies.
==================================================================== */

(() => {
  // -------- The bookmarklet source -----------------------------------
  // This string is the unminified-ish source of the page-scraping IIFE
  // that runs when the user clicks the bookmarklet on a Quizlet set page.
  // It scrapes via __NEXT_DATA__ JSON, inline scripts, then DOM, and posts
  // results back to deckgrab.pages.dev/#/cards via clipboard.
  const SCRAPER = "(async()=>{const c=[],S=new Set(),H=new Set(['term','word','question','prompt','front','side a','vocab','vocabulary','definition','meaning','answer','translation','back','side b','def']),D=s=>{try{return JSON.parse('\"'+s+'\"')}catch(e){return s}},X=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\\s+/g,' ').trim(),A=(t,d)=>{t=X(t);d=X(d);if(!t||!d||t===d||t.length>500||d.length>2000)return;const tl=t.toLowerCase(),dl=d.toLowerCase();if(H.has(tl)&&H.has(dl))return;if(d.length>t.length+2&&d.startsWith(t+' '))d=d.slice(t.length+1).trim();else if(t.length>d.length+2&&t.startsWith(d+' '))t=t.slice(d.length+1).trim();else if(d.length>t.length+2&&d.endsWith(' '+t))d=d.slice(0,d.length-t.length-1).trim();else if(t.length>d.length+2&&t.endsWith(' '+d))t=t.slice(0,t.length-d.length-1).trim();if(!t||!d||t===d)return;const k=t+'\\u0000'+d;if(S.has(k))return;S.add(k);c.push({t,d})};const G=side=>{if(!side)return null;if(typeof side.text==='string')return side.text;if(typeof side.content==='string')return side.content;if(typeof side.plainText==='string')return side.plainText;if(Array.isArray(side.media)&&side.media[0]){const m=side.media[0];if(typeof m.text==='string')return m.text;if(typeof m.plainText==='string')return m.plainText;if(typeof m.content==='string')return m.content;if(m.richText&&typeof m.richText.html==='string')return m.richText.html}if(side.richText&&typeof side.richText.html==='string')return side.richText.html;return null};const PAIRS=[['word','definition'],['term','definition'],['prompt','answer'],['front','back'],['frontText','backText'],['question','answer'],['side1Text','side2Text'],['termText','definitionText'],['side1','side2']];const b=document.createElement('div');b.style.cssText='position:fixed;top:18px;right:18px;z-index:2147483647;background:linear-gradient(135deg,#FFB454,#FF6B6B,#C147FF);color:white;padding:14px 22px;border-radius:12px;font:600 14px -apple-system,system-ui;box-shadow:0 12px 32px rgba(0,0,0,.45);max-width:380px';b.textContent='DeckGrab: scanning page\\u2026';document.body.appendChild(b);const nd=document.getElementById('__NEXT_DATA__');if(nd){try{const W=o=>{if(!o||typeof o!=='object')return;if(Array.isArray(o))return o.forEach(W);for(const[k1,k2]of PAIRS){if(typeof o[k1]==='string'&&typeof o[k2]==='string')A(o[k1],o[k2])}if(o.term&&typeof o.term==='object'){const tw=o.term.word||o.term.text||o.term.value||o.term.content;if(typeof tw==='string'){const def=typeof o.definition==='string'?o.definition:(o.term.definition||null);if(typeof def==='string')A(tw,def)}}if(o.cardSides){const s=Array.isArray(o.cardSides)?o.cardSides:Object.values(o.cardSides);if(s.length>=2){const t=G(s[0]),d=G(s[1]);if(t&&d)A(t,d)}}if(o.studiableItem||o.studyableItem){const it=o.studiableItem||o.studyableItem;if(it&&it.cardSides){const s=Array.isArray(it.cardSides)?it.cardSides:Object.values(it.cardSides);if(s.length>=2){const t=G(s[0]),d=G(s[1]);if(t&&d)A(t,d)}}}for(const k in o)W(o[k])};W(JSON.parse(nd.textContent))}catch(e){}}if(c.length<3){document.querySelectorAll('script').forEach(s=>{const x=s.textContent||'';const re1=/\"word\":\"((?:[^\"\\\\]|\\\\.)*)\",\"definition\":\"((?:[^\"\\\\]|\\\\.)*)\"/g;for(const m of x.matchAll(re1))A(D(m[1]),D(m[2]));const re2=/\"term\":\"((?:[^\"\\\\]|\\\\.)*)\",\"definition\":\"((?:[^\"\\\\]|\\\\.)*)\"/g;for(const m of x.matchAll(re2))A(D(m[1]),D(m[2]));const re3=/\"prompt\":\"((?:[^\"\\\\]|\\\\.)*)\",\"answer\":\"((?:[^\"\\\\]|\\\\.)*)\"/g;for(const m of x.matchAll(re3))A(D(m[1]),D(m[2]))})}b.textContent='DeckGrab: loading lazy cards\\u2026';let lh=0;for(let i=0;i<24;i++){window.scrollTo(0,document.body.scrollHeight);await new Promise(r=>setTimeout(r,400));if(document.body.scrollHeight===lh&&i>3)break;lh=document.body.scrollHeight}window.scrollTo(0,0);await new Promise(r=>setTimeout(r,200));const TS=['[data-testid*=\"word\"]','[data-testid*=\"term\"]','[data-testid=\"word-text\"]','[data-testid=\"term-text\"]','[class*=\"wordText\"]','[class*=\"TermText\"][class*=\"word\"]','[class*=\"SetPageTerm-word\"]','[class*=\"Term__word\"]','[class*=\"Term__term\"]','.SetPageTerm-word'];const DS=['[data-testid*=\"definition\"]','[data-testid=\"definition-text\"]','[class*=\"definitionText\"]','[class*=\"TermText\"][class*=\"definition\"]','[class*=\"SetPageTerm-definition\"]','[class*=\"Term__definition\"]','.SetPageTerm-definition'];const CONT='[class*=\"SetPageTerm\"],[class*=\"erm-content\"],li[id*=\"term\"],[data-testid*=\"term-card\"],[data-testid*=\"set-page-term\"],[class*=\"TermPair\"],[class*=\"StudySetPageTerm\"],article[class*=\"Term\"]';const SKIP=n=>{if(!n)return true;if(n.querySelector('video,iframe,canvas'))return true;const al=(n.getAttribute&&(n.getAttribute('aria-label')||''))||'';if(/video player|playback speed|fullscreen/i.test(al))return true;const role=(n.getAttribute&&(n.getAttribute('role')||''))||'';if(role==='dialog'||role==='banner'||role==='alert'||role==='status')return true;return false};const containers=document.querySelectorAll(CONT);containers.forEach(n=>{if(SKIP(n))return;let tEl=null,dEl=null;for(const s of TS){if(!tEl)tEl=n.querySelector(s)}for(const s of DS){if(!dEl)dEl=n.querySelector(s)}if(tEl&&dEl)A(tEl.innerText||tEl.textContent,dEl.innerText||dEl.textContent)});if(!c.length){const t1=document.createElement('div');t1.style.fontWeight='800';t1.textContent='DeckGrab: no cards found';const t2=document.createElement('div');t2.style.cssText='font-size:12px;opacity:.85;margin-top:6px';t2.textContent='Tried: NEXT_DATA, scripts, '+containers.length+' DOM containers.';const t3=document.createElement('div');t3.style.cssText='font-size:12px;opacity:.85;margin-top:4px';t3.textContent='Open the Quizlet set page (URL like /12345/title), wait for terms to load, then click again.';b.textContent='';b.appendChild(t1);b.appendChild(t2);b.appendChild(t3);b.style.background='#FF3B30';setTimeout(()=>b.remove(),9000);return}const out=c.map(o=>o.t+'\\t'+o.d).join('\\n');let cp=false;try{await navigator.clipboard.writeText(out);cp=true}catch(e){}b.textContent='DeckGrab: got '+c.length+' cards! Opening\\u2026';setTimeout(()=>b.remove(),2500);const url='https://deckgrab.pages.dev/#/cards?n='+c.length+(cp?'&c=1':'');try{window.open(url,'_blank')}catch(e){}})();";

  const BOOKMARKLET = "javascript:" + encodeURIComponent(SCRAPER);

  // -------- Safari "simple version" bookmarklet ----------------------
  // Fully synchronous scraper. Doesn't open a new tab automatically
  // (Safari blocks window.open after async work). Instead it paints an
  // inline overlay on top of the Quizlet page with a card preview, a
  // "Copy TSV" button (uses document.execCommand) and an "Open in
  // DeckGrab →" link the user clicks themselves — that click counts as
  // a fresh user gesture that Safari allows. No await, no clipboard
  // API, no popup dance.
  const SCRAPER_SIMPLE = "(()=>{const c=[],S=new Set(),H=new Set(['term','word','question','prompt','front','definition','meaning','answer','translation','back']),X=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\\s+/g,' ').trim(),A=(t,d)=>{t=X(t);d=X(d);if(!t||!d||t===d||t.length>500||d.length>2000)return;const tl=t.toLowerCase(),dl=d.toLowerCase();if(H.has(tl)&&H.has(dl))return;if(d.length>t.length+2&&d.startsWith(t+' '))d=d.slice(t.length+1).trim();else if(t.length>d.length+2&&t.startsWith(d+' '))t=t.slice(d.length+1).trim();else if(d.length>t.length+2&&d.endsWith(' '+t))d=d.slice(0,d.length-t.length-1).trim();else if(t.length>d.length+2&&t.endsWith(' '+d))t=t.slice(0,t.length-d.length-1).trim();if(!t||!d||t===d)return;const k=t+'\\u0000'+d;if(S.has(k))return;S.add(k);c.push({t,d})};const SK=n=>{if(!n)return true;if(n.querySelector&&n.querySelector('video,iframe,canvas'))return true;const al=(n.getAttribute&&(n.getAttribute('aria-label')||''))||'';if(/video player|playback speed|fullscreen/i.test(al))return true;const role=(n.getAttribute&&(n.getAttribute('role')||''))||'';if(role==='dialog'||role==='banner'||role==='alert'||role==='status')return true;return false};const G=side=>{if(!side)return null;if(typeof side.text==='string')return side.text;if(typeof side.content==='string')return side.content;if(typeof side.plainText==='string')return side.plainText;if(Array.isArray(side.media)&&side.media[0]){const m=side.media[0];if(typeof m.text==='string')return m.text;if(typeof m.plainText==='string')return m.plainText;if(typeof m.content==='string')return m.content}return null};const PAIRS=[['word','definition'],['term','definition'],['prompt','answer'],['front','back'],['frontText','backText'],['question','answer'],['side1Text','side2Text'],['termText','definitionText']];const nd=document.getElementById('__NEXT_DATA__');if(nd){try{const W=o=>{if(!o||typeof o!=='object')return;if(Array.isArray(o))return o.forEach(W);for(const[k1,k2]of PAIRS){if(typeof o[k1]==='string'&&typeof o[k2]==='string')A(o[k1],o[k2])}if(o.cardSides){const s=Array.isArray(o.cardSides)?o.cardSides:Object.values(o.cardSides);if(s.length>=2){const t=G(s[0]),d=G(s[1]);if(t&&d)A(t,d)}}for(const k in o)W(o[k])};W(JSON.parse(nd.textContent))}catch(e){}}if(c.length<3){document.querySelectorAll('script').forEach(s=>{const x=s.textContent||'';const re=/\"word\":\"((?:[^\"\\\\]|\\\\.)*)\",\"definition\":\"((?:[^\"\\\\]|\\\\.)*)\"/g;for(const m of x.matchAll(re)){try{A(JSON.parse('\"'+m[1]+'\"'),JSON.parse('\"'+m[2]+'\"'))}catch(e){}}});}const TS=['[data-testid*=\"word\"]','[data-testid*=\"term\"]','[class*=\"wordText\"]','[class*=\"TermText\"][class*=\"word\"]','[class*=\"SetPageTerm-word\"]','[class*=\"Term__word\"]','.SetPageTerm-word'];const DS=['[data-testid*=\"definition\"]','[class*=\"definitionText\"]','[class*=\"TermText\"][class*=\"definition\"]','[class*=\"SetPageTerm-definition\"]','[class*=\"Term__definition\"]','.SetPageTerm-definition'];const CONT='[class*=\"SetPageTerm\"],[class*=\"erm-content\"],li[id*=\"term\"],[data-testid*=\"term-card\"],[data-testid*=\"set-page-term\"],[class*=\"TermPair\"],[class*=\"StudySetPageTerm\"],article[class*=\"Term\"]';document.querySelectorAll(CONT).forEach(n=>{if(SK(n))return;let tEl=null,dEl=null;for(const s of TS){if(!tEl)tEl=n.querySelector(s)}for(const s of DS){if(!dEl)dEl=n.querySelector(s)}if(tEl&&dEl)A(tEl.innerText||tEl.textContent,dEl.innerText||dEl.textContent)});if(!c.length){alert('DeckGrab: no cards found. Try scrolling the Quizlet page to the bottom first to load every card, then click the bookmark again.');return}const out=c.map(o=>o.t+'\\t'+o.d).join('\\n');const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:rgba(8,4,18,0.92);backdrop-filter:blur(10px);z-index:2147483647;display:grid;place-items:center;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;animation:dgo 0.2s ease-out';const sty=document.createElement('style');sty.textContent='@keyframes dgo{from{opacity:0}to{opacity:1}}@keyframes dgs{from{transform:scale(0.94);opacity:0}to{transform:scale(1);opacity:1}}';document.head.appendChild(sty);const card=document.createElement('div');card.style.cssText='position:relative;background:linear-gradient(180deg,#1f1525 0%,#150a18 100%);border:1px solid rgba(255,255,255,0.10);border-radius:24px;padding:32px;max-width:540px;width:90%;color:white;box-shadow:0 32px 80px rgba(0,0,0,0.65);animation:dgs 0.32s cubic-bezier(0.18,0.78,0.36,1)';const eb=document.createElement('div');eb.textContent='SAFARI SIMPLE MODE';eb.style.cssText='display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(15,181,238,0.16);border:1px solid rgba(15,181,238,0.40);color:#5fc5ed;font-size:11px;font-weight:800;letter-spacing:1.2px;margin-bottom:14px';card.appendChild(eb);const title=document.createElement('h1');title.textContent='Got '+c.length+' cards';title.style.cssText='font-size:36px;font-weight:800;letter-spacing:-1.2px;margin:0 0 8px;background:linear-gradient(135deg,#FFB454,#FF6B6B,#C147FF);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1.05';card.appendChild(title);const sub=document.createElement('p');sub.textContent='Tap a button below to copy or open them in DeckGrab.';sub.style.cssText='font-size:14px;color:rgba(255,255,255,0.62);margin:0 0 20px;font-weight:500;line-height:1.5';card.appendChild(sub);const pv=document.createElement('div');pv.style.cssText='background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:8px 14px;margin-bottom:20px;max-height:200px;overflow-y:auto';c.slice(0,5).forEach((o,i)=>{const r=document.createElement('div');r.style.cssText='display:flex;justify-content:space-between;gap:14px;padding:8px 0;font-size:13px;'+(i<Math.min(c.length-1,4)?'border-bottom:1px solid rgba(255,255,255,0.05)':'');const tt=document.createElement('span');tt.textContent=o.t;tt.style.cssText='font-weight:700;letter-spacing:-0.2px;flex-shrink:0;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';const dd=document.createElement('span');dd.textContent=o.d;dd.style.cssText='color:rgba(255,255,255,0.62);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';r.appendChild(tt);r.appendChild(dd);pv.appendChild(r)});if(c.length>5){const m=document.createElement('div');m.textContent='\\u2026 + '+(c.length-5)+' more';m.style.cssText='font-size:11px;color:rgba(255,255,255,0.45);font-weight:700;text-align:center;padding:8px 0;letter-spacing:0.4px';pv.appendChild(m)}card.appendChild(pv);const br=document.createElement('div');br.style.cssText='display:flex;gap:10px';const cp=document.createElement('button');cp.textContent='\\ud83d\\udccb Copy TSV';cp.type='button';cp.style.cssText='flex:1;padding:14px 18px;border-radius:14px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.16);color:white;font-size:14px;font-weight:800;letter-spacing:-0.2px;cursor:pointer;font-family:inherit';cp.onclick=function(){const ta=document.createElement('textarea');ta.value=out;ta.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(ta);cp.textContent=ok?'\\u2713 Copied!':'Copy failed';setTimeout(()=>{cp.textContent='\\ud83d\\udccb Copy TSV'},1800)};const op=document.createElement('a');op.textContent='Open in DeckGrab \\u2192';op.target='_blank';op.rel='noopener';op.style.cssText='flex:1.2;padding:14px 22px;border-radius:14px;background:linear-gradient(135deg,#FFB454,#FF6B6B,#C147FF);color:white;font-size:15px;font-weight:800;letter-spacing:-0.2px;text-decoration:none;text-align:center;box-shadow:0 12px 36px rgba(193,71,255,0.45);cursor:pointer';op.href='https://deckgrab.pages.dev/#/cards?n='+c.length;op.onclick=function(){const ta=document.createElement('textarea');ta.value=out;ta.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(ta);if(ok)op.href='https://deckgrab.pages.dev/#/cards?n='+c.length+'&c=1'};br.appendChild(cp);br.appendChild(op);card.appendChild(br);const cl=document.createElement('button');cl.textContent='\\u00d7';cl.type='button';cl.style.cssText='position:absolute;top:14px;right:14px;background:transparent;border:none;color:rgba(255,255,255,0.45);font-size:26px;cursor:pointer;width:36px;height:36px;border-radius:8px;font-family:inherit;line-height:1';cl.onclick=()=>ov.remove();card.appendChild(cl);ov.onclick=function(e){if(e.target===ov)ov.remove()};ov.appendChild(card);document.body.appendChild(ov)})();";

  const BOOKMARKLET_SIMPLE = "javascript:" + encodeURIComponent(SCRAPER_SIMPLE);

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
      el("p", null, "Drop the bookmark. Click it on any Quizlet set. Study right here, or export your cards as TSV, CSV, JSON, or Anki. No login. Open source."),
    );
    root.appendChild(hero);

    // The bookmarklet drag zone
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
      el("div", { class: "pill-row" }, pill),
      el("div", { class: "dg-bookmark-instructions" },
        el("strong", null, "Drag this button"),
        " up to your browser’s ",
        el("strong", null, "bookmarks bar"),
        ". Click it on any Quizlet set page to import.",
      ),
      // Browser support notice — point Safari users to the simple version below
      el("div", { class: "dg-safari-notice", role: "note" },
        el("span", { class: "dg-safari-notice-icon", "aria-hidden": "true" }, "⚠"),
        el("div", null,
          el("strong", null, "On Safari?"),
          " The button above won’t work — Safari blocks the popup it opens. Use the ",
          el("strong", null, "Simple version (Safari)"),
          " below instead. It runs differently and stays on the page.",
        ),
      ),
      // Helpful tip for users without a bookmarks bar visible
      makeBookmarkBarHelp(),
      // Manual-install fallback (collapsed by default)
      makeManualBookmarkFallback(),
    );
    root.appendChild(drop);

    // ---- Safari-friendly alternate bookmarklet ----
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
      el("div", { class: "dg-pill-eyebrow" }, "Simple version · for Safari"),
      el("div", { class: "pill-row" }, simplePill),
      el("div", { class: "dg-bookmark-instructions" },
        el("strong", null, "Drag this button"),
        " to your bookmarks bar instead. It works ",
        el("strong", null, "differently"),
        " — when you click it on a Quizlet set, it shows the cards in an overlay right on the page with ",
        el("em", null, "Copy"),
        " and ",
        el("em", null, "Open in DeckGrab"),
        " buttons. No popups, no automatic redirect.",
      ),
      el("ul", { class: "dg-simple-notes" },
        el("li", null,
          el("strong", null, "Scroll the Quizlet page to the bottom first"),
          " — this version doesn’t auto-load lazy cards.",
        ),
        el("li", null, "Tap ", el("strong", null, "Copy TSV"), " to put the cards on your clipboard, or ", el("strong", null, "Open in DeckGrab →"), " to send them straight to the study app."),
        el("li", null, "Use the original ", el("strong", null, "⭐ Grab cards"), " button above on Chrome / Firefox / Edge / Brave / Arc — it’s smoother."),
      ),
    );
    root.appendChild(simpleZone);

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
        path: "Not supported yet — try Chrome / Firefox", unsupported: true },
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

    const wrapper = el("section", { class: "dg-receiver" });
    root.appendChild(wrapper);

    let raw = "";
    if (fromClipboard) {
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
    if (fromClipboard && raw) {
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
    try {
      await navigator.clipboard.writeText(buildTSV());
    } catch (e) {
      toast("Couldn’t copy to clipboard — open StudyDeck and paste manually");
    }
    window.open(`https://studydeck.pages.dev/#/import-quizlet?n=${CURRENT_CARDS.length}&c=1`, "_blank");
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
