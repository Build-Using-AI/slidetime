<!-- total: 14 -->

# slidetime — 1 min

A markdown deck with a clock.

---

## Time management is the feature — 2 min

Other slideware shows you slides. **slidetime** shows you the *clock*.

- Per-slide countdown
- Total-session countdown
- Green → amber → red as you burn budget
- Goes red and counts **up** when you blow through

> Note: This is the differentiator. Lead with it.

---

## Writing a lesson — 3 min

One markdown file, slides separated by `---` lines, timing in the heading:

```markdown
## My slide title — 2 min

Slide content here.

---

## Next slide

<!-- time: 3 -->
<!-- notes: Don't forget to mention the deadline -->

More content.
```

That's the whole format. No build step. No JSON config.

---

## What you can put on a slide — 1 min

Anything **marked** can render — slidetime stays out of your way:

- *Emphasis*, **bold**, ~~strike~~, `inline code`
- Ordered and unordered lists (this one)
- Tables — see next slide
- Code blocks with language hints
- Images and inline SVG — see the slide after that
- Blockquotes for callouts and asides
- Links: [marked docs](https://marked.js.org)

> slidetime adds **no** new syntax on top of markdown.

---

## Timing markers — 2 min

Three ways to budget a slide. First match wins:

| Priority | Syntax                 | Example                       |
|----------|------------------------|-------------------------------|
| 1        | HTML comment           | `<!-- time: 5 -->`            |
| 2        | Heading hint (em-dash) | `## Intro — 5 min`            |
| 3        | Heading hint (parens)  | `## Intro (5 min)`            |
| 4        | None                   | falls back to **2 min** default |

Override the whole session total on slide 1 with `<!-- total: N -->`.

---

## Inline SVG for diagrams — 2 min

<div style="max-width:780px;margin:0 auto">
<svg viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three timer states: OK at 50% green, WARN at 75% amber, OVER at 100% red counting up" style="width:100%;height:auto">
<style>
.lbl { font: 600 14px ui-monospace, "SF Mono", Menlo, monospace; fill: #a1a1aa; }
.val { font: 700 16px ui-monospace, "SF Mono", Menlo, monospace; }
.track { fill: #27272a; }
.ok { fill: #22c55e; }
.warn { fill: #f59e0b; }
.over { fill: #ef4444; }
</style>
<text class="lbl" x="0" y="22">OK   — slide 0:30 of 1:00 left</text>
<rect class="track" x="0" y="34" width="600" height="16" rx="8"/>
<rect class="ok"    x="0" y="34" width="300" height="16" rx="8"/>
<text class="val ok" x="616" y="48" fill="#22c55e">0:30</text>
<text class="lbl" x="0" y="92">WARN — slide 0:15 of 1:00 left (past 70%)</text>
<rect class="track" x="0" y="104" width="600" height="16" rx="8"/>
<rect class="warn"  x="0" y="104" width="450" height="16" rx="8"/>
<text class="val warn" x="616" y="118" fill="#f59e0b">0:15</text>
<text class="lbl" x="0" y="162">OVER — slide blown by 0:20 (counts up)</text>
<rect class="track" x="0" y="174" width="600" height="16" rx="8"/>
<rect class="over"  x="0" y="174" width="600" height="16" rx="8"/>
<text class="val over" x="616" y="188" fill="#ef4444">+0:20</text>
</svg>
</div>

> SVG is just HTML. Drop it inline — marked passes it through.

---

## Tables, code, callouts — 1 min

A quick look at richer content rendering side-by-side:

| Keystroke | Action          |
|-----------|-----------------|
| `→` `Space` | next slide    |
| `T`         | pause timer   |
| `R`         | reset slide   |
| `O`         | overview grid |

```js
function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}
```

> All three render with zero config. No build, no syntax-highlighter, no chart lib.

---

## Speaker notes — 2 min

<!-- notes: Press S to toggle these notes during the live demo. The audience won't see them — they're for you. Also point out the keyboard shortcut help (?) and the overview grid (O). -->

Press **S** to toggle the speaker-notes panel. Two ways to write notes:

1. An HTML comment: `<!-- notes: your hint here -->`
2. A blockquote: `> Note: your hint here`

Notes never appear on the slide. They're just for the presenter.

---

# Thanks — 1 min

Built for community lessons.
Fork it, hack it, ship a deck.

`github.com/Build-Using-AI/slidetime`
