# NOW

> Primary current-state snapshot and navigation layer.
> Keep this short. Do not turn it into a chronological diary.

## Workflow Phase

BUILD (M-0003 IN_PROGRESS — T-0012 + B-0001 COMPLETE (HDT PASS 2026-10-19), committed; T-0008/T-0009/T-0010/T-0011 COMPLETE; all criteria met — closes only on explicit user confirmation)

## State Integrity

CONSISTENT

## Current Milestone

M-0003 — Filter/topbar/settings neat pass (IN_PROGRESS — all tasks (T-0008..T-0012 + B-0001) COMPLETE with HDT PASS; awaits explicit user confirmation to close). See `dev/milestones/M-0003-filter-topbar-settings.md`.

## Current Task

No active task. T-0012 (filter panel rework: Episode (Show), Dates, broadcast + four quality panels, exclude words in the search bar, clear ✕ with input type kept `text`, flexible Advanced → More rows ≤720px) and B-0001 (results-card meta RTL order) are COMPLETE + HDT PASS (2026-10-19) and committed — records in `dev/tasks/done/` and `dev/bug-fixes/done/`. Awaiting only the explicit M-0003 close.

## Current Step

T-0012 + B-0001 finished and user-verified (HDT "all pass"), then committed (checkpoint `feat: broadcast, dates and video-quality filter panels replace Features`). Follow-up doc audit (user request): the search param chain matches the official search.list / videos.list / videoCategories.list references — params, enum values and `type=video` constraint handling are correct; four optional hardening ideas parked as PL-0001..PL-0004.

## Objective

Ship T-0012: relabel Type `Show` → `Episode (Show)` and rename its value to `episode`; remove Features; add an exact-range Dates panel before Definitions (After/Before moved out of Advanced; `?` help in the legend with one combined info line at the bottom; `after`/`before` → `publishedAfter`/`publishedBefore`); add opt-in Broadcasts panel (`eventType` live/upcoming/completed, label Disabled/Enabled) and four separate quality panels (Definitions/Captions/Licenses/Dimensions → `videoDefinition`/`videoCaption`/`videoLicense`/`videoDimension`, default Any); remove the six superseded Advanced → More rows; move Exclude words from Advanced into the search bar (keyword + exclude words + Search; `-word` tokens, URL key `ex`); keep Advanced full-width at every viewport; URL keys `event`/`definition`/`caption`/`license`/`dimension` (+ `type=episode`, `after`/`before`, `ex`) (+ legacy read mapping (`type=show`, rev-2 abbreviations, old quality keys); rev 7: clear ✕ on every text input via shared `input-clear.js` — input type unchanged, resets re-sync; rev 8: flexible Advanced → More rows on narrow screens).

## Next Action

Await the user's explicit confirmation to close M-0003 (all tasks complete, all criteria satisfied; no implementation work remains).

## Current Blocker

None — only the explicit M-0003 close is pending user action.

## Relevant Files

- `dev/tasks/done/T-0012-filter-broadcast-quality-panels.md`
- `dev/bug-fixes/done/B-0001-card-meta-rtl-bidi.md`
- `public/input-clear.js`
- `dev/milestones/M-0003-filter-topbar-settings.md`
- `dev/tasks/done/T-0011-favicon-beginner-readme.md`
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

Status: T-0012 COMPLETE + B-0001 COMPLETE (HDT PASS 2026-10-19; M-0003 held open per user instruction)

Evidence:

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

feat: broadcast, dates and video-quality filter panels replace Features (T-0012 + B-0001 COMPLETE)

## README Status

README updated in T-0012 (filter list line: "upload date or an exact date range, broadcast status, four video-quality panels"; search bar keyword + exclude words + clear ✕ on text fields); full beginner rewrite from T-0011 unchanged.

## Important Context

- M-0001 COMPLETE (T-0001..T-0004 in `dev/tasks/done/`).
- M-0002 COMPLETE (T-0005..T-0007 in `dev/tasks/done/`).
- M-0003 IN_PROGRESS held open per user (all tasks T-0008..T-0012 COMPLETE in `dev/tasks/done/`; awaits explicit user close).
- B-0001 COMPLETE in `dev/bug-fixes/done/` (results-card meta RTL order; fixed in the same review as T-0012 rev 7; HDT PASS 2026-10-19).
- Working tree carries pre-existing uncommitted user edits outside T-0012/B-0001 (`worker.js`, `public/tools.html`, `.gitignore`, `README.md` similar-projects, `LICENSE`, `assets/`, `data/`, earlier index.html reorder/categories) — preserve; not part of this task's commit scope.

## Do Not Change

- M-0003 stays open until the user explicitly says complete — do not flip it on task completion.

## Resume Instruction

Read this snapshot first. Then inspect the active milestone/task and only the other durable artifacts relevant to the current request.
