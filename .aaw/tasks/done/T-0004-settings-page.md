---
id: T-0004
type: feature
status: COMPLETE
milestone: M-0001
size: SMALL
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: REQUIRED
hdt_status: PASS
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

- [x] Settings persist after reload and affect search defaults.
- [x] Gear opens settings; nav consistent; no console errors.

## Verification

```text
browser open /settings + toggle each pref + reload persistence check
```

HDT decision reason: runtime persistence/theme behavior needs human observation per `.aaw/verification.md`. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: blocked by T-0002 (mirrors its header/toggle contract). No API dependency.

Automated verification (run by agent):

- `node --check worker.js` — PASS (worker untouched; no new endpoint added).
- Static checks 27/27 PASS (script removed after run): inline scripts parse;
  ids exist, no dupes; prefs keys match the T-0002 contract
  (`ytadv.theme/maxResults/safeSearch/region/lang/enrich`); theme Auto/Dark/Light;
  back-link; probe hits bare `/api/channel` (fails validation pre-upstream:
  no quota, no key exposure); no key material in page; header audit across
  `/`, `/tools`, `/settings` — identical structure, exactly one
  `aria-current` each, no polish edits needed.
- Live `wrangler dev` smoke: `/settings` → 200 real page; `/`, `/tools` → 200.

Design decision (no new endpoint, per out-of-scope): "API status" is a
reachability probe (`GET /api/channel` with no params → any HTTP answer means
the worker is up; it never reaches YouTube). Key count/index is deliberately
not exposed — no oracle for quota probing.

Revision from first HDT round (user feedback 2026-10-13): auto-save replaced
with an explicit Save button showing "Settings saved." / "Not saved: …".
Validation runs before any write. Region `maxlength` removed so an invalid
value (e.g. `USA`) is typeable and the failure message is observable; the
header theme toggle still applies immediately by design.

Re-verification (run by agent): inline scripts parse; Save handler present;
no stale auto-save calls; success/failure messages present; validation runs
before writes; all ids exist (11/11 PASS, script removed after run). Live
smoke: `/settings` → 200 with Save button.

HDT: REQUIRED — PASS (user report 2026-10-13, second round on Save model:
unsaved changes discarded on reload; `USA` → "Not saved: …" with nothing
written; valid save persists + mirrors to search; Reset restores defaults;
zero console errors). Task COMPLETE; moved to done/.

## Affected Durable Artifacts

- `README.md` (if run/use changes), `ARCHITECTURE-MAP.md`, `.aaw/roadmap.md`, milestone, `.aaw/now.md`

## Commit Checkpoint

```text
feat: settings page with persisted prefs
```

Commit status: `UNCOMMITTED`

## Handoff

Do after T-0002 header/CSS exists to avoid divergence.
