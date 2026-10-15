---
id: T-0009
type: fix # feature | fix | chore | research
status: COMPLETE # PLANNED | IN_PROGRESS | AWAITING_USER_DECISION | AWAITING_HDT | BLOCKED | COMPLETE | CANCELLED
milestone: M-0003 # e.g. M-0001, or null
size: SMALL # SMALL | MEDIUM | LARGE
created: "2026-10-16"
updated: "2026-10-16"
hdt_requirement: REQUIRED # UNDECIDED | NOT_REQUIRED | REQUIRED
hdt_status: PASS # NOT_STARTED | AWAITING_USER | PASS | FAIL | DECLINED | NOT_APPLICABLE
cancellation_reason: null # Required text when status is CANCELLED; otherwise null
---

# T-0009 — Mobile nav overlay fix + focus/autofocus + topbar/nav + stacked help + no-inline-style

Frontmatter is the canonical source for task metadata. Do not add a second `Status` field in the body. When cancelling, ask for a reason if the user has not provided one; never infer it. Once provided, put the reason in `cancellation_reason` and update `updated`.

## Objective

Fix mobile nav pushing `.brand` down (overlay dropdown instead), autofocus search on homepage with missing/empty `q`, move Settings into nav (no emoji), emoji-only theme toggle everywhere, filters closed by default on mobile, help (`qinfo`/settings hints) stacked at bottom of row, zero inline `style=` attributes.

## Size / Scope

SMALL — `public/index.html`, `public/settings.html`, `public/tools.html`, `public/styles.css` only.

### In Scope

- Mobile nav: absolute overlay dropdown so opening nav never moves `.brand`; brand stays pinned top row.
- Autofocus `#ytas-q` only when `/` carries a query string but has no `q` or empty `q` (plain `/` never focuses).
- Blur search input on Enter-submit (no lingering focus).
- Topbar: Settings link moves from `topbar-actions` into `nav` (Search/Tools/Settings) as text, no ⚙️ emoji; `topbar-actions` keeps theme button only.
- Theme button emoji-only on desktop + mobile (🌓/☀️/🌙 with aria-label/title); drop `theme-text` spans.
- Settings Save applies the selected theme; unsaved-changes `beforeunload` guard; `confirm()` on Reset.
- Filters default closed on narrow viewports (`matchMedia('(max-width: 700px)')`), including history navigation to homepage.
- Help layout: neat-inline rows (neat-1.png); `?` gets border-color background only while its `qinfo` is open (neat-2.png, `:has` + graceful fallback); `qinfo`/settings hints full row width (100%).
- Remove all inline `style=` (settings `h2` margins, region/lang widths, tools resolver row/input flex) into stylesheet classes.
- Remove all inline `style=` (settings `h2` margins, region/lang widths, tools resolver row/input flex) into stylesheet classes.

### Out of Scope

- Worker/API, filter semantics, results cards, new pages.

## Acceptance Criteria

- [x] Mobile nav open: brand stays in top row (matches expected row, not inside dropdown).
- [x] `/?channel=x`, `/?q=`, `/?date=week` focus search input; plain `/` (no query string) and `/?q=test` do NOT autofocus.
- [x] Pressing Enter in search blurs the input (no lingering focus ring).
- [x] Nav has Search/Tools/Settings text links on all pages; no settings gear button anywhere.
- [x] Theme toggle shows only emoji on desktop and mobile; label exposed via aria/title; persists.
- [x] Settings: Save applies the selected theme; leaving with unsaved edits triggers `beforeunload`; Reset asks for confirmation first.
- [x] Mobile (<=700px): filters closed on first homepage load and on history back to homepage; desktop opens in both cases.
- [x] History back/forward to `/?q=` (empty q) clears the input and does NOT re-run the previous search.
- [x] Enrich on homepage never writes `ytas.enrich`: toggle + search, reload — checkbox back to stored default; `?enrich=1` URL still enriches that view only; /settings Save still persists.
- [x] Advanced rows neat-inline (label + control + `?` one line); `?` bg = border only while its help is open; `qinfo`/settings hints span full row width (100%).
- [x] `grep style=` over `public/` returns zero matches; visual parity kept.
- [x] No console errors.

## Verification

Commands / checks and expected results:

```text
node --check worker.js
```

```text
static: grep style= public/ -> zero; menuBtn/nav/settings-link/theme-icon checks
```

