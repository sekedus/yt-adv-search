---
id: T-0008
type: feature # feature | fix | chore | research
status: COMPLETE # PLANNED | IN_PROGRESS | AWAITING_USER_DECISION | AWAITING_HDT | BLOCKED | COMPLETE | CANCELLED
milestone: M-0003 # e.g. M-0001, or null
size: MEDIUM # SMALL | MEDIUM | LARGE
created: "2026-10-15"
updated: "2026-10-16"
hdt_requirement: REQUIRED # UNDECIDED | NOT_REQUIRED | REQUIRED
hdt_status: PASS # NOT_STARTED | AWAITING_USER | PASS | FAIL | DECLINED | NOT_APPLICABLE
cancellation_reason: null # Required text when status is CANCELLED; otherwise null
---

# T-0008 — Filter panel neat layout + topbar center/hamburger + settings merge

Frontmatter is the canonical source for task metadata. Do not add a second `Status` field in the body. When cancelling, ask for a reason if the user has not provided one; never infer it. Once provided, put the reason in `cancellation_reason` and update `updated`.

## Objective

Neater advanced filters (qinfo on right, Invidious-like label-right layout per improve-4.png), searchform moved above filter panel with Search-button hide on open, centered brand + hover nav + mobile hamburger topbar, neater settings Search-defaults with Save/Reset merged.

## Size / Scope

MEDIUM — touches `public/index.html`, `public/settings.html`, `public/tools.html` (topbar only), `public/styles.css`, inline JS for toggle/history.

### In Scope

- Advanced filters: label-right / control-left grid, qinfo on right side (toggle via `?`), same for More block.
- Move searchform out of topbar into new section on top of filter panel (index only); when filters `<details>` open, hide searchform Search button (CSS `:has` + JS `toggle` fallback).
- History: filter open on back/forward to homepage (`popstate` with no keyword -> open + reset; verify existing logic still holds after move).
- Topbar: `.brand` centered; `.nav a:hover` background; responsive row `☰ brand ☀️/🌙 ⚙️`, click `☰` shows nav; theme/settings collapse to icons on narrow.
- Settings: Search-defaults neater like improve-4.png (label-right grid); merge Save-and-reset section into Search-defaults panel.
- Keep class contracts (`.topbar/.container/.filters/.filtergrid` etc.) and `localStorage` keys unchanged.

### Out of Scope

- Worker/API changes, new filter semantics, results-card changes, Tools page body changes.

## Acceptance Criteria

- [x] Advanced filters render label-right / control-left with `?` toggle showing qinfo on right (desktop); stacks cleanly on narrow.
- [x] Searchform sits above filter panel as new section; Search button hidden while filters open; Apply still runs search and closes panel.
- [x] Back/forward to `/` (no `q`) opens filter panel, clears results chrome; back/forward to `?q=` closes panel and runs search.
- [x] Brand visually centered on desktop + mobile; nav links show hover background.
- [x] Narrow viewport topbar shows hamburger, centered brand, theme icon, settings gear; clicking hamburger reveals nav; searchform (tools/settings) wraps full-width second row.
- [x] Settings Search-defaults uses same neat grid; Save/Reset buttons + status live inside that panel; no separate Save-and-reset section.
- [x] No console errors; theme persist still works on all pages.

## Verification

Commands / checks and expected results:

```text
node --check worker.js — PASS (untouched)
node --check inline scripts (index/settings/tools extracted) — PASS
static: IDs present (menuBtn/primaryNav/searchpanel/advgrid/theme-icon), no advcol markup left — PASS
```

HDT decision reason:

UI/runtime behavior across three pages + history + responsive — project verification contract requires browser HDT for UI changes.

Automated verification (run by agent 2026-10-15):

- `node --check worker.js` — PASS (no output, worker untouched).
- Inline scripts extracted and `node --check` — PASS (index/settings/tools).
- Static grep: `menuBtn`/`primaryNav`/`searchpanel`/`advgrid` present on expected pages; `advcol` markup removed — PASS.

HDT: REQUIRED — PASS (user report 2026-10-16: "pass").

Manual steps for user (completed):

1. Open `/` desktop wide: brand centered; nav hover shows chip bg; searchpanel above Filters; Advanced rows label-right with `?` showing help on right.
2. Click Filters summary to open/close: Search button hides when open, shows when closed. Apply closes panel and searches.
3. Search `test`, then back to `/` via browser back: filter opens, status `Type a keyword to search.`, no results chrome.
4. Resize to ~360px: topbar shows `☰ brand 🌓 ⚙️`; click `☰` shows Search/Tools nav; tools/settings search wraps second row.
5. Open `/settings`: Search defaults neat grid; Save/Reset inside same panel with status; no separate Save-and-reset section; change + Save persists after reload.
6. Report console errors if any.

Result: PASS — no failures reported.

For `hdt_requirement: REQUIRED`, keep the task active until `hdt_status: PASS` and record the steps and user's observed result here. For `NOT_REQUIRED`, record the automated checks the agent actually ran and their outcomes; do not ask the user to repeat successful commands.

## Pending Decision

None.

## Notes / Evidence

User edit list 2026-10-15 + improve-4.png (Invidious label-right settings reference).

HDT PASS 2026-10-16 ("pass, commit"). No code changes after AWAITING_HDT; automated evidence reused (worker `node --check` PASS, inline scripts `node --check` PASS, static ID/grid checks PASS).

## Affected Durable Artifacts

List only artifacts materially changed by this task, for example `dev/roadmap.md`, its linked milestone, `ARCHITECTURE-MAP.md`, `CHANGELOG.md`, ADRs, or README.

- `dev/roadmap.md`, `dev/milestones/M-0003-*`, `dev/now.md`
- `public/index.html`, `public/settings.html`, `public/tools.html`, `public/styles.css`
- `ARCHITECTURE-MAP.md` if topbar/filter structure materially changes

## Commit Checkpoint

Suggested commit message:

```text
feat: neat advanced filters, centered hamburger topbar, merged settings defaults
```

Commit status: `UNCOMMITTED`

## Handoff

Only what the next session/agent needs to continue safely.
