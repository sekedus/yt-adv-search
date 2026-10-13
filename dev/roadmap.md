# Roadmap

> Product direction and milestone summary.

## Current Milestone

M-0001 — yt-adv-search v1 (IN_PROGRESS)

## Milestones

- M-0001 — yt-adv-search v1 — IN_PROGRESS — Worker proxy + search + tools + settings.

## Task Index

- T-0001 — Worker proxy + key rotation + operator resolution — COMPLETE (M-0001, unblocks T-0002/T-0003)
- T-0002 — Search page (filters, results, theme) — COMPLETE (M-0001; HDT PASS)
- T-0003 — Tools page (channel resolver) — PLANNED (M-0001, blocked by T-0001)
- T-0004 — Settings page + header/nav polish — PLANNED (M-0001, blocked by T-0002)

## Roadmap Rules

- Milestones group bounded outcomes that are too broad for one task.
- A milestone is a summary/navigation layer, not a second task file.
- A task is a bounded work unit with its own acceptance and verification boundary.
- Task IDs are unique and monotonic within the project.
- Do not create a task merely to record workflow installation.
- When a new milestone is planned, review `dev/parking-lot.md` for related project ideas and ask the user before promoting any of them.
- Active task state belongs in `dev/tasks/`; completed task files move to `dev/tasks/done/` only after all required verification gates pass. Cancelled task files move to `dev/tasks/cancelled/`, with the reason recorded and the task crossed out—not deleted—in its milestone.
- Creating a milestone and decomposing a multi-item request is planning-only unless the user explicitly authorizes implementation; leave child tasks `PLANNED` and stop.

- When a linked task changes state, reconcile its milestone in the same state transaction. A milestone is `COMPLETE` only when every non-cancelled task is `COMPLETE` and every non-struck exit criterion is satisfied. If all tasks are cancelled, the milestone is `CANCELLED`.
- After creating or materially replanning a milestone and its planned child tasks, apply the `planning` checkpoint from `dev/commit-policy.md`, then stop unless implementation was explicitly authorized.
