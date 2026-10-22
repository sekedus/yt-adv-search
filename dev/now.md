# NOW

> Primary current-state snapshot and navigation layer.
> Keep this short. Do not turn it into a chronological diary.

## Workflow Phase

IDLE (M-0003 COMPLETE 2026-10-22; T-0014 COMMITTED; no active task)

## State Integrity

CONSISTENT

## Current Milestone

None — M-0003 COMPLETE (closed 2026-10-22 by explicit user instruction). See `dev/milestones/M-0003-filter-topbar-settings.md`.

## Current Task

None — no active task. Last task: T-0014 (README rewrite, docs-only, COMPLETE + COMMITTED). Last milestone task: T-0013 (resolver links/Invidious + multi-check, scoped Shorts badges + `/shorts/` links, `/api/*` origin gate, mobile nav backdrop/outside close, channel 7-day/category 1-month caches + search default 30 min, q `%20`/literal-plus parsing, clear-button aria fix). See `dev/tasks/done/T-0013-resolver-shorts-api-nav.md`.

## Current Step

M-0003 is closed and all remaining working-tree changes are committed. Nothing is in progress.

## Objective

Keep the shipped app stable. No milestone or task is active; start new work only on the user's next request.

## Next Action

Await the user's next request. Do not start new product work unprompted.

## Current Blocker

None. M-0003 is closed and the working tree is committed.

## Relevant Files

- `dev/tasks/done/T-0014-readme-shorter-paragraphs.md`
- `dev/tasks/done/T-0013-resolver-shorts-api-nav.md`
- `dev/milestones/M-0003-filter-topbar-settings.md`
- `README.md`
- `worker.js`
- `public/tools.html`
- `public/index.html`
- `public/settings.html`
- `public/styles.css`
- `dev/security.md`
- `dev/verification.md`

## Constraints

- Read `dev/constraints.md` before compatibility/platform decisions.
- Keys server-only; enrichment OFF default; only /settings Save writes `ytas.enrich`.
- Keep `.container`/filter/topbar class contracts; keep `ytas.*` keys.

## Verification Snapshot

Status: M-0003 COMPLETE (closed 2026-10-22, explicit user instruction); T-0014 COMPLETE (docs-only, HDT NOT_REQUIRED) and COMMITTED; T-0013 COMPLETE + HDT PASS (2026-10-22) and COMMITTED. No active task.

Evidence:

- T-0014 automated PASS (2026-10-22): README structure check 0 prose lines >100 chars, 12 fences balanced, `<details>` 1/1, `<picture>` 2/2, 26 headings, 16 links / 0 broken anchors or relative targets, 27/27 required topic keywords; Chromium line-width probe (GitHub-like 16px) 138 lines measured, widest 665.9px (< ~900px target); diff vs `HEAD:README.md` 0 URLs added/removed, no numeric facts lost, commands unchanged (only Project layout descriptions shortened); GitHub-API render + 4 Chromium screenshots at 1280px reviewed. Fixed stale `#add-your-api-key-all-methods` anchor to `#add-your-api-key`.

