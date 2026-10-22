---
id: T-0005
type: feature
status: COMPLETE
milestone: M-0002
size: MEDIUM
created: "2026-10-13"
updated: "2026-10-14"
hdt_requirement: REQUIRED
hdt_status: PASS
cancellation_reason: null
---

# T-0005 — Search layout + filter panel UX

## Objective

Make the search header and filter panel wider, shareable, and self-explanatory.

## Size / Scope

### In Scope

- `public/styles.css`: `.container` / `.topbar-inner` → 1500px max-width;
  `.searchform` max-width 600px centered.
- `public/index.html` filter panel:
  - Sync filter state with URL params (shareable/bookmarkable; back/forward restores).
  - Panel open (`<details open>`) on homepage/first load when no results yet.
  - Checkbox/radio groups stack vertically (top-to-bottom), not horizontal wrap.
  - "Sort by" converted from `<select>` to radio group.
  - Enrich label → `Extra: displays duration + views (uses more api quota)`.
  - Move/add "Operators" help block into the filter panel (keep short hint outside).
  - Advanced filters feasibility (yt-more-advanced.png): upload year, hide
    Shorts/watched, duration min/max, min views, hide titles/channels. Prefer
    client-side post-filter with no extra quota; YT-API-backed only where
    native (`before:`/`after:` for year); drop infeasible ones with reason.
- Responsive: panel grid collapses cleanly; header wraps without overlap.

### Out of Scope

- Results card rendering (T-0006); Settings page (T-0007); worker changes
  unless a feasible advanced filter needs proxy support.

## Acceptance Criteria

- [x] Wide viewport uses 1500px container; search bar ≤600px centered.
- [x] Copying the URL after applying filters reproduces the same filter state on reload.
- [x] First load with no query/results shows the filter panel open.
- [x] Upload-date/Type/Duration/Features/Sort-by options read top-to-bottom.
- [x] Sort-by uses radios; enrich copy matches spec; operators visible in panel.
- [x] Advanced-filter decision recorded (implemented or dropped with reason).
- [x] No console errors; usable at 360px width.

## Verification

```text
browser open / + apply each filter group + copy URL + reload + back/forward
node --check worker.js (only if worker touched)
```

HDT decision reason: real UI/runtime behavior (layout, URL sync, panel state,
responsive feel) per `.aaw/verification.md`; automated checks cannot prove it.
Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: none (starts M-0002; shares CSS contract with T-0006/T-0007 —
coordinate `.container`/filter class changes).

Implemented 2026-10-14 (worker untouched; no proxy change needed):

- `public/styles.css`: `.container`/`.topbar-inner` → 1500px;
  `.searchform` max-width 600px + `margin-inline:auto`;
  `.checkrow`/`.radiorow` → vertical column; added `.advcol`/`.opslist` +
  480px single-column collapse (filtergrid 1fr, searchform full-width).
- `public/index.html`: `<details open>` default + JS forces open when no
  q/channel; Sort-by radios (`name="order"`); enrich copy exactly
  `Extra: displays duration + views (uses more api quota)`; Operators
  fieldset inside panel + short hint kept outside; Advanced fieldset
  (year/hide-Shorts/min-max-sec/min-views/hide-title/hide-channel).
- URL sync: `readStateFromURL`/`currentStateToURL`/`syncURL(push|replace)` +
  `popstate` restore; submit/Apply → push; pager/empty → replace.
  Non-default filter state only appears in URL (defaults omitted).
- Year → `publishedAfter/Before` year range; `before:`/`after:` in q wins
  over year + Upload-date radio (existing precedence kept).
- Client post-filter `applyAdvancedFilters`: Shorts = enriched duration
  ≤180s; min/max sec + min views on enrichment; title/channel substring
  lists (comma-separated, case-insensitive); needs-Extra note when
  duration/views filters set but Extra OFF; hidden count in status.

Advanced-filter decision:

- Upload year — IMPLEMENTED (API date range, no extra quota).
- Hide Shorts — IMPLEMENTED client-side (≤180s enriched duration;
  needs Extra ON, else kept with note; heuristic documented).
- Duration min/max (sec) — IMPLEMENTED client-side on enrichment.
- Min views — IMPLEMENTED client-side on enrichment.
- Hide title/channel substrings — IMPLEMENTED client-side (no quota).
- Hide watched — DROPPED: no watch history in v1, no YT API equivalent.

Automated verification (run by agent):

- `node --check worker.js` — PASS (worker untouched).
- Static checks 43/43 PASS: 1500px container/topbar, 600px centered
  searchform, vertical radiorow, details open, sort radios (no `id=order`
  leftovers, no `orderSel` refs), enrich copy, operators block + short
  hint, all advanced ids, hide-watched note, URL-sync fns + push/popstate,
  year range + post-filter fns, 480px media, all referenced ids exist,
  no duplicate ids, inline script `node --check` PASS.
- `isoToSeconds` unit spot-checks 5/5 PASS (HMS/MS/S/empty/180s boundary).

HDT: REQUIRED — PASS (user report 2026-10-14: all manual steps passed —
layout/URL-sync/panel/360px feel, zero console errors). Task COMPLETE; moved to done/.

## Affected Durable Artifacts

- `ARCHITECTURE-MAP.md`, `.aaw/roadmap.md`, milestone, `.aaw/now.md`

## Commit Checkpoint

```text
feat: search layout and filter panel UX
```

Commit status: `UNCOMMITTED`

## Handoff

Decide advanced-filter scope early; result constrains T-0006 card filtering
(e.g. hide-Shots needs duration/channel data which needs enrichment ON).
