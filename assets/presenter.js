// slidetime presenter — parser + render + timer + keyboard
// Depends on global `marked` (loaded from CDN in index.html).

(() => {
  const DEFAULT_SLIDE_SEC = 120;
  const WARN_RATIO = 0.7;

  // Placeholder uses SOH () as delimiter so it cannot appear in author
  // markdown source and cannot match the slide splitter or directive regex.
  const MASK_OPEN = "";
  const MASK_CLOSE = "";

  const $ = (sel) => document.querySelector(sel);
  const stage = $("#stage");
  const slideTimerEl = $("#slide-timer");
  const totalTimerEl = $("#total-timer");
  const slideCounterEl = $("#slide-counter");
  const progressBar = $("#progress-bar");
  const helpDialog = $("#help");
  const overviewDialog = $("#overview");
  const overviewGrid = $("#overview-grid");

  // Popout speaker-notes window. Kept in a separate OS window so a presenter
  // can share just the deck tab/window in Meet/Zoom while still seeing notes.
  let notesWindow = null;
  let notesWindowEls = null;

  // --- markdown loading -----------------------------------------------------

  function resolveSrc() {
    if (typeof window.SLIDETIME_SRC === "string" && window.SLIDETIME_SRC) {
      return window.SLIDETIME_SRC;
    }
    const params = new URLSearchParams(location.search);
    return params.get("src") || "examples/demo-lesson.md";
  }

  async function loadMarkdown(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
    return await res.text();
  }

  // --- parsing --------------------------------------------------------------

  // Strip recognised HTML-comment directives from a chunk and report what
  // was found.  Run on a code-masked copy so that example markdown inside
  // backticks isn't accidentally consumed.
  function extractDirectives(chunk) {
    const directives = { time: null, notes: null, total: null };
    const body = chunk.replace(
      /<!--\s*(time|notes|total)\s*:\s*([\s\S]*?)\s*-->/g,
      (_, key, val) => {
        if (key === "time" || key === "total") {
          const n = parseFloat(val);
          if (!isNaN(n)) directives[key] = n;
        } else {
          directives.notes = val.trim();
        }
        return "";
      },
    );
    return { body, directives };
  }

  // Strip time hints like "— 2 min" or "(2 min)" from a heading-line tail.
  function stripTimeHint(s) {
    return s
      .replace(/\s*[—\-]\s*~?\d+(?:\.\d+)?\s*min.*$/i, "")
      .replace(/\s*\(\s*~?\d+(?:\.\d+)?\s*min\s*\)\s*$/i, "")
      .trim();
  }

  function extractTitle(body) {
    const m = body.match(/^\s{0,3}#{1,3}\s+(.+?)\s*$/m);
    return m ? stripTimeHint(m[1]) : "Untitled";
  }

  // Remove the time-hint suffix from the first heading line in place so the
  // rendered slide doesn't surface "— 2 min" to the audience.
  function cleanRenderedHeadings(body) {
    return body.replace(
      /^(\s{0,3}#{1,3}\s+)(.+?)\s*$/m,
      (_, hashes, text) => hashes + stripTimeHint(text),
    );
  }

  function timingFromHeadings(body) {
    const headings = body.match(/^#{1,3}\s+.+$/gm) || [];
    for (const h of headings) {
      let m = h.match(/[—\-]\s*~?(\d+(?:\.\d+)?)\s*min/i);
      if (m) return parseFloat(m[1]) * 60;
      m = h.match(/\(\s*~?(\d+(?:\.\d+)?)\s*min\s*\)/i);
      if (m) return parseFloat(m[1]) * 60;
    }
    return null;
  }

  function notesFromBlockquote(body) {
    const m = body.match(/^>\s*Note:\s*(.+?)(?:\n\s*\n|\n[^>]|$)/ims);
    return m ? m[1].replace(/\n>\s*/g, "\n").trim() : null;
  }

  function rewriteImagePaths(md, baseUrl) {
    const base = new URL(baseUrl, location.href);
    return md.replace(/!\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g, (full, alt, path, rest) => {
      if (/^(https?:|data:|\/)/i.test(path)) return full;
      const resolved = new URL(path, base).href;
      return "![" + alt + "](" + resolved + rest + ")";
    });
  }

  // Replace fenced + inline code with opaque placeholders so the slide
  // splitter and directive extractor can't accidentally consume `---`
  // or HTML comments that the author intends as literal content.
  function maskCode(md) {
    const fences = [];
    const swap = (m) => {
      fences.push(m);
      return MASK_OPEN + (fences.length - 1) + MASK_CLOSE;
    };
    let masked = md.replace(/```[\s\S]*?```/g, swap);
    masked = masked.replace(/`[^`\n]+`/g, swap);
    return { masked, fences };
  }

  const UNMASK_RE = new RegExp(MASK_OPEN + "(\\d+)" + MASK_CLOSE, "g");

  function unmaskCode(s, fences) {
    return s.replace(UNMASK_RE, (_, i) => fences[+i]);
  }

  function parseSlides(md, baseUrl) {
    const { masked, fences } = maskCode(md);
    const rewrittenMasked = rewriteImagePaths(masked, baseUrl);
    const maskedChunks = rewrittenMasked
      .split(/^---\s*$/m)
      .map((c) => c.trim())
      .filter((c) => c.length);

    let totalOverride = null;
    const slides = maskedChunks.map((maskedChunk, i) => {
      const { body: maskedBody, directives } = extractDirectives(maskedChunk);
      if (i === 0 && directives.total != null) totalOverride = directives.total * 60;
      const rawBody = unmaskCode(maskedBody, fences);
      const title = extractTitle(rawBody);
      let timeSec;
      if (directives.time != null) timeSec = directives.time * 60;
      else {
        const fromHeading = timingFromHeadings(rawBody);
        timeSec = fromHeading != null ? fromHeading : DEFAULT_SLIDE_SEC;
      }
      const notes = directives.notes || notesFromBlockquote(rawBody);
      return {
        index: i,
        title,
        bodyMarkdown: cleanRenderedHeadings(rawBody).trim(),
        bodyHtml: null,
        timeBudgetSec: timeSec,
        notes,
      };
    });

    const totalBudgetSec = totalOverride != null
      ? totalOverride
      : slides.reduce((s, x) => s + x.timeBudgetSec, 0);
    return { slides, totalBudgetSec };
  }

  // --- popout notes ---------------------------------------------------------

  function ensureNotesWindow() {
    if (notesWindow && !notesWindow.closed) return notesWindow;
    const w = window.open("", "slidetime-notes", "popup,width=540,height=720");
    if (!w) return null; // blocked
    w.document.open();
    w.document.write(
      '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<title>Speaker notes — slidetime</title>' +
      '<style>' +
      ':root{color-scheme:dark}' +
      'body{margin:0;padding:1.5rem 1.75rem;background:#0a0a0a;color:#eaeaea;' +
      'font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}' +
      'header{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;' +
      'color:#888;margin-bottom:.5rem}' +
      '#counter{font-size:.75rem;color:#888;margin-bottom:1rem}' +
      '#title{font-size:1.05rem;font-weight:600;margin:0 0 1rem;color:#fff}' +
      '#body{font-size:1.1rem;white-space:pre-wrap}' +
      '#body.empty{color:#666;font-style:italic}' +
      '</style></head><body>' +
      '<header>Speaker notes</header>' +
      '<div id="counter">— / —</div>' +
      '<h1 id="title">—</h1>' +
      '<div id="body" class="empty">(no notes for this slide)</div>' +
      '</body></html>',
    );
    w.document.close();
    notesWindow = w;
    notesWindowEls = {
      counter: w.document.getElementById("counter"),
      title: w.document.getElementById("title"),
      body: w.document.getElementById("body"),
    };
    return w;
  }

  function updateNotesWindow(i, deck) {
    if (!notesWindow || notesWindow.closed || !notesWindowEls) return;
    const slide = deck.slides[i];
    notesWindowEls.counter.textContent = (i + 1) + " / " + deck.slides.length;
    notesWindowEls.title.textContent = slide.title;
    if (slide.notes) {
      notesWindowEls.body.textContent = slide.notes;
      notesWindowEls.body.classList.remove("empty");
    } else {
      notesWindowEls.body.textContent = "(no notes for this slide)";
      notesWindowEls.body.classList.add("empty");
    }
  }

  function openNotesWindow(i, deck) {
    const w = ensureNotesWindow();
    if (!w) return;
    updateNotesWindow(i, deck);
    try { w.focus(); } catch (_) { /* ignore cross-window focus errors */ }
  }

  // --- rendering ------------------------------------------------------------

  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ":" + s.toString().padStart(2, "0");
  }

  function layoutFor(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    const children = Array.from(div.children);
    const headings = children.filter((el) => /^H[1-3]$/.test(el.tagName));
    const paragraphs = children.filter((el) => el.tagName === "P");
    const figures = children.filter((el) => el.tagName === "FIGURE");
    const imgOnlyParagraphs = paragraphs.filter(
      (p) => p.children.length === 1 && p.children[0].tagName === "IMG" && !p.textContent.trim(),
    );
    if (children.length === headings.length && headings.length === 1) return "title";
    if (figures.length === 1 && paragraphs.length <= 1) return "figure";
    if (imgOnlyParagraphs.length === 1 && paragraphs.length <= 2) return "figure";
    return "default";
  }

  function renderSlide(i, deck) {
    const slide = deck.slides[i];
    if (slide.bodyHtml == null) slide.bodyHtml = marked.parse(slide.bodyMarkdown);
    stage.innerHTML = slide.bodyHtml;
    stage.dataset.layout = layoutFor(slide.bodyHtml);
    slideCounterEl.textContent = (i + 1) + " / " + deck.slides.length;
    updateNotesWindow(i, deck);
    const wantedHash = "#" + (i + 1);
    if (location.hash !== wantedHash) {
      history.replaceState(null, "", location.pathname + location.search + wantedHash);
    }
  }

  // --- timers ---------------------------------------------------------------

  class Timer {
    constructor(deck) {
      this.deck = deck;
      this.paused = false;
      this.totalElapsed = 0;
      this.slideElapsed = 0;
      this.lastTick = Date.now();
      this.currentSlideIdx = 0;
    }
    setSlide(i) {
      this.currentSlideIdx = i;
      this.slideElapsed = 0;
      this.lastTick = Date.now();
      this.render();
    }
    resetSlide() {
      this.slideElapsed = 0;
      this.lastTick = Date.now();
      this.render();
    }
    togglePause() {
      this.paused = !this.paused;
      this.lastTick = Date.now();
      this.render();
    }
    tick() {
      const now = Date.now();
      const dt = (now - this.lastTick) / 1000;
      this.lastTick = now;
      if (!this.paused) {
        this.slideElapsed += dt;
        this.totalElapsed += dt;
      }
      this.render();
    }
    paint(el, elapsed, budget) {
      const remaining = budget - elapsed;
      const ratio = elapsed / budget;
      el.classList.remove("ok", "warn", "over");
      let state, value;
      if (ratio > 1) {
        state = "over";
        value = "+" + fmt(-remaining);
      } else if (ratio >= WARN_RATIO) {
        state = "warn";
        value = fmt(remaining);
      } else {
        state = "ok";
        value = fmt(remaining);
      }
      el.classList.add(state);
      el.querySelector(".value").textContent = value;
    }
    render() {
      const slide = this.deck.slides[this.currentSlideIdx];
      this.paint(slideTimerEl, this.slideElapsed, slide.timeBudgetSec);
      this.paint(totalTimerEl, this.totalElapsed, this.deck.totalBudgetSec);
      const pct = Math.min(100, (this.totalElapsed / this.deck.totalBudgetSec) * 100);
      progressBar.style.width = pct + "%";
      progressBar.classList.toggle("over", this.totalElapsed > this.deck.totalBudgetSec);
      slideTimerEl.classList.toggle("paused", this.paused);
      totalTimerEl.classList.toggle("paused", this.paused);
    }
  }

  // --- overview grid --------------------------------------------------------

  function buildOverview(deck, currentIdx, goto) {
    overviewGrid.innerHTML = "";
    deck.slides.forEach((slide, i) => {
      if (slide.bodyHtml == null) slide.bodyHtml = marked.parse(slide.bodyMarkdown);
      const card = document.createElement("button");
      card.className = "overview-card";
      if (i === currentIdx) card.classList.add("current");
      const thumb = document.createElement("div");
      thumb.className = "overview-thumb";
      const thumbInner = document.createElement("div");
      thumbInner.className = "overview-thumb-inner";
      thumbInner.innerHTML = slide.bodyHtml;
      thumb.appendChild(thumbInner);
      const meta = document.createElement("div");
      meta.className = "overview-meta";
      const num = document.createElement("span");
      num.className = "overview-num";
      num.textContent = String(i + 1);
      const title = document.createElement("span");
      title.className = "overview-title";
      title.textContent = slide.title;
      const budget = document.createElement("span");
      budget.className = "overview-budget";
      budget.textContent = fmt(slide.timeBudgetSec);
      meta.append(num, title, budget);
      card.append(thumb, meta);
      card.addEventListener("click", () => {
        overviewDialog.close();
        goto(i);
      });
      overviewGrid.appendChild(card);
    });
  }

  // --- main -----------------------------------------------------------------

  async function main() {
    const src = resolveSrc();
    let md;
    try {
      md = await loadMarkdown(src);
    } catch (err) {
      stage.innerHTML =
        '<div class="error-card"><h2>Could not load deck</h2><p><code>' +
        escapeHtml(src) +
        "</code> — " +
        escapeHtml(err.message) +
        "</p></div>";
      return;
    }
    const deck = parseSlides(md, src);
    if (deck.slides.length === 0) {
      stage.innerHTML =
        '<div class="error-card"><h2>No slides found</h2><p>Use <code>---</code> between slides in <code>' +
        escapeHtml(src) +
        "</code>.</p></div>";
      return;
    }

    let currentIdx = 0;
    const fromHash = parseInt(location.hash.replace(/^#/, ""), 10);
    if (!isNaN(fromHash) && fromHash >= 1 && fromHash <= deck.slides.length) {
      currentIdx = fromHash - 1;
    }

    const timer = new Timer(deck);

    const goto = (i) => {
      if (i < 0 || i >= deck.slides.length) return;
      currentIdx = i;
      renderSlide(i, deck);
      timer.setSlide(i);
    };

    const next = () => goto(currentIdx + 1);
    const prev = () => goto(currentIdx - 1);

    renderSlide(currentIdx, deck);
    timer.setSlide(currentIdx);
    setInterval(() => timer.tick(), 1000);

    document.addEventListener("keydown", (e) => {
      const t = e.target;
      if (t && t.nodeType === 1 && t.matches && t.matches("input, textarea, [contenteditable]")) return;
      const k = e.key;
      if (k === "ArrowRight" || k === " " || k === "n" || k === "N" || k === "PageDown") { next(); e.preventDefault(); }
      else if (k === "ArrowLeft" || k === "p" || k === "P" || k === "PageUp") { prev(); e.preventDefault(); }
      else if (k === "Home") { goto(0); e.preventDefault(); }
      else if (k === "End") { goto(deck.slides.length - 1); e.preventDefault(); }
      else if (k === "f" || k === "F") { toggleFullscreen(); }
      else if (k === "t" || k === "T") { timer.togglePause(); }
      else if (k === "r" || k === "R") { timer.resetSlide(); }
      else if (k === "s" || k === "S") { openNotesWindow(currentIdx, deck); e.preventDefault(); }
      else if (k === "o" || k === "O") {
        buildOverview(deck, currentIdx, goto);
        overviewDialog.showModal();
      }
      else if (k === "?" || (e.shiftKey && k === "/")) { helpDialog.showModal(); }
      else if (k === "Escape") {
        if (helpDialog.open) helpDialog.close();
        if (overviewDialog.open) overviewDialog.close();
      }
    });

    $("#btn-notes").addEventListener("click", () => openNotesWindow(currentIdx, deck));
    $("#btn-pause").addEventListener("click", () => timer.togglePause());
    $("#btn-fullscreen").addEventListener("click", toggleFullscreen);

    window.addEventListener("beforeunload", () => {
      if (notesWindow && !notesWindow.closed) notesWindow.close();
    });

    window.addEventListener("hashchange", () => {
      const idx = parseInt(location.hash.replace(/^#/, ""), 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < deck.slides.length && idx !== currentIdx) goto(idx);
    });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
