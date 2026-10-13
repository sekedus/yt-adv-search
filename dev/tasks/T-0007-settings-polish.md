---
id: T-0007
type: feature
status: PLANNED
milestone: M-0002
size: SMALL
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: REQUIRED
hdt_status: PENDING
cancellation_reason: null
---

# T-0007 — Settings polish + global responsive

## Objective

Clearer settings copy, separated Save/Reset proxy-status section, colored
status, and consistent responsive behavior.

## Size / Scope

### In Scope

- `public/settings.html` (+ shared CSS):
  - SafeSearch `<select>` → radio group (mirrors T-0005 sort-by pattern;
    search page still reads `ytadv.safeSearch` key unchanged).
  - Region hint += YouTube uses ISO 3166-1 code.
  - Language hint += YouTube uses ISO 639-1 code.
  - Split proxy-status section from Save/Reset: distinct section(s) with Save
    and Reset buttons; probe stays quota-free (`GET /api/channel` bare).
  - Status messages use related colors: green success, red failed, neutral
    info (theme-aware vars, e.g. `--ok`/`--danger`).
- Global responsive pass: 1500px container shared with T-0005/T-0006, panels
  and settings grids collapse cleanly to 360px.

### Out of Scope

- Filter panel + results cards (T-0005/T-0006); new endpoints.

## Acceptance Criteria

- [ ] SafeSearch uses radios; region/lang hints name the ISO standards.
- [ ] Proxy status is visually separate from Save/Reset buttons.
- [ ] Success = green, failure = red (both themes), info neutral.
- [ ] Settings usable at 360px; no console errors; prefs still persist/mirror.

## Verification

```text
browser open /settings + edit each pref + Save/Reset + probe + reload
```

HDT decision reason: persistence/status-color/responsive behavior needs human
observation per `dev/verification.md`. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: follows T-0005 shared-container CSS; keep `ytadv.*` key
contract unchanged.

## Affected Durable Artifacts

- `ARCHITECTURE-MAP.md`, `dev/roadmap.md`, milestone, `dev/now.md`

## Commit Checkpoint

```text
feat: settings copy status colors and responsive polish
```

Commit status: `UNCOMMITTED`

## Handoff

Coordinate `--ok`/status CSS vars with T-0006 so both pages share them.
