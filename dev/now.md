# NOW

> Primary current-state snapshot and navigation layer.
> Keep this short. Do not turn it into a chronological diary.

## Workflow Phase

BUILD (T-0001, T-0002 complete; T-0003/T-0004 awaiting authorization)

## State Integrity

CONSISTENT

## Current Milestone

M-0001 — yt-adv-search v1 (IN_PROGRESS). See `dev/milestones/M-0001-yt-adv-search-v1.md`.

## Current Task

None — T-0002 COMPLETE (see `dev/tasks/done/T-0002-search-page.md`, HDT PASS). Next when authorized: T-0003 or T-0004.

## Current Step

T-0002 verified and closed. Awaiting user authorization to start T-0003/T-0004.

## Objective

Build yt-adv-search v1: Worker proxy + search + tools + settings.

## Next Action

Start T-0003 or T-0004 only when user explicitly authorizes implementation.

## Current Blocker

None.

## Relevant Files

- `dev/project.md`
- `dev/roadmap.md`
- `dev/milestones/M-0001-yt-adv-search-v1.md`
- `dev/tasks/done/T-0001-worker-proxy.md`
- `worker.js`
- `wrangler.toml`
- `ARCHITECTURE-MAP.md`
- `dev/verification.md`

## Constraints

- Read `dev/constraints.md` before compatibility/platform decisions.
- Keys server-only; enrichment OFF default.

## Verification Snapshot

Status: T-0002_VERIFIED

Evidence:

- `node --check worker.js` — PASS (untouched).
- Static checks 36/36 PASS (syntax, ids, tooltips, options, safe rendering,
  theme contract, prefs keys, `?channel=` link-in).
- Live wrangler smoke: `/` serves real page, `/styles.css` serves CSS,
  `/api/search` error path clean.
- HDT PASS (user 2026-10-13): scoped search, filters + enrichment, tooltips,
  pager, theme persistence, zero console errors.

## Commit Policy

Initial: ASK
Planning: ASK
Task: ASK

See `dev/commit-policy.md`.

## Last Checkpoint

TASK_COMPLETE_T-0002

## README Status

UPDATED_FOR_T-0002 — search-live status recorded, no task diary.

## Important Context

- Grill confirmed 2026-10-13; vanilla + Worker proxy + re-added filters + operators + separate /tools + /settings + opt-in enrichment.
- Parking lot reviewed: empty, nothing to promote.

## Do Not Change

- Do not touch worker.js API behavior (T-0001 owns it).
- Do not build Tools/Settings pages without authorization (T-0003/T-0004 own them).
- Do not invent product scope beyond confirmed grill.

## Resume Instruction

Read this snapshot first. Then inspect the active milestone/task and only the other durable artifacts relevant to the current request.
