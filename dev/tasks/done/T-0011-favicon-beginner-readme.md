---
id: T-0011
type: feature # feature | fix | chore | research
status: COMPLETE # PLANNED | IN_PROGRESS | AWAITING_USER_DECISION | AWAITING_HDT | BLOCKED | COMPLETE | CANCELLED
milestone: M-0003 # e.g. M-0001, or null
size: SMALL # SMALL | MEDIUM | LARGE
created: "2026-10-15"
updated: "2026-10-15"
hdt_requirement: REQUIRED # UNDECIDED | NOT_REQUIRED | REQUIRED
hdt_status: PASS # NOT_STARTED | AWAITING_USER | PASS | FAIL | DECLINED | NOT_APPLICABLE
cancellation_reason: null # Required text when status is CANCELLED; otherwise null
---

# T-0011 — Favicon wiring + beginner README

Frontmatter is the canonical source for task metadata. Do not add a second `Status` field in the body.

## Objective

Wire the existing `public/favicon.png` as the site icon on all pages (served by the Worker, no 404) and rewrite `README.md` so a beginner can understand, run, and use the project.

## Size / Scope

SMALL — 3 HTML heads + `worker.js` static list + `README.md` only. No new icon design, no manifest/PWA, no docs restructuring beyond README.

### In Scope

- Add `<link rel="icon">` to `public/index.html`, `public/tools.html`, `public/settings.html` pointing at the shipped icon.
- Serve the icon from `worker.js`: add `/favicon.png` to `STATIC_ASSETS` (keep `/favicon.ico` working for browser auto-requests — alias or serve same bytes, no 404).
- Rewrite `README.md` beginner-friendly, human-readable: what this is, what you can do, step-by-step local run (prereqs: Node, wrangler, YouTube API key, `.env` with `YOUTUBE_API_KEYS`), deploy, daily use (search/tools/settings), quotas, troubleshooting.

### Out of Scope

- New icon artwork, SVG variants, Apple-touch icons, Webmanifest/PWA.
- Translations, wiki/, or restructuring `dev/` docs.
- Changing search/tools/settings behavior or `ytas.*` keys.

## Acceptance Criteria

- [x] Favicon: `GET /favicon.png` and `GET /favicon.ico` both return 200 with an image content-type via `wrangler dev`; no 404 in browser network on `/`, `/tools`, `/settings`.
- [x] Favicon: browser tab shows the icon on all three pages (desktop + mobile width), console clean.
- [x] README: a beginner with Node + a YouTube API key can follow it from clone to `npx wrangler dev` to first search without reading `dev/` docs; includes prereqs, key setup (local `.env` vs Worker secret), run, deploy, use, quotas, troubleshooting.
- [x] README: short, scannable, plain language; technical detail stays linked (e.g. `dev/project.md`, `ARCHITECTURE-MAP.md`, `dev/verification.md`) not inlined.

## Verification

Automated verification (run by agent):

```text
node --check worker.js — PASS (exit 0)
grep rel="icon" public/ — 3/3 pages (index, tools, settings) PASS
wrangler dev smoke (port 18789) — PASS:
  / /tools /settings 200; /favicon.png 200 image/png;
  /favicon.ico 200 image/png (alias to favicon.png bytes)
served-HTML check (port 18790) — /, /tools, /settings all contain rel="icon" PASS
README read-back — 113 lines, 10 sections (what/use/setup/deploy/quotas/troubleshooting/layout) PASS
```

HDT decision reason:

REQUIRED — per `dev/verification.md` favicon is a UI change (tab icon on search/tools/settings) needing human/runtime evidence; README alone would be NOT_REQUIRED but the combined task crosses the UI/runtime boundary.

HDT status: PASS (user report 2026-10-15: pass — covers favicon tab icon on all pages + beginner README follow-through).

## Pending Decision

None.

## Notes / Evidence

- `public/favicon.png` exists but no page references it (`grep favicon public/` hits only `iconbtn`/`theme-icon`); heads only link `/styles.css`.
- `worker.js:STATIC_ASSETS` lists `/favicon.ico` but the file on disk is `/favicon.png` — mismatch guarantees a 404 on one path today.
- Current `README.md` rewritten beginner-friendly (2026-10-15); user correction applied same day: use `.env` not `.dev.vars` (matches `dev/constraints.md`, `dev/project.md`, `.gitignore`).
- README clone URL set to `https://github.com/sekedus/yt-adv-search` (2026-10-15).
- README setup restructured to 3 options (Deploy button / Dashboard / Local PC, ref cors-proxy README) under "Get running" + "Add your API key" step (2026-10-15).
- Note: `wrangler.toml` comment still says "Copy `.env.example` to `.dev.vars`" — left untouched as out of scope; flag if alignment wanted.

## Affected Durable Artifacts

- `dev/roadmap.md`, `dev/milestones/M-0003-filter-topbar-settings.md`, `dev/now.md`
- Implementation will affect: `public/index.html`, `public/tools.html`, `public/settings.html`, `worker.js`, `README.md`

## Commit Checkpoint

Suggested commit message:

```text
feat: wire favicon on all pages plus beginner-friendly README
```

Commit status: `COMMITTED` (see `dev/now.md` Last Checkpoint)

## Handoff

Create task, then implement: heads + worker static alias, smoke both icon paths, rewrite README, browser check, HDT.
