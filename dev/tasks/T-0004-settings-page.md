---
id: T-0004
type: feature
status: PLANNED
milestone: M-0001
size: SMALL
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: REQUIRED
hdt_status: NOT_STARTED
cancellation_reason: null
---

# T-0004 — Settings page + header/nav polish

## Objective

Gear-opened `/settings` page with persisted preferences and consistent header/nav across all pages.

## Size / Scope

### In Scope

- `settings.html`: Theme (Auto/Dark/Light), Max results, SafeSearch, Region, Language, Enrichment opt-in, API status (key index only).
- `localStorage` persistence; mirrors search-page toggle; back-link to Search.
- Header polish on all pages: theme toggle, gear, `Search | Tools` nav, error/empty states.

### Out of Scope

- New API endpoints; filter logic changes.

## Acceptance Criteria

- [ ] Settings persist after reload and affect search defaults.
- [ ] Gear opens settings; nav consistent; no console errors.

## Verification

```text
browser open /settings + toggle each pref + reload persistence check
```

HDT decision reason: runtime persistence/theme behavior needs human observation per `dev/verification.md`. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: blocked by T-0002 (mirrors its header/toggle contract). No API dependency.

## Affected Durable Artifacts

- `README.md` (if run/use changes), `ARCHITECTURE-MAP.md`, `dev/roadmap.md`, milestone, `dev/now.md`

## Commit Checkpoint

```text
feat: settings page with persisted prefs
```

Commit status: `UNCOMMITTED`

## Handoff

Do after T-0002 header/CSS exists to avoid divergence.
