# NOW

> Primary current-state snapshot and navigation layer.
> Keep this short. Do not turn it into a chronological diary.

## Workflow Phase

BUILD (M-0002 ACTIVE; no active task)

## State Integrity

CONSISTENT

## Current Milestone

M-0002 — Improve UI/UX (ACTIVE). See `dev/milestones/M-0002-improve-ui-ux.md`.

## Current Task

None — T-0005/T-0006 COMPLETE; T-0007 PLANNED, implementation not authorized.

## Current Step

T-0006 complete and verified. Awaiting user direction (start T-0007 or adjust plan).

## Objective

Polish UI/UX: layout, filter panel, results cards, settings.

## Next Action

Start T-0007 only when user explicitly authorizes implementation.

## Current Blocker

None.

## Relevant Files

- `dev/milestones/M-0002-improve-ui-ux.md`
- `dev/tasks/done/T-0005-search-filter-ux.md`
- `dev/tasks/T-0006-results-cards-views.md`
- `dev/tasks/T-0007-settings-polish.md`
- `public/index.html`
- `public/settings.html`
- `public/styles.css`
- `dev/verification.md`

## Constraints

- Read `dev/constraints.md` before compatibility/platform decisions.
- Keys server-only; enrichment OFF default.
- T-0005 shares `.container`/filter CSS with T-0006/T-0007; keep class contracts.

## Verification Snapshot

Status: T-0006_COMPLETE

Evidence:

- `node --check worker.js` — PASS (only change: paid-promo allowlist entry).
- Static 110/110 PASS + behavior 11/11 PASS + id refs resolve (see done task Notes/Evidence).
- HDT REQUIRED — PASS (user report 2026-10-15: all rounds passed, zero console errors).

## Commit Policy

Initial: ASK
Planning: ASK
Task: ASK

See `dev/commit-policy.md`.

## Last Checkpoint

4260292 feat: search layout and filter panel UX

## README Status

UPDATED — filter share URLs + advanced filters documented.

## Important Context

- M-0001 COMPLETE (T-0001..T-0004 in `dev/tasks/done/`).
- Grid/list column counts assumed from screenshots; confirm at implementation.
- T-0005 advanced decision: year/API + client post-filters live; hide-watched dropped (no history).

## Do Not Change

- Do not expand into filter panel (T-0005 done) or Settings (T-0007) scope.

## Resume Instruction

Read this snapshot first. Then inspect the active milestone/task and only the other durable artifacts relevant to the current request.
