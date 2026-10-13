---
id: T-0002
type: feature
status: PLANNED
milestone: M-0001
size: MEDIUM
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: REQUIRED
hdt_status: NOT_STARTED
cancellation_reason: null
---

# T-0002 — Search page (filters, results, theme)

## Objective

Invidious-like `/` page: bar, Filters panel + Apply, results grid, Next/Prev, theme toggle, enrichment opt-in.

## Size / Scope

### In Scope

- `index.html` + shared `styles.css`: header (bar, theme toggle, gear → `/settings`, Search|Tools nav), collapsible Filters (date incl. Last Hour, type incl. Movie/Show, duration, features with disabled tooltips, sort incl. Rating/Date), Apply button, results cards, pager.
- Client builds `/api/search` query from bar + filters + `pageToken`; default `maxResults=25` (5/10/25/50), `order=relevance`, `safeSearch=moderate`.
- Enrichment checkbox OFF default, mirrored with Settings, `localStorage` persisted.
- Auto theme (dark default) + manual toggle persisted.

### Out of Scope

- Worker internals (T-0001); Tools/Settings pages (T-0003/T-0004) except shared header/CSS contract.

## Acceptance Criteria

- [ ] Filters map to API params; unmappable show disabled with tooltip; Shorts omitted.
- [ ] `handle:fireship adobe` shows Fireship-scoped results; duration badge only when enrichment ON.
- [ ] Theme auto-dark works; toggle persists; no console errors.

## Verification

```text
browser open / + console check + filter/operator/pager interactions
node --check worker.js (if touched)
```

HDT decision reason: real UI/runtime behavior per `dev/verification.md`; automated checks cannot prove rendering/filter feel. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: blocked by T-0001; blocks T-0004 (shared header/CSS contract).

## Affected Durable Artifacts

- `README.md` (if user-visible behavior changes)
- `ARCHITECTURE-MAP.md`, `dev/roadmap.md`, milestone, `dev/now.md`

## Commit Checkpoint

```text
feat: search page with invidious-like filters
```

Commit status: `UNCOMMITTED`

## Handoff

Needs T-0001 endpoints live (or mocked) before HDT.