HDT decision reason:

UI/runtime behavior (overlay nav, autofocus, responsive defaults) — project verification contract requires browser HDT for UI changes.

Automated verification (run by agent 2026-10-16):

- `node --check worker.js` — PASS (untouched).
- Inline scripts extracted and `node --check` — PASS (index/settings/tools).
- `grep style=` over `public/` — zero matches PASS.
- `grep theme-text|settings-icon|settings-text` — zero matches PASS.
- Nav contains Settings text link on all 3 pages; theme button icon-only; `isNarrowViewport`/`focusSearch` present in index — PASS.

HDT: REQUIRED — PASS (user report 2026-10-16: "pass. commit task").

Manual steps for user:

1. Mobile ~360px, open `/`: filters closed by default; tap `☰` — nav dropdown overlays below topbar, brand stays in top row (not pushed down).
2. Autofocus rule: `/?channel=x`, `/?q=`, `/?date=week` focus search; plain `/` (no query string) and `/?q=test` do NOT autofocus. Same on history back/forward.
3. History panel rule: search `test`, press browser back to `/` — mobile: filter closed; desktop: filter open; status `Type a keyword to search.`, no results. KEY CASE: type `/?q=` in the address bar + Enter (full load), then browser back to `/` — desktop: filter open.
4. Stale keyword: back/forward onto `/?q=` — input cleared, never re-runs the old keyword.
5. Type a query, press Enter: search runs and the input loses focus.
6. Advanced: click `?` — badge takes border bg only while help is open; help spans full row width (100%, neat-2.png). Click again — badge back to plain.
7. Settings: pick another theme + Save — page theme changes; edit Region then click a nav link without saving — browser warns; Reset — "Are you sure...?" confirm appears first, Cancel keeps values.
8. Report console errors if any.

## Pending Decision

None.

## Notes / Evidence

Follow-up to T-0008 (M-0003 reopened per user 2026-10-16; milestone completes only on explicit user confirmation). Screenshot: mobile nav-open brand displacement.

Round 2 (2026-10-16): autofocus narrowed to query-string-only homepages (`hasQueryParams`, regex unit-verified `false,false,true,true,true,false`); rows neat-inline per neat-1.png with `?` bg `var(--border)`; automated checks re-PASS.

Round 3 (2026-10-16): `?` bg only while its help is open (`.advrow:has(.qtoggle:checked)`, neat-2.png; graceful fallback where `:has` is missing); help spans full row (`1 / -1`, 100%); blur search on Enter-submit; settings dirty-guard (`beforeunload`), Reset `confirm()`; Save-keeps-applying-theme verified (pre-existing handler, unchanged). Automated checks re-PASS.

Round 4 (2026-10-16): root-caused non-full-width help — fixed `200px`/`320px` tracks + `justify-content: start` packed rows left of the panel. Middle column is now `1fr` so tracks fill the container and full-span help is truly 100%. Inputs still capped at 300px by `.advcontrol` rules.

Round 5 (2026-10-16): history-to-homepage panel rule made explicit (mobile closed / desktop open, initial load + `popstate`); fixed stale keyword — `readStateFromURL` now clears the input on empty `?q=` too (previously only on missing `q`, so back-navigation to `/?q=` re-ran the old search). Automated checks re-PASS.

Round 6 (2026-10-16): root-caused back-from-`/?q=`-to-homepage not opening on desktop — back/forward across full page loads restores documents from bfcache with no `popstate` and no init re-run, freezing stale UI (closed filter + old results on a homepage URL). Extracted `applyHistoryState()` shared by `popstate` and `pageshow`-persisted restores. Automated checks re-PASS.

Round 7 (2026-10-16): homepage Enrich no longer persists — removed the `storeSet("ytas.enrich", …)` write from `buildParams`. Effective value is URL `?enrich=` when present, else stored default (read path unchanged); only /settings Save writes the key. Automated checks re-PASS.

## Affected Durable Artifacts

- `dev/roadmap.md`, `dev/milestones/M-0003-*`, `dev/now.md`
- `public/index.html`, `public/settings.html`, `public/tools.html`, `public/styles.css`

## Commit Checkpoint

Suggested commit message:

```text
fix: mobile nav overlay, search autofocus, settings-in-nav, stacked help, no inline styles
```

Commit status: `UNCOMMITTED`

## Handoff

Only what the next session/agent needs to continue safely.
