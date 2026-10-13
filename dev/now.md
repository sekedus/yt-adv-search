# NOW

> Primary current-state snapshot and navigation layer.
> Keep this short. Do not turn it into a chronological diary.

## Workflow Phase

BUILD (T-0001 complete; T-0002/T-0003 unblocked, awaiting authorization)

## State Integrity

CONSISTENT

## Current Milestone

M-0001 — yt-adv-search v1 (IN_PROGRESS). See `dev/milestones/M-0001-yt-adv-search-v1.md`.

## Current Task

None — T-0001 COMPLETE (see `dev/tasks/done/T-0001-worker-proxy.md`). Next when authorized: T-0002 or T-0003.

## Current Step

T-0001 verified and closed. Awaiting user authorization to start T-0002/T-0003.

## Objective

Build yt-adv-search v1: Worker proxy + search + tools + settings.

## Next Action

Start T-0002 or T-0003 only when user explicitly authorizes implementation.

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

Status: T-0001_VERIFIED

Evidence:

- `node --check worker.js` — PASS.
- Mocked checks 32/32 PASS (rotation, operators, egress, channel, static, no-leak).
- Live wrangler smoke: /, /tools, /settings 200; /nope 404; /api/search no-q 400;
  dummy-key search + channel → rotated 502 clean, no key values in bodies.
- Security L1 review recorded in `dev/tasks/done/T-0001-worker-proxy.md`.

## Commit Policy

Initial: ASK
Planning: ASK
Task: ASK

See `dev/commit-policy.md`.

## Last Checkpoint

TASK_COMPLETE_T-0001

## README Status

UPDATED_FOR_DISCOVERY — real scope recorded, no task diary.

## Important Context

- Grill confirmed 2026-10-13; vanilla + Worker proxy + re-added filters + operators + separate /tools + /settings + opt-in enrichment.
- Parking lot reviewed: empty, nothing to promote.

## Do Not Change

- Do not expand T-0001 into page markup (T-0002..T-0004 own it).
- Do not invent product scope beyond confirmed grill.

## Resume Instruction

Read this snapshot first. Then inspect the active milestone/task and only the other durable artifacts relevant to the current request.
