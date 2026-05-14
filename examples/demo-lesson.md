<!-- total: 9 -->

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
