---
id: T-0007
type: feature
status: COMPLETE
milestone: M-0002
size: SMALL
created: "2026-10-13"
updated: "2026-10-15"
hdt_requirement: REQUIRED
hdt_status: PASS
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

- [x] SafeSearch uses radios; region/lang hints name the ISO standards.
- [x] Proxy status is visually separate from Save/Reset buttons.
- [x] Success = green, failure = red (both themes), info neutral.
- [x] Settings usable at 360px; no console errors; prefs still persist/mirror.

## Verification

```text
browser open /settings + edit each pref + Save/Reset + probe + reload
```

HDT decision reason: persistence/status-color/responsive behavior needs human
observation per `.aaw/verification.md`. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: follows T-0005 shared-container CSS; keep `ytadv.*` key
contract unchanged.

Implemented 2026-10-15 (worker untouched):

- `public/settings.html`: SafeSearch `<select id="safeSearch">` replaced by
  radio group (`name="safeSearch"`, values none/moderate/strict,
  `.radiorow#safeGroup`, mirrors search-page Sort-by pattern); new
  `checkedSafe()`/`setSafe()` helpers. Persisted key stays
  `ytas.safeSearch` (spec text said `ytadv.*`; actual contract is `ytas.*`
  per T-0002/index.html — unchanged, search page still reads it).
- Region hint now names ISO 3166-1; language hint now names ISO 639-1.
- Save/Reset split into its own `Save and reset` section (with `#status`);
  `Proxy status` section keeps only the quota-free `GET /api/channel` bare
  probe (`#probeStatus`). Probe request unchanged.
- `note()` now paints success green (`ok` class) vs error red; probe
  `Checking…` stays neutral, success adds `ok`, failure adds `error`.
- `public/styles.css`: theme-aware `--ok` added to all three theme blocks
  (dark `#7dd88a`, light/auto-light `#137333`); `.status.ok` rule added
  alongside `.status.error`; shared with results pages via `:root`.
- Responsive: new `@media (max-width: 640px)` stacks `.card` vertically
  with full-width `.thumb` so list cards never overflow a 360px viewport.
  Container 1500px + 480px single-column filtergrid unchanged.

Automated verification (run by agent):

- `node --check worker.js` — PASS (worker untouched).
- Static checks 28/28 PASS (radios, no `safeSel`, key count, ISO hints,
  section split + order, probe bare, `--ok` x3 + `.status.ok`, container +
  responsive rules, all `$()` id refs resolve, index still reads
  `ytas.safeSearch`).
- Inline settings script `node --check` — PASS.

HDT: REQUIRED — PASS (user report 2026-10-15: all rounds passed).
Task COMPLETE; moved to done/.

## Affected Durable Artifacts

- `ARCHITECTURE-MAP.md`, `.aaw/roadmap.md`, milestone, `.aaw/now.md`

## Commit Checkpoint

```text
feat: settings copy status colors and responsive polish
```

Commit status: `UNCOMMITTED`

## Handoff

Coordinate `--ok`/status CSS vars with T-0006 so both pages share them.
