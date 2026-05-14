# slidetime — repo conventions for Claude

This file orients future Claude sessions working in this repo.

## What this is

A static, zero-build HTML presentation tool. Markdown in, time-managed deck out. See `README.md` for the user story.

## Hard constraints

- **No build step.** No webpack, vite, rollup, esbuild, tsc. Browser-native ESM is fine; bundling is not.
- **No backend.** Pure static — must work served from `file://`, GitHub Pages, S3, any CDN.
- **One runtime dependency:** `marked@15` loaded from jsDelivr. Don't add npm-installed deps to runtime.
- **No frameworks.** Vanilla HTML / CSS / JS. React, Vue, Svelte are out of scope.
- **`assets/presenter.js` is the contract** that downstream decks rely on via CDN. Breaking changes there bump the major version. The expected HTML scaffolding (the `index.html` shape) is also part of the contract — see `README.md` for the consumer snippet.

## Markdown contract

The lesson markdown format is documented in `docs/ARCHITECTURE.md` and `docs/USER_MANUAL.md`. The contract is:

- Slides separated by `^---\s*$`.
- Title is the first `#`/`##`/`###` heading.
- Timing directives: `<!-- time: N -->`, `<!-- total: N -->`. Heading-based fallback: `— N min` or `(N min)` or `(~N min)`.
- Notes directives: `<!-- notes: ... -->` (single line) or `> Note: ...` blockquote.

Any change to this contract is a breaking change.

## File ownership

| Path | Notes |
|---|---|
| `index.html` | Entry. Demo for slidetime's own GitHub Pages site. Keep in sync with the CDN consumer snippet in `README.md`. |
| `assets/presenter.js` | Single-file. Public surface. |
| `assets/style.css` | Public surface (CDN). Class names + `data-layout` values are part of the contract. |
| `examples/demo-lesson.md` | Synthetic content only. **Never** real community lesson content — that lives in the future `buildusingai.org/decks/` repo. |
| `skill/present-lesson/SKILL.md` | Source of the `present-lesson` Claude skill. Mirrored to `~/.claude/skills/present-lesson/SKILL.md` on the maintainer's machine. |

## Versioning

Semver via git tags. Currently `v0.x`. Bump the major when the markdown contract or HTML scaffolding changes. Tag pushes propagate to jsDelivr automatically.

## When fixing bugs

Reproduce in `examples/demo-lesson.md` first if possible. Add a slide to the demo that exercises the bug, then fix. Manual smoke checklist lives in `docs/TEST_REPORT.md`.

## Don't

- Add real meetup content to `examples/`. That lives elsewhere.
- Introduce a build step or framework.
- Break the markdown contract without bumping the major.
- Add server-side anything.
- Add themes, transitions, presenter-view previews, or other "nice to have" features without an issue + discussion — scope is deliberately small.
