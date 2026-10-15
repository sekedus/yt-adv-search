# NOW

> Primary current-state snapshot and navigation layer.
> Keep this short. Do not turn it into a chronological diary.

## Workflow Phase

BUILD (M-0003 IN_PROGRESS — T-0008/T-0009/T-0010 COMPLETE; closes only on explicit user confirmation; no active task)

## State Integrity

CONSISTENT

## Current Milestone

M-0003 — Filter/topbar/settings neat pass (IN_PROGRESS — T-0008/T-0009 COMPLETE; closes only on explicit user confirmation). See `dev/milestones/M-0003-filter-topbar-settings.md`.

## Current Task

None — T-0010 COMPLETE (HDT PASS 2026-10-16). M-0003 left open per user instruction.

## Current Step

T-0010 complete and verified. Committing on user request.

## Objective

Ship T-0010: quota-aware key exclusion, cached API results with refresh, `playlist:` scope + filter, `/`-to-focus, top/bottom jump buttons, plus follow-ups (entity decode, custom cache TTL, live categories, resultbar/list mobile fixes, back-nav crash fix).

## Next Action

Commit T-0010 completion. No further work without user direction; M-0003 closes only when user says complete.

## Current Blocker

None.

## Relevant Files

- `dev/milestones/M-0003-filter-topbar-settings.md`
- `dev/tasks/done/T-0010-quota-cache-playlist-ux.md`
- `worker.js`
- `dev/tasks/done/T-0009-mobile-nav-focus-help.md`
- `dev/tasks/done/T-0008-filter-topbar-settings.md`
- `public/index.html`
- `public/settings.html`
- `public/tools.html`
- `public/styles.css`
- `dev/verification.md`

## Constraints

- Read `dev/constraints.md` before compatibility/platform decisions.
- Keys server-only; enrichment OFF default; only /settings Save writes `ytas.enrich`.
- Keep `.container`/filter/topbar class contracts; keep `ytas.*` keys.

## Verification Snapshot

Status: T-0010_COMPLETE (M-0003 held open per user instruction)

Evidence:

- T-0008 COMPLETE (HDT PASS 2026-10-16).
- T-0009 COMPLETE (HDT PASS 2026-10-16).
- T-0010 automated: `node --check worker.js` PASS; inline scripts PASS; `style=` zero PASS; 43/43 mocked functional PASS (quota/rotation/exclusion, cache MISS/HIT/fresh, TTL clamp + key strip, categories slim/cache/region, playlist fetch/filter); wrangler smoke (`/`, `/tools`, `/settings` 200; API 400s clean + `x-cache-status`; live `/api/categories` 200 with 15 US categories). One 100-unit live probe spent diagnosing the entity title (upstream sends `&#39;` verbatim).
- HDT REQUIRED — PASS (user report 2026-10-16: pass).

## Commit Policy

Initial: ASK
Planning: ASK
Task: ASK

See `dev/commit-policy.md`.

## Last Checkpoint

c33a00a feat: quota-aware key rotation, cached search with refresh, playlist scope, slash-focus and jump buttons (T-0010 COMPLETE)

## README Status

REVIEWED — still accurate (bar + filters + tools + settings); no layout-detail changes needed for T-0009.

## Important Context

- M-0001 COMPLETE (T-0001..T-0004 in `dev/tasks/done/`).
- M-0002 COMPLETE (T-0005..T-0007 in `dev/tasks/done/`).
- M-0003 IN_PROGRESS held open per user (T-0008 + T-0009 COMPLETE in `dev/tasks/done/`).

## Do Not Change

- M-0003 stays open until the user explicitly says complete — do not flip it on task completion.

## Resume Instruction

Read this snapshot first. Then inspect the active milestone/task and only the other durable artifacts relevant to the current request.
