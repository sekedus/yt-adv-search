# Roadmap

> Product direction and milestone summary.

## Current Milestone

None — M-0003 COMPLETE (closed 2026-10-22 by explicit user instruction).

## Milestones

- M-0001 — yt-adv-search v1 — COMPLETE — Worker proxy + search + tools + settings.
- M-0002 — Improve UI/UX — COMPLETE — Layout + filters + cards + settings polish.
- M-0003 - Filter/topbar/settings neat pass (COMPLETE - T-0008/T-0009/T-0010/T-0011/T-0012/T-0013 COMPLETE with HDT PASS; closed by explicit user instruction 2026-10-22).

## Task Index

- T-0001 — Worker proxy + key rotation + operator resolution — COMPLETE (M-0001, unblocks T-0002/T-0003)
- T-0002 — Search page (filters, results, theme) — COMPLETE (M-0001; HDT PASS)
- T-0003 — Tools page (channel resolver) — COMPLETE (M-0001; HDT PASS)
- T-0004 — Settings page + header/nav polish — COMPLETE (M-0001; HDT PASS)
- T-0005 — Search layout + filter panel UX — COMPLETE (M-0002; HDT PASS)
- T-0006 — Results cards + view modes + scopebar + dates — COMPLETE (M-0002; HDT PASS)
- T-0007 — Settings polish + global responsive — COMPLETE (M-0002; HDT PASS)
- T-0008 — Filter panel neat layout + topbar center/hamburger + settings merge — COMPLETE (M-0003; HDT PASS)
- T-0009 — Mobile nav overlay fix + focus/autofocus + topbar/nav + stacked help + no-inline-style — COMPLETE (M-0003; HDT PASS)
- T-0010 — Quota-aware keys + result cache + playlist scope + keyboard/scroll UX — COMPLETE (M-0003; HDT PASS)
- T-0011 — Favicon wiring + beginner README — COMPLETE (M-0003; HDT PASS)
- T-0012 — Broadcast, Dates + four video-quality filter panels (Episode (Show) value `episode`, Features removed, exclude words in the search bar, Advanced full width, clear ✕ on text inputs, flexible Advanced → More layout on narrow screens) — COMPLETE (M-0003; HDT PASS 2026-10-19)
- T-0013 — Resolver image/title channel links + Invidious + bare-name multi-check (`/@`, `/user`, `/c`; explicit forms exact) + found/cached status + Refresh next to status, scoped Shorts badge + `/shorts/` links (HEAD-first + 1-day cache, UUSH API fallback), `/api/*` own-origin gate, mobile nav transparent backdrop + outside close, channel 7-day/category 1-month caches + search default 30 min, no browser category list + region-fresh refetch, clear × focus/aria-hidden fix, q `%20`/literal-space vs literal-plus parsing (whitespace-only q accepted; app q encoded `%20`/`%2B`) - COMPLETE (M-0003; HDT PASS 2026-10-22)
- T-0014 — Root README beginner rewrite (short paragraphs, ~900px reading width, same content) - COMPLETE (standalone docs task; HDT NOT_REQUIRED)

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
