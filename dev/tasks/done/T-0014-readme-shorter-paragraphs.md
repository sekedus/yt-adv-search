---
id: T-0014
type: chore # feature | fix | chore | research
status: COMPLETE # PLANNED | IN_PROGRESS | AWAITING_USER_DECISION | AWAITING_HDT | BLOCKED | COMPLETE | CANCELLED
milestone: null # e.g. M-0001, or null
size: SMALL # SMALL | MEDIUM | LARGE
created: "2026-10-22"
updated: "2026-10-22"
hdt_requirement: NOT_REQUIRED # UNDECIDED | NOT_REQUIRED | REQUIRED
hdt_status: NOT_APPLICABLE # NOT_STARTED | AWAITING_USER | PASS | FAIL | DECLINED | NOT_APPLICABLE
cancellation_reason: null # Required text when status is CANCELLED; otherwise null
---

# T-0014 — Root README: beginner-friendly, short paragraphs

## Objective

Rewrite the root `README.md` so a beginner can read it comfortably: short paragraphs
(one idea each), plain language, and a narrow reading measure (about 900px, kept by
wrapping prose at ≤100 characters per line), without dropping any user-facing topic
that the current README covers.

## Size / Scope

SMALL — `README.md` only, plus the normal state files (`dev/roadmap.md`,
`dev/now.md`, this task record).

### In Scope

- Keep every current section and the facts it carries: features (search, shortcuts,
  tools, settings), how it works, prerequisites + API key steps, all three setup
  options (A/B/C), API key storage (online + local), everyday use, quotas,
  troubleshooting, project layout, contributor docs, notes, similar projects,
  disclaimer, license.
- Split walls of prose into short paragraphs and lists; plain wording for beginners.
- Keep commands, URLs, error strings, and example queries unchanged.
- Keep prose lines ≤100 characters in the source so each paragraph reads as a narrow
  block (about 900px at normal GitHub rendering width).
- Fix the broken `#add-your-api-key-all-methods` link to point at the real heading.

### Out of Scope

- Changing app behavior, copy inside `/public` pages, or `worker.js`.
- Adding translation, badges, screenshots, or a docs site.
- Replacing the troubleshooting content with a different support model.
- Reopening or closing M-0003.

## Acceptance Criteria

- [x] README covers the same topics as before; no user-facing fact is lost.
- [x] Prose is beginner-friendly: short sentences, one idea per paragraph, scannable
      headings and lists.
- [x] No prose line exceeds 100 characters (code blocks, tables, and badge/link lines
      are exempt).
- [x] Internal anchor `#add-your-api-key` resolves; code fences are balanced; the
      `<details>` preview block is closed.
- [x] Commands, URLs, error strings, and operator examples still match the app.

## Verification

Commands / checks and expected results:

```text
node <readme-check>.mjs
# - every prose line <= 100 chars (outside code fences / link-only lines)
# - balanced ``` fences, balanced <details>/<summary>/<picture>
# - every in-page anchor has a matching heading slug
# - every relative link target exists
# - required topic keywords still present (operators, tools, settings, quotas, etc.)
README read-back: beginner flow clone -> .env -> npx wrangler dev -> first search
```

HDT decision reason:

NOT_REQUIRED — docs-only change. The project verification matrix requires "read back
edited file" for docs/text; the README is not runtime UI code and changes no app
behavior. Automated structure/anchor checks plus read-back are sufficient.

## Pending Decision

None.

## Notes / Evidence

- User request 2026-10-22: "readme beginner human friendly, simpler/shorter paragraphs
  (maximum paragraph width ~900px), but doesn't lose the point that will be conveyed."
- Interpretation: GitHub markdown cannot set a paragraph width, so the width target is
  met by keeping each paragraph to one short idea and wrapping source lines at ≤100
  characters (roughly 900px in a typical rendered/preview column).
- Existing README was already beginner-oriented (T-0011) but had very long single-line
  paragraphs (up to ~1,200 characters per paragraph) and a wide 3-column troubleshooting
  table. This task splits those into short paragraphs/bullets and fixes one stale anchor.

### Automated evidence (2026-10-22)

- `node readme-check.mjs` — PASS: 0 prose lines over 100 characters (link-only lines
  exempt), 12 fence markers balanced, `<details>` 1/1, `<picture>` 2/2, 26 headings,
  16 links with 0 broken anchors/relative targets, all 27 required topic keywords
  present.
- Chromium line-width probe (GitHub-like 16px body) — PASS: 138 prose source lines
  measured; widest rendered line **665.9px** (line 42, 87 characters), under the
  ~900px target.
- `node readme-diff.mjs` against `HEAD:README.md` — PASS: 0 removed/0 added URLs,
  no numeric fact lost, every code/command line unchanged except the four
  `Project layout` descriptions (intentionally shortened, still accurate).
- GitHub markdown API render + Chromium screenshots at 1280px (4 viewports,
  top → bottom) — PASS: headings, lists, code blocks, details/preview, and the
  troubleshooting list all render cleanly; text column stays narrow.
- README read-back — clone → `.env` key → `npx wrangler dev` → open
  `http://localhost:8787` → `handle:@madebygoogle fold` path is complete.
- Fix: stale `#add-your-api-key-all-methods` anchor changed to `#add-your-api-key`
  (the real heading).

## Affected Durable Artifacts

- `README.md`
- `dev/roadmap.md`, `dev/now.md`, this task record

## Commit Checkpoint

Suggested commit message:

```text
docs: simplify README into short beginner-friendly paragraphs
```

Commit status: `COMMITTED` 2026-10-22

## Handoff

Docs-only closeout: rewrite README, run the automated README checks, mark COMPLETE, then
apply the `task` commit policy (`ask`). Do not touch M-0003 state beyond noting this
standalone task.
