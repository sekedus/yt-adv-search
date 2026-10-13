---
id: T-0005
type: feature
status: PLANNED
milestone: M-0002
size: MEDIUM
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: REQUIRED
hdt_status: PENDING
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

- [ ] Wide viewport uses 1500px container; search bar ≤600px centered.
- [ ] Copying the URL after applying filters reproduces the same filter state on reload.
- [ ] First load with no query/results shows the filter panel open.
- [ ] Upload-date/Type/Duration/Features/Sort-by options read top-to-bottom.
- [ ] Sort-by uses radios; enrich copy matches spec; operators visible in panel.
- [ ] Advanced-filter decision recorded (implemented or dropped with reason).
- [ ] No console errors; usable at 360px width.

## Verification

```text
browser open / + apply each filter group + copy URL + reload + back/forward
node --check worker.js (only if worker touched)
```

HDT decision reason: real UI/runtime behavior (layout, URL sync, panel state,
responsive feel) per `dev/verification.md`; automated checks cannot prove it.
Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: none (starts M-0002; shares CSS contract with T-0006/T-0007 —
coordinate `.container`/filter class changes).

## Affected Durable Artifacts

- `ARCHITECTURE-MAP.md`, `dev/roadmap.md`, milestone, `dev/now.md`

## Commit Checkpoint

```text
feat: search layout and filter panel UX
```

Commit status: `UNCOMMITTED`

## Handoff

Decide advanced-filter scope early; result constrains T-0006 card filtering
(e.g. hide-Shots needs duration/channel data which needs enrichment ON).