- T-0013 automated PASS (2026-10-20): `node --check worker.js`; 6/6 inline scripts compile; Node harness with mocked upstream 16/16 (origin helper 8/8, cross-origin 403 without upstream call, same-origin/headerless 200, `Sec-Fetch-Site` 403, HEAD 200 = Short, HEAD 303 `/watch` = video, 1-day positive/negative cache + cache hit skips HEAD/API, HEAD canary failure → API fallback, single ambiguous HEAD → one API fallback, missing-playlist 404 caches false, non-scoped no checks, UUSH playlist direct, normal playlist HEAD, 40-video cap + `shortsDetectionLimited`, probe failure non-fatal/uncached, static not gated); real workerd HEAD smoke (`GAH8Je1kZ-A` → short, `82CX6WULNA0` → video; actual `shortCacheGet`/`shortCachePut` first request miss→true, second request hit); wrangler smoke (live cross-origin 403, static 200); Playwright/Chromium (mocked `/api/*`, no quota) tools channel image/title links + Invidious at 360px with no overflow, nav backdrop/outside close on all three pages, hamburger toggle, resize >700px close, desktop nav unchanged, exactly one Shorts badge with duration/playlist badges intact, 0 console errors. Found/fixed: missing `id="result"` on the Tools result section had disabled the existing ≤640px card row; mobile image now 140px and linked.
- T-0013 follow-up automated PASS (2026-10-22): `node --check worker.js` + 6/6 inline scripts; cache harness 7/7 (channel 7-day TTL + fresh rewrite; categories 1-month TTL + assignable filter + region key + fresh rewrite; search TTL key/read-only fresh; search default `max-age=1800`; q `%20` whitespace/space, literal plus, and empty-q rejection); T-0013 harness 16/16 regression; t0015 channel multi harness 15/15 (bare android/tensorflow 2, chrome/firebase 1; `/c/`, `/user/`, `/@`, `/channel/` exact forms; dedupe; cache/refresh); Playwright/Chromium 9/9 (mocked `/api/*`, no quota) includes bare-name multi cards/status/Refresh; live resolver checks confirm the same counts and `/c/chrome` 200, `/user/chrome` + `/@chrome` 404, `/@GoogleChrome` 200. Tools actions `Use in search` + `Invidious ↗`; status/cache/Refresh behavior; Shorts links; categories; 30-minute default; q encoding; clear-button aria/focus; 0 console/page errors.
- T-0013 HDT — PASS (user report 2026-10-22: "all test pass"; covers resolver links/Invidious, bare-name multi-check + exact URL forms, 403 gate, Shorts links/badges, nav, category/region, cache default, q encoding, clear ×). Task COMPLETE and committed.
- Doc audit (2026-10-19, user request): search.list / videos.list / videoCategories.list conformance re-checked — params + enum values match the reference; video-only filters are sent only with `type=video` (auto-coerced); `location` is always paired with a valid `locationRadius`; Category ids come from live `videoCategories.list`; dates are RFC 3339; exclude words use the `-` NOT operator; videos.list `id` batches ≤50 and never combines with maxResults; categories call uses `part=snippet` + `regionCode` only. No violations found; hardening ideas PL-0001..PL-0004.
- T-0012 automated (rev 8): static checks PASS (rev 8 section: More rows flex + wrap ≤720px, compact controls may stay next to the label, text-input + Category controls take the full row, qinfo/hint + clear wrapper span the row, flex rules scoped to ≤720px, desktop `.advrow` grid 200px/1fr/28px unchanged); Playwright/Chromium layout pass (360px: checkboxes + Channel type inline with label/?; Category label row + full-width select; Topic/Location/Radius label row + full-width input 252/280px; help info full width; ✕ still works in the More fields; 700px ≤720px flexible rows, no overlap/overflow; 900px + 1500px desktop grid restored; 0 console errors).
- T-0012 automated (rev 7): static checks PASS (rev 6 checks unchanged + input-clear.js compiles and never sets type=search; all 9 text inputs stay type="text"; all pages load `/input-clear.js`; sync calls in index + settings; `.inputclear`/`.clrbtn` CSS incl. `[hidden]` display none, Advanced 300px cap, resolve-row 280px, settings 6em; zero inline styles); wrangler smoke 200; Playwright/Chromium functional pass (6/6 index inputs wrapped + type=text; ✕ hidden→shown→clears+refocuses+hides; Reset + URL restore re-sync the ✕; #f-scope wrapper 300px, #region 6em, tools resolver fills; tools/settings ✕ work; search form one row desktop / stacked 360px; 0 console errors; mocked /api/search, no quota).
- B-0001 automated (fix): Playwright/Chromium with 3 mocked cards — Arabic, Latin+digit, plain Latin channel names all measure in screen order (channel → ` · ` → time; e.g. Arabic a 29→75, separator 75→85, time 85→147); legacy probe without isolation still breaks (separator 40→52, time fragments 31→176); `dir="auto"` + `unicode-bidi: isolate` on all rows; 0 console errors; light + dark screenshots.
- T-0012 automated (rev 6): static checks PASS (inline scripts compile; id refs + setRadio names + input names resolve; removed ids incl. qh-after/qh-before/qh-ex absent; Features + Video quality legends gone; Type value `episode` + legacy `type=show` read; full-word quality names definition/caption/license/dimension; Dates panel before Definitions with linked labels, aligned full-width After/Before inputs, `?` in the legend and a short combined info at the bottom; broadcast label defaults Disabled and flips Enabled/Disabled; exclude words input in the search form between keyword and Search (hidden label, placeholder `exclude words`), old Advanced row gone; search form wraps/stacks with a right-aligned submit; Advanced full-width rule lives outside the 1200px media query; 10 top-level fieldsets before Advanced; no qualgrid/qgroup; zero inline styles); wrangler smoke 200; Playwright/Chromium functional pass (exclude via Enter → q `-spoiler -clickbait` + `ex` URL key + "(exclusions)" note + reload/reset; Dates help toggle + row alignment + range round-trip/reload; submit hidden while Filters open and visible when closed; Episode/search + broadcast/quality regression; URL round-trip; 1500px/900px/360px search-form rows + Advanced width == filtergrid width; no overflow; 0 console errors) — upstream mocked, no quota spent.
- T-0012 HDT REQUIRED — PASS (user report 2026-10-19 "all pass"; covers the rev 6/7/8 steps incl. clear ✕ and the More layout).
- B-0001 HDT REQUIRED — PASS (user report 2026-10-19 "all pass"; RTL channel names keep the `channel · date` order).
- T-0011 automated + HDT REQUIRED — PASS (user report 2026-10-15).
- T-0010 automated PASS; T-0010 HDT REQUIRED — PASS (user report 2026-10-16).
- T-0008 COMPLETE (HDT PASS 2026-10-16).
- T-0009 COMPLETE (HDT PASS 2026-10-16).

## Commit Policy

Initial: ASK
Planning: ASK
Task: ASK

See `dev/commit-policy.md`.

## Last Checkpoint

chore: close M-0003; add GitHub nav links, license, assets and docs

## README Status

README rewritten in T-0014 for beginners: short one-idea paragraphs, prose wrapped at ≤100 chars (widest rendered line 665.9px), troubleshooting converted from a wide table to a scannable list, same topics/facts/links preserved (features, shortcuts, tools, settings, how it works, setup A/B/C, key setup, everyday use, quotas, troubleshooting, layout, contributors, notes, disclaimer, license); stale `#add-your-api-key-all-methods` anchor fixed. Earlier T-0013 details remain accurate.

## Important Context

- M-0001 COMPLETE (T-0001..T-0004 in `dev/tasks/done/`).
- M-0002 COMPLETE (T-0005..T-0007 in `dev/tasks/done/`).
- M-0003 COMPLETE (closed 2026-10-22; T-0008..T-0013 + B-0001 COMPLETE and HDT PASS).
- T-0014 COMPLETE (standalone docs; README beginner rewrite; no milestone).
- B-0001 COMPLETE in `dev/bug-fixes/done/` (results-card meta RTL order; fixed in the same review as T-0012 rev 7; HDT PASS 2026-10-19).
- No uncommitted project changes remain after the closure commit (only ignored local `.env`, `data/`, and `.wrangler/` state).

## Do Not Change

- M-0003 is COMPLETE (closed 2026-10-22); do not reopen it without explicit user instruction.

## Resume Instruction

Read this snapshot first. Then inspect the active milestone/task and only the other durable artifacts relevant to the current request.
