# slidetime — User Manual

A reference for **authors writing a lesson deck** and **presenters delivering one**.

## 1. The 30-second mental model

- A deck is **one markdown file**.
- Slides are separated by a line containing only `---`.
- Each slide's first heading is its title.
- You tell slidetime how long each slide should take. It counts down. Green → amber → red.
- The total session timer counts down independently. The progress bar at the bottom shows total elapsed.

That's it. Open the file in slidetime, run the deck.

## 2. Slide separators

A horizontal-rule line on its own marks the boundary between slides:

```markdown
# Slide 1

Body.

---

# Slide 2

Body.
```

The separator must be a line with **only** `---` (three or more dashes also works, but `---` is canonical). Leading or trailing spaces on that line are fine.

A `---` **inside a fenced code block does not split** — you can use it freely in code examples.

## 3. Slide titles

The first `#`, `##`, or `###` heading in a slide becomes its title. The title shows up in the overview grid and in the speaker-notes window header.

```markdown
## What is a token?

A token is roughly a piece of a word.
```

You can have multiple headings per slide; only the first counts as the title.

## 4. Time budgets

slidetime needs a per-slide budget. There are three ways to set one; the first match wins:

### a) HTML-comment directive (recommended for non-obvious values)

```markdown
## Hands-on demo

<!-- time: 15 -->

Body.
```

Value is in minutes. Decimals work: `<!-- time: 0.5 -->` = 30 seconds.

### b) Inline heading hint

```markdown
## Intro — 5 min
```

Patterns that match:

| Pattern | Value |
|---|---|
| `— 5 min` (em-dash) | 5 min |
| `- 5 min` (hyphen) | 5 min |
| `(5 min)` | 5 min |
| `(~5 min)` | 5 min |
| `— 0.5 min` | 30 sec |

The hint is **stripped from the rendered heading** — the audience sees just "Intro".

### c) No marker → 2 min default

If you forget, slidetime assumes 2 minutes. The `slidetime` Claude skill will flag this for you.

## 5. Total session time

By default, total = sum of slide budgets.

To override (e.g. you want a 60-min session and the slide totals add up to 58 min — you want the bar paced to 60):

```markdown
<!-- total: 60 -->

# First slide

...
```

The `<!-- total -->` directive is **only honored on slide 1**. Anywhere else and it's ignored (so you can write about it in your deck without breaking your own timer).

## 6. Speaker notes

Two ways to attach notes to a slide. First match wins.

### a) HTML-comment directive (single line)

```markdown
## Slide title

<!-- notes: Remind audience that this is the same idea as backprop, just at a higher level. -->

Body.
```

### b) Blockquote with `Note:` prefix (multi-line ok)

```markdown
## Slide title

> Note: Lead with the hands-on demo before the theory.
> If the demo breaks, fall back to the screenshot in /assets/.
```

Notes never appear on the slide. They only show in the speaker-notes window, which the presenter opens with `S`. The window is a separate OS window — so when you share just the deck tab/window in Meet or Zoom, attendees do **not** see the notes.

When a slide has no notes, the window still opens but reads "*(no notes for this slide)*".

## 7. Images

Standard markdown image syntax. **Paths are resolved relative to your `.md` file**, not relative to the slidetime install.

```markdown
## Architecture

![the system diagram](images/architecture.png)
```

If you have one image and not much else on a slide, slidetime auto-applies a "figure" layout: image fills ~65% of the stage height, caption below.

## 8. Code blocks

Standard fenced code blocks. Slidetime intentionally avoids syntax highlighting (keeps the dependency surface tiny). Use language hints anyway — they survive in the rendered HTML for future highlighter add-ons.

````markdown
```python
def hello():
    print("hi")
```
````

## 9. Layout heuristics

slidetime auto-picks a layout per slide based on what's inside. You don't pick — the markdown does:

| Content | Layout |
|---|---|
| Only a heading | Centered title slide |
| Heading + paragraphs / lists | Default left-aligned layout |
| Heading + a dominant image | Figure layout (image fills the stage) |

## 10. Keyboard shortcuts

| Keys | Action |
|---|---|
| `→` `Space` `N` `PgDn` | next slide |
| `←` `P` `PgUp` | previous slide |
| `Home` / `End` | first / last slide |
| `F` | toggle fullscreen |
| `T` | pause / resume both timers |
| `R` | reset the **slide** timer (does not reset total) |
| `S` | open speaker notes window (separate OS window — Meet/Zoom safe) |
| `O` | overview grid (click a card to jump) |
| `?` | help dialog |
| `Esc` | close any open dialog |

## 11. URL options

| Param | Effect |
|---|---|
| `?src=path/to/lesson.md` | Load a different markdown file. Path is relative to the `index.html`. |
| `#3` | Jump to slide 3 on load. Updates as you navigate. |

You can combine them: `?src=decks/my-talk.md#5`.

## 12. Pause, reset, recover

- **Pause (`T`)** — both timers freeze. The slide timer resumes from where it was; the total resumes from where it was. Pause and a small "⏸" appears next to the value.
- **Reset slide timer (`R`)** — current slide's countdown restarts at its budget. Total is untouched. Useful if you just realized you need to slow down.
- **You go red** — that's fine. Live presentation reality. Slidetime keeps counting up so you can see exactly how much you owe back.

## 13. Authoring tips

- Write the headings first, with time hints, then fill in body content. The total counter on the overview grid tells you instantly whether you've over-planned.
- Use the `slidetime` Claude skill to scan your deck before delivering it: it flags slides using the default 2-min budget, warns when long sections have no speaker notes, and reports the math vs your `<!-- total -->`.
- Keep slides short. The progress bar is honest — if your "intro" is 12 min and your audience is staring at the same slide, they'll notice.

## 14. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Could not load deck" card | The `src` URL returned non-2xx. | Check the URL in the browser address bar; make sure the path is reachable from the `index.html` location. |
| "No slides found" card | The deck has no `---` separators. | Add `---` between slides. |
| Slide title still shows "— 2 min" | The time hint isn't matching one of the supported patterns. | Use a long dash (`—`) or hyphen (`-`) followed by `N min`. Or use `<!-- time: N -->`. |
| Speaker notes window empty when you expected content | Notes have to be **either** a single-line `<!-- notes: ... -->` HTML comment **or** a `> Note: ...` blockquote. | Check syntax. |
| Total timer is way off | You set `<!-- total: N -->` on a slide other than slide 1, where it's ignored. | Move it to the top of slide 1. |
| Images broken | Image path is relative to your `lesson.md`, not to where slidetime is hosted. | Place images next to the markdown file or use absolute / `https://` URLs. |
