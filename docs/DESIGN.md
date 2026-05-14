# slidetime — Design Spec

The presenter is one full-viewport surface with three persistent UI strips: HUD (top + bottom-right), stage (center), and progress bar (bottom). Everything else is dialog-based.

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 3 / 9                                              [slide 01:42]│
│                                                    [total 47:13]│
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                     Slide title                                 │
│                                                                 │
│                     Slide body text and content                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                       [notes] [pause] [⛶]       │
│ ███████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────────┘
```

- **Top-left HUD:** slide counter (`3 / 9`).
- **Top-right HUD:** slide timer above total timer. Mono font, label + value.
- **Stage:** centered, max-width 1000px, padded 4rem. `aria-live="polite"`.
- **Bottom-right HUD:** notes, pause, fullscreen buttons. Icon-text on hover.
- **Bottom edge:** total-session progress bar — full-width, 4px tall, accent fill.

## Color tokens

Dark mode is default. Light mode applies via `@media (prefers-color-scheme: light)`.

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0e0e10` | `#fafafa` |
| `--bg-elev` | `#18181b` | `#ffffff` |
| `--fg` | `#f5f5f5` | `#0e0e10` |
| `--fg-muted` | `#a1a1aa` | `#52525b` |
| `--accent` | `#8b5cf6` | `#7c3aed` |
| `--ok` | `#22c55e` | `#16a34a` |
| `--warn` | `#f59e0b` | `#d97706` |
| `--over` | `#ef4444` | `#dc2626` |
| `--border` | `#27272a` | `#e4e4e7` |

## Typography

System stack:

```
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

Mono stack for HUD timers and code blocks:

```
ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace
```

| Element | Size | Weight | Notes |
|---|---|---|---|
| Slide H1 | `clamp(2rem, 5vw, 3.5rem)` | 700 | Title-only layout centers; otherwise top of stage. |
| Slide H2 | `clamp(1.5rem, 3.5vw, 2.25rem)` | 600 | |
| Slide body | `clamp(1.125rem, 2vw, 1.5rem)` | 400 | line-height 1.6 |
| HUD label | `0.75rem` | 500 | uppercase, letter-spacing 0.05em, muted |
| HUD value | `1rem` mono | 600 | |
| Code block | `1rem` mono | 400 | line-height 1.5, padded, rounded |

## Timer visual states

Each timer (slide and total) renders identically and uses these states based on `elapsed / budget`:

| State | Threshold | Color | Animation | Display |
|---|---|---|---|---|
| OK | 0–70% | `--ok` | none | `m:ss` countdown |
| WARN | 70–100% | `--warn` | 2s opacity pulse `1 → 0.6 → 1` | `m:ss` countdown |
| OVER | > 100% | `--over` | none, but `.timer.over` adds a `--over`-tinted background | `+m:ss` count-up |

States transition smoothly via a `transition: color 200ms ease`. Background tint on OVER fades in over 300ms.

## Slide layouts (CSS-driven, no markup change)

The stage's first content element determines layout via CSS attribute selectors. The renderer adds a `data-layout` attribute to the stage on each render based on a quick heuristic:

| Slide content | `data-layout` value | Visual |
|---|---|---|
| Only an H1 | `title` | H1 centered vertically + horizontally |
| H1/H2 + paragraph(s) | `default` | Title at top, body below, left-aligned |
| H1/H2 + dominant `<figure>` or `<img>` | `figure` | Title at top, figure fills 70% of stage height, caption below |

Heuristic for `figure`: stage's body contains exactly one image and no more than one paragraph, OR contains a single `<figure>` element.

## HUD detail

```
┌───────────────────────────────┐
│ SLIDE                         │
│ 01:42                         │
└───────────────────────────────┘
```

- Card-style: `--bg-elev` background, 1px `--border`, 8px radius, 0.5rem padding.
- Label uppercase, value mono.
- Two timers stacked vertically in top-right, 0.5rem gap between them.

### Buttons

Plain-text buttons with a 1px `--border`, rounded 6px, 0.5rem padding, mono caption. Hover lifts to `--bg-elev`. Active state: 1px solid `--accent`.

## Help dialog

Native `<dialog>` with backdrop. Two-column key-action table. `Esc` or close button to dismiss.

```
┌─────────── Shortcuts ───────────┐
│                                 │
│  → Space N        next slide    │
│  ← P              previous      │
│  Home / End       first / last  │
│  F                fullscreen    │
│  T                pause timer   │
│  R                reset slide   │
│  S                notes         │
│  O                overview      │
│  ?                this help     │
│  Esc              close         │
│                                 │
│                       [ close ] │
└─────────────────────────────────┘
```

## Overview grid

Native `<dialog>` filling 90% of viewport. CSS grid, `repeat(auto-fill, minmax(220px, 1fr))`, 1rem gap.

Each card: thumbnail of the slide (rendered HTML, scaled via `transform: scale(0.25)`), slide number + title underneath, time budget badge in top-right. Clicking the card calls `goto(i)` and closes the dialog. Current slide gets a 2px `--accent` ring.

## Speaker notes panel

`<aside id="notes">` slides up from the bottom-right when toggled. 360px wide, max 40vh tall, scrollable. `--bg-elev` background, 1px `--border`. Shows the slide title at top and rendered notes (plain text) below.

When closed, the panel is `hidden` (no transition for v0; can add slide animation in v0.2).

## Progress bar

Full-width strip pinned to viewport bottom, 4px tall. Two layers:

- Background: `--border`
- Foreground (`#progress-bar`): `--accent`, width = `100 * elapsedTotalSec / totalBudgetSec`%, max 100%.

When total time is exceeded the bar stays at 100% and gains a 2s opacity pulse animation matching the OVER state of the total timer.

## Print stylesheet

```css
@media print {
  /* HUD, progress bar, dialogs all hidden */
  /* Each .slide-print is page-break-after: always */
  /* Body printed below the slide for handouts */
}
```

On print, the renderer first generates a flat scroll view: every slide as its own `<section class="slide-print">`, title + body + speaker notes (visible). One slide per page; notes follow each slide.

## Accessibility

- Semantic landmarks: `<main>` for stage, `<aside>` for notes, `<header>` inside dialogs.
- `aria-live="polite"` on `#stage` so screen readers announce slide changes.
- Focus rings preserved on all interactive elements (no `outline: none`).
- Color contrast meets WCAG AA: stage `--fg` on `--bg` is 17:1 (dark) / 18:1 (light); timer state colors all > 4.5:1.
- Keyboard-only navigation works end-to-end; no mouse required.
- Each button has a `title` and an accessible label.
- `prefers-reduced-motion: reduce` disables timer pulse and progress-bar animation.

## Responsive behavior

- The presenter targets desktop/laptop usage (typical meetup setup: presenter laptop driving a TV).
- Below 720px viewport width, HUD reflows to a single bottom strip and the stage gets full vertical room. Buttons collapse to icon-only.
- Below 480px width, the overview grid switches to a single-column list.

## Empty / error states

| Situation | UI |
|---|---|
| Markdown still loading | `#loading` div with "Loading…" text — replaced as soon as render completes. |
| `?src=` returns non-2xx | Stage shows a card: "Could not load `<src>` (HTTP 404). Check the URL." |
| Markdown loads but parses to zero slides | Stage shows: "No slides found. Use `---` between slides." |
| Last slide reached | Next-key disabled (visual feedback: HUD counter pulses once). Slide content stays. |
