# slidetime

> Markdown → time-managed HTML presentation. Per-slide and total-session countdown for community lessons.

Other slideware shows you slides. **slidetime** shows you the **clock**.

- Per-slide countdown timer
- Total-session countdown timer
- Green → amber → red as you burn time budget
- Counts **up** in red when you blow through it
- One markdown file. No build step. Open in a browser.

Live demo: **https://build-using-ai.github.io/slidetime/**

## Quick start

```bash
git clone https://github.com/Build-Using-AI/slidetime
open slidetime/index.html
```

Or pop the demo open over HTTPS at the URL above.

To present your own deck:

```bash
open "index.html?src=path/to/your/lesson.md"
```

## Lesson markdown — three rules

1. Slides separated by `---` on its own line.
2. Each slide's first heading is its title.
3. Tell slidetime the time budget — easiest way:

```markdown
## Intro to widgets — 2 min

Body here.

---

## Hands-on demo

<!-- time: 10 -->

Body here.
```

Full reference: [docs/USER_MANUAL.md](docs/USER_MANUAL.md).

## Use slidetime in your own deck repo

Drop this `index.html` next to a `lesson.md`. No build, no install, just a CDN pin.

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
  <div id="hud">
    <div id="hud-left"><span id="slide-counter">0 / 0</span></div>
    <div id="hud-center">
      <div id="slide-timer" class="timer"><span class="label">slide</span><span class="value">--:--</span></div>
      <div id="total-timer" class="timer"><span class="label">total</span><span class="value">--:--</span></div>
    </div>
    <div id="hud-right">
      <button id="btn-notes" type="button">notes</button>
      <button id="btn-pause" type="button">pause</button>
      <button id="btn-fullscreen" type="button">⛶</button>
    </div>
  </div>
  <div id="progress"><div id="progress-bar"></div></div>
  <dialog id="help"></dialog>
  <dialog id="overview"><header>Overview</header><div id="overview-grid"></div><form method="dialog"><button>close</button></form></dialog>

  <script>window.SLIDETIME_SRC = "lesson.md";</script>
  <script src="https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/Build-Using-AI/slidetime@v0/assets/presenter.js" defer></script>
</body>
</html>
```

Pin to `@v0` for rolling 0.x, `@v0.1.0` for the exact tag.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `→` `Space` `N` `PgDn` | next slide |
| `←` `P` `PgUp` | previous slide |
| `Home` / `End` | first / last slide |
| `F` | fullscreen |
| `T` | pause / resume timer |
| `R` | reset slide timer |
| `S` | toggle speaker notes |
| `Shift+S` | pop speaker notes into a separate window (Meet/Zoom safe — share only the deck tab/window) |
| `O` | overview grid |
| `?` | help dialog |
| `Esc` | close overlay |

## Contributing

Bug reports and PRs welcome. The intended scope is **deliberately small** — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for what's in and what's out.

## License

[MIT](LICENSE)
