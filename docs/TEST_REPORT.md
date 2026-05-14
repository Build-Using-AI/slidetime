# slidetime — Test Report

**Build under test:** initial v0.1.0
**Date:** 2026-05-14
**Method:** Headless Chromium via Puppeteer against a local `python3 -m http.server` serving the repo root.

## Result

**All checks pass.** Two parser bugs and two UX issues were found and fixed during testing — none remain open.

## What I verified

### Parser (logic-level)

Confirmed via a Node script that mirrors the in-browser parser, run against `examples/demo-lesson.md`:

| Check | Expected | Got |
|---|---|---|
| Slide count | 5 | 5 ✓ |
| Total budget (from `<!-- total: 9 -->`) | 9 min | 9 min ✓ |
| Slide 1 budget (from `— 1 min`) | 60 s | 60 s ✓ |
| Slide 2 budget (from `— 2 min`) | 120 s | 120 s ✓ |
| Slide 3 budget (from `— 3 min`) | 180 s | 180 s ✓ |
| Slide 4 notes (from `<!-- notes -->`) | "Press S to toggle…" | matched ✓ |
| Slide 5 budget (from `— 1 min`) | 60 s | 60 s ✓ |
| `---` inside a fenced code block does **not** split the slide | code fence intact | intact ✓ |
| `<!-- time -->`, `<!-- notes -->` inside backticks are **not** consumed | comments visible in render | visible ✓ |

### Renderer (browser-level)

Driven by Puppeteer against `http://localhost:8765/index.html`:

| Check | Result |
|---|---|
| Index page loads (HTTP 200) | ✓ |
| Demo deck loads from `examples/demo-lesson.md` on default | ✓ |
| H1 renders without the `— 1 min` tail | ✓ ("slidetime") |
| Slide counter shows `1 / 5` | ✓ |
| Slide timer ticks down, painted green (`.timer.ok`) | ✓ |
| Total timer ticks down independently | ✓ |
| `→` advances slide; counter → `3 / 5`, H2 → "Writing a lesson" | ✓ |
| URL hash syncs (`#3`) and respects existing `?query` | ✓ |
| Code block on slide 3 contains literal `---`, `<!-- time: 3 -->`, `<!-- notes: ... -->` text | ✓ (see screenshot) |
| `S` toggles speaker-notes panel; correct notes shown for slide 4 | ✓ |
| `?` opens help dialog; `O` opens overview dialog (5 cards, current marked) | ✓ |
| `Escape` closes any open dialog / notes panel | ✓ (after fix) |

## Bugs found and fixed

| # | Bug | Fix |
|---|---|---|
| B1 | `---` inside a fenced code block was being treated as a slide separator — demo deck parsed as 6 slides instead of 5. | Added `maskCode()` / `unmaskCode()` — replace fenced and inline code with non-printing placeholders (SOH/STX delimiters) before splitting, restore before rendering. |
| B2 | `<!-- notes: ... -->` and `<!-- time: ... -->` written inside backticks (e.g. for documentation) were being consumed by the directive extractor, polluting the slide's real directives. | Same masking pass — directive regex now runs on the code-masked copy. |
| B3 | The first heading on each slide showed its time hint to the audience (e.g. "slidetime — 1 min" instead of "slidetime"). | Added `cleanRenderedHeadings()`; runs after timing detection so the budget is still read correctly from the original. |
| B4 | `history.replaceState` concatenated `#3` + `?_=foo` producing the invalid URL `#3?_=foo`. | Construct `location.pathname + location.search + "#" + n` instead. |
| B5 | Synthetic Esc keys from the test harness (and likely some edge browser cases) didn't close `<dialog>`s. | Keyboard handler explicitly calls `.close()` on Esc. |

## Screenshots

- `slide-1` — opening slide, default layout, slide timer green at 0:57 of 1:00, total 8:57 of 9:00.
- `slide-3-code` — proves B1+B2 fixed: the code block contains the literal `---` separator, the `<!-- time: 3 -->` directive, and the `<!-- notes: ... -->` comment, none of which broke parsing.

## What I did NOT verify (needs human eyes)

The slim agency plan deliberately skips formal browser-driven UAT, but a few visual / interactive things still need manual confirmation:

- [ ] **Amber pulse at 70%** of slide budget — wait > 42 s on a 1-min slide, confirm color shifts to `--warn` with gentle 2-s pulse.
- [ ] **Red over-time state** — wait > 60 s on a 1-min slide, confirm timer flips to red, counts up with `+m:ss`, and the timer card gains a red-tinted background.
- [ ] **Fullscreen (F)** — does the browser actually enter fullscreen on macOS Safari + Chrome? Fullscreen API needs a real user gesture, so Puppeteer can't verify.
- [ ] **`prefers-color-scheme: light`** — flip system theme, confirm light tokens applied.
- [ ] **`prefers-reduced-motion: reduce`** — confirm pulse animations disable.
- [ ] **Print stylesheet** — `Cmd+P`, confirm each slide on its own page with speaker notes below.
- [ ] **Real CDN consumption** — write a local `index.html` next to a fresh `lesson.md` using the README snippet, swap the CDN URLs for relative paths, confirm it renders identically. (Only verifiable end-to-end once `v0.1.0` is tagged on GitHub.)
- [ ] **`?src=` query** — load a deck from an arbitrary URL.

## How to re-run

```bash
cd path/to/slidetime
python3 -m http.server 8765
open "http://localhost:8765/index.html"
```

Or open `index.html` directly via `file://` — works because the demo deck path is relative.
