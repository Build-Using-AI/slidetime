# slidetime — Architecture

## What it is

`slidetime` is a zero-build, static HTML presentation tool that turns a single markdown file into a browser-based deck with **per-slide and total-session countdown timers**. Time management is the differentiator: community lessons run on fixed clocks (e.g. a 60-min meetup with budgeted sections), and slide-by-slide visibility into "am I behind?" is the killer feature versus Reveal.js or generic slideware.

## Constraints

- **No build step.** Plain HTML / CSS / JS. Open `index.html` and it runs.
- **One runtime dependency:** [`marked@15`](https://github.com/markedjs/marked) loaded from jsDelivr.
- **Static-host friendly.** Deployable to GitHub Pages, S3, any CDN.
- **CDN-consumable.** Future `buildusingai.org/decks/<name>/index.html` files load slidetime from `https://cdn.jsdelivr.net/gh/Build-Using-AI/slidetime@v0/...` — so this repo stays content-free.

## File layout

```
slidetime/
├── index.html              entry point — standalone presenter
├── assets/
│   ├── presenter.js        parser + render + timer + keyboard
│   └── style.css           layout, HUD, timer states, print
├── examples/
│   └── demo-lesson.md      tiny synthetic deck for the tool's own demo
├── skill/
│   └── slidetime/
│       └── SKILL.md        Claude skill source — mirror to ~/.claude/skills/slidetime/
├── docs/
│   ├── ARCHITECTURE.md     this file
│   ├── DESIGN.md           visual / interaction spec
│   ├── TEST_REPORT.md      manual QA checklist + results
│   └── USER_MANUAL.md      author-facing lesson markdown reference
├── README.md
├── CLAUDE.md
├── LICENSE                 MIT
└── .gitignore
```

## Lesson markdown contract

A lesson is one markdown file. Slides are separated by horizontal-rule lines on their own:

```markdown
# Slide 1 title — 2 min

Body content for slide 1.

---

## Slide 2 title

<!-- time: 3 -->
<!-- notes: Remind people to introduce themselves -->

Body content for slide 2.
```

### Parser rules

- **Slide separator:** lines matching `^---\s*$`. Each chunk = one slide.
- **Title:** first `#`, `##`, or `###` heading in the chunk.
- **Image paths:** rewritten at load time to be relative to the markdown file's directory.
- **HTML comments** are extracted **before** marked parses, since marked strips them:
  - `<!-- time: N -->` — slide time budget in minutes (overrides heading hint)
  - `<!-- notes: ... -->` — single-line speaker notes
  - `<!-- total: N -->` — total session time in minutes (honored only on slide 1)

### Timing fallback chain (first match wins)

1. `<!-- time: N -->` directive on the slide
2. `— N min`, `(N min)`, or `(~N min)` appearing in any heading on the slide
3. Default: **2 min**

**Total session time** = `<!-- total: N -->` if present on slide 1, else `sum(slide times)`.

### Speaker notes fallback chain

1. `<!-- notes: ... -->` directive
2. Any `> Note: …` blockquote in the slide body

## Runtime architecture

### Components in `assets/presenter.js`

| Function / class | Responsibility |
|---|---|
| `loadMarkdown(url)` | Fetch the markdown, return raw text. Throw on non-2xx. |
| `preprocess(md, baseUrl)` | Extract HTML-comment directives, rewrite image paths. |
| `parseSlides(md)` | Split on `---`, pull title and timing, attach directives + notes. |
| `renderSlide(i)` | `marked.parse` the body into `#stage`, update HUD, sync URL hash. |
| `Timer` | Slide + total countdowns. Pause / resume / reset. Persist across slide nav. |
| keyboard handler | Maps keys to nav / control actions. |
| dialogs | `<dialog>` elements for `?` (help) and `O` (overview grid). |

### Data model (per slide, after parsing)

```ts
{
  index: number;
  title: string;
  bodyMarkdown: string;
  bodyHtml: string;       // marked-parsed, cached on first render
  timeBudgetSec: number;
  notes: string | null;
}
```

### Timer state machine

For both slide and total timers:

| Elapsed / budget | State | Visual |
|---|---|---|
| 0–70% | OK | green |
| 70–100% | WARN | amber, gentle pulse |
| > 100% | OVER | red, counts up showing `+m:ss`, background tint |

Timers run via a single `setInterval(tick, 1000)` driven from `Date.now()` deltas (no drift). One paused flag controls both.

### Keyboard map

| Keys | Action |
|---|---|
| `→`, `Space`, `N`, `PageDown` | next slide |
| `←`, `P`, `PageUp` | previous slide |
| `Home`, `End` | first / last slide |
| `F` | toggle fullscreen |
| `T` | pause / resume timer |
| `R` | reset slide timer (current slide only) |
| `S` | toggle speaker notes panel |
| `O` | overview grid |
| `?` | help dialog |
| `Esc` | close any open overlay |

### URL state

- `?src=path/to/lesson.md` — selects the deck source. Default: `examples/demo-lesson.md`.
- `#3` — jump to slide 3 on load. Updated as the user navigates.

## CDN consumption contract

External decks (in the future `buildusingai.org` repo) load slidetime via jsDelivr:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My deck</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Build-Using-AI/slidetime@v0/assets/style.css">
</head>
<body>
  <main id="stage" aria-live="polite"><div id="loading">Loading…</div></main>
  <aside id="notes" hidden><header>Speaker notes</header><div id="notes-body"></div></aside>
  <div id="hud"></div>
  <div id="progress"><div id="progress-bar"></div></div>
  <dialog id="help"></dialog>
  <dialog id="overview"></dialog>

  <script>window.SLIDETIME_SRC = "lesson.md";</script>
  <script src="https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/Build-Using-AI/slidetime@v0/assets/presenter.js" defer></script>
</body>
</html>
```

The presenter checks `window.SLIDETIME_SRC` first, then `?src=`, then defaults to `examples/demo-lesson.md` (for the slidetime repo's own demo page).

### Version pinning

| Tag form | Behavior |
|---|---|
| `@v0` | rolling latest 0.x — recommended for active decks |
| `@v0.1.0` | exact tag — recommended for archived / past lessons |
| (omitted) | tip-of-main — only for local development |

## Versioning

Semver via git tags. `v0.x` while the markdown contract and HTML scaffolding stabilize. First public tag: `v0.1.0`.

A breaking change to the markdown contract or the HTML scaffolding expected by `presenter.js` bumps the major (`v1.0.0`). Bug fixes and additive features bump minor / patch.

## Out of scope (v0)

- Themes beyond the default dark + auto-light pair.
- Presenter view with next-slide preview.
- Multi-deck collections / index pages.
- Mid-slide animation, transitions, or click-to-reveal.
- Any backend, build pipeline, or CI.
