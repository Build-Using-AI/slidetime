---
name: present-lesson
description: Analyze a slidetime lesson markdown file. Reports per-slide and total time budget, flags missing timing markers, flags slides without speaker notes when the section is long, and offers to open the deck via slidetime. Use when the user is preparing or reviewing a lesson markdown deck.
---

# present-lesson

Helps the user prepare a `lesson.md` for delivery via `slidetime` (https://github.com/Build-Using-AI/slidetime).

## When to invoke

Trigger when:
- The user mentions a `lesson.md` or asks to "prep a deck", "check timing", "review my lesson", "open this in slidetime".
- The user has opened or referenced a markdown file under a `decks/` or `lessons/` directory and asks for any time-budget feedback.

## What to do

1. **Read the lesson markdown file** the user points you at.
2. **Parse it the same way slidetime does** (see `Lesson markdown contract` below).
3. **Report a clean breakdown**:
   - Total session time (from `<!-- total: N -->` if present, else the sum of slide budgets).
   - Per-slide table: number · title · budget · source of the budget (`<!-- time -->` / heading hint / default).
   - Section totals if the user's deck has obvious sections (e.g. an `H1` separates sections, sub-`H2`s are slides inside).
4. **Flag issues:**
   - Any slide using the **2-min default** because no marker was found ("Slide 4 'X' has no `— N min` hint or `<!-- time: N -->` directive — using 2-min default.").
   - When `<!-- total -->` is set, flag any drift > 2 min between the declared total and the slide-budget sum.
   - For sections estimated at > 10 min that have **no speaker notes** on any of their slides, warn the user they may want notes to stay on track.
5. **Offer to open the deck via slidetime.** If the user confirms, suggest the command:
   ```
   open "<path-to-slidetime>/index.html?src=<absolute-path-to-lesson.md>"
   ```
   On macOS this opens the system default browser at the demo URL.

## Lesson markdown contract (mirror of slidetime parser)

- **Slide separator:** `^---\s*$`. Each chunk is one slide.
- **Title:** first `#`, `##`, or `###` heading in the chunk (strip a trailing time marker from the title for display).
- **Timing per slide (fallback chain):**
  1. `<!-- time: N -->` HTML comment
  2. `— N min`, `(N min)`, or `(~N min)` appearing in any heading on the slide
  3. Default 2 min
- **Total session time:** `<!-- total: N -->` on slide 1 if present, else `sum(slide times)`.
- **Speaker notes (fallback chain):**
  1. `<!-- notes: ... -->` (single line) directive
  2. A `> Note: …` blockquote in the slide body

## Output format

Show the breakdown as a markdown table the user can scan in a glance. Use checkmarks for clean slides and ⚠ for flagged ones. End with a short "Looks good ✓" or a bulleted "Suggestions" list.

Example:

```
Total: 60 min declared · 58 min calculated · drift -2 min

| # | Title                | Budget | Source           | Notes? |
|---|----------------------|--------|------------------|--------|
| 1 | Welcome              | 2 min  | <!-- time -->    | ✓      |
| 2 | What is an LLM?      | 5 min  | heading hint     | ✓      |
| 3 | Tokens               | 2 min  | default ⚠         | —      |
| 4 | Live demo            | 20 min | <!-- time -->    | ✓      |
```

Suggestions:
- Slide 3 has no time marker — add `<!-- time: N -->` or `— N min` to the heading.
- The "Live demo" section is 20 min with no speaker notes — consider adding cues so you don't lose the thread.

## Out of scope for this skill

- Don't rewrite the lesson content. Only analyze and report.
- Don't add or modify markers without explicit user confirmation.
- Don't fetch over the network — this works on local files only.
