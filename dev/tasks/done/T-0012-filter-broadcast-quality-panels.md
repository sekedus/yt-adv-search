---
id: T-0012
type: feature
status: COMPLETE
milestone: M-0003
size: MEDIUM
created: "2026-10-19"
updated: "2026-10-19"
hdt_requirement: REQUIRED
hdt_status: PASS
cancellation_reason: null
---

# T-0012 — Broadcast, Dates + video-quality filter panels (Features replaced)

Frontmatter is the canonical source for task metadata. Do not add a second `Status` field in the body.

## Objective

Rework the search filter panel: relabel Type `Show` → `Episode (Show)` and rename its value to `episode`, remove the Features checkbox panel, add an exact-range Dates panel (After/Before, one help badge in the legend with combined info at the bottom), and add search.list-backed panels — an opt-in Broadcasts panel (`eventType`) plus four separate video-quality panels (Definitions / Captions / Licenses / Dimensions) defaulting to Any (`videoDefinition`, `videoCaption`, `videoLicense`, `videoDimension`). Follow-up review (rev 6): move the Exclude words field out of Advanced into the search bar next to the keyword, and make the Advanced panel span the full filter grid at every viewport. Follow-up review (rev 7): give every `input[type="text"]` a clear ✕ button (same affordance as the search field's native cancel button) without changing the input type — shared `public/input-clear.js` + per-context sizing. The results-card meta RTL ordering bug found in the same review is tracked and fixed separately as `B-0001`. Follow-up review (rev 8): make the Advanced → More rows flexible on narrow screens — compact controls (checkboxes, the short Channel type select) sit on the label's line, while wide fields (text inputs, the long Category select) take a full-width row below the label (see user sketch before/after).

## Size / Scope

MEDIUM — `public/index.html` (markup + inline JS: buildParams, URL sync, reset, coercion; search bar now hosts the exclude words field; rev 7: `syncInputClear()` after URL restore/reset + script tag), `public/styles.css` (opt-in dim state; Dates panel row + legend help badge; search-form row/wrap layout; Advanced full-width at every breakpoint; the four quality panels use base fieldset styles; rev 7: `.inputclear`/`.clrbtn` styles + per-context sizing; rev 8: flexible Advanced → More rows ≤720px), new shared `public/input-clear.js` loaded by `/`, `/tools` and `/settings` (rev 7: clear ✕ for text inputs; settings Reset re-sync), README filter line, `ARCHITECTURE-MAP.md` filter-map line, `dev/project.md` filter summary. No `worker.js` change (every param is already whitelisted); no new API calls.

### In Scope

- Type radios: `Show` → `Episode (Show)`; value renamed `show` → `episode` (URL key becomes `type=episode`), still mapped to `type=video&videoType=episode`; legacy `?type=show` share links restore Episode.
- Remove the Features fieldset (`f-live`, `f-hd`, `f-cc`, `f-commons`).
- New **Broadcasts** panel (opt-in checkbox):
  - Off (default): radios disabled + dimmed, selection cleared, no `eventType` param, no URL key.
  - On: radios enabled, Live preselected (panel order); sends `eventType=live|upcoming|completed` with the existing video-only coercion.
- New **Dates** panel (placed immediately before Definitions):
  - Moves the After/Before date inputs out of Advanced; still maps to `after` / `before` → `publishedAfter` / `publishedBefore` (existing query-operator precedence unchanged).
  - Two aligned rows (label column + full-width date inputs) in a compact grid; one `?` help badge next to the DATES legend toggles a short combined info line at the bottom of the panel (replaces the two per-row Advanced help texts).
- Four separate **Definitions / Captions / Licenses / Dimensions** panels in the main filter grid (top-level fieldsets, one radio group each, default `Any`; Any sends nothing):
  - Definitions `definition`: any / high (HD) / standard (SD) → `videoDefinition`.
  - Captions `caption`: any / closedCaption / none → `videoCaption`.
  - Licenses `license`: any / creativeCommon / youtube → `videoLicense`.
  - Dimensions `dimension`: any / 2d / 3d → `videoDimension`.
- Remove the six superseded Advanced → More controls (user-confirmed 2026-10-19): `f-upcoming`, `f-completed`, `f-sd`, `f-stdlic`, `f-nocap`, `f-dim` — the new panels own those params (one control per param). The After/Before rows also leave Advanced (they now live in the Dates panel). Keep Embeddable, Playable outside YouTube, Paid promotion, Channel type, Category, Topic id, Location, Radius.
- URL sync: full-word keys `event` / `definition` / `caption` / `license` / `dimension`; Dates keeps the existing `after` / `before` keys. Legacy read mapping for the rev-2 abbreviated keys (`def`,`cap`,`lic`,`dim`) and pre-T-0012 keys (`live`,`upcoming`,`completed` → event with live>upcoming>completed precedence; `hd`,`sd` → definition; `cc`,`nocap` → caption; `commons`,`stdLic` → license; `dim` → dimension) so existing share links keep their filters (T-0005 legacy-mapping precedent). Missing keys restore defaults — no stale carry-over on back/forward.
- Reset and history restore cover the new controls; zero inline styles (T-0009 rule).
- Review (rev 6, 2026-10-19):
  - The search bar hosts the keyword and the **exclude words** field (`f-ex` moved out of Advanced; placeholder `exclude words`, visually-hidden label; the Advanced row + its `?` help badge are gone). Same semantics: words ride along as `-word` query tokens, URL key `ex`, Enter submits the form, reload restores, Reset clears.
  - The **Advanced** fieldset spans the full filter grid (`fs-full`) at every viewport width, not only ≥1200px.
  - Search bar layout: one row on desktop (keyword | exclude words | Search); stacked full-width fields with a right-aligned Search button on narrow screens; the Search button still hides while Filters are open.
- Review (rev 7, 2026-10-19):
  - Every `input[type="text"]` gets a clear ✕ button that mimics the search field's built-in cancel button; the input type stays `text` (no `type="search"` switch). A shared `public/input-clear.js` wraps each text input in `.inputclear` + `.clrbtn` (hidden while empty; click empties the value, re-fires `input`/`change` and refocuses).
  - Loaded on `/`, `/tools` and `/settings`; programmatic clears re-sync via `window.syncInputClear()` (index `readStateFromURL` + `resetFilters`, settings Reset).
  - Per-context sizing in `styles.css`: the search form's flex role moves to the wrapper, Advanced wrappers keep the 300px cap (dropped ≤720px), the resolver row keeps 280px, settings keeps 6em.
  - Results-card meta bidi bug (RTL channel names reordering ` · time`) found in the same review is tracked as `B-0001`, not as a T-0012 acceptance criterion.
- Review (rev 8, 2026-10-19, user sketch):
  - Advanced → More rows switch to a wrapping flex layout at ≤720px: compact controls (the three checkboxes, the short Channel type select) stay on the label's line; wide fields (text inputs, the long Category select) take a full-width row below the label; help info spans the row.
  - Desktop/laptop (>720px) keeps the existing 200px-label grid unchanged; the clear ✕ wrappers still fill the row inside More.

### Out of Scope

- `worker.js`, new API params beyond the listed ones. (`public/tools.html` and `public/settings.html` are touched in rev 7 only to load the shared clear-button script + the settings reset sync.)
- Keeping the removed Advanced rows in parallel.
- Rewriting existing history entries to new URL keys.

## Acceptance Criteria

- [x] Type panel: option labeled `Episode (Show)` (value `episode`); selecting it still sends `type=video&videoType=episode`; legacy `?type=show` URLs restore Episode.
- [x] Features panel is gone; no `f-live`/`f-hd`/`f-cc`/`f-commons` references remain.
- [x] Broadcasts panel: off by default → three radios disabled + visibly dimmed (opacity 0.45), none selected; checkbox label reads `Disabled` when off and `Enabled` when on; toggling on enables them and preselects Live; toggling off clears the selection and re-disables/dims; off sends no `eventType`.
- [x] Dates panel sits immediately before Definitions; After/Before live inside it (no longer in Advanced), labels + full-width inputs align in two neat rows; one `?` badge next to the DATES legend toggles a short combined info line at the bottom of the panel.
- [x] Date range still sends `after` / `before` (→ `publishedAfter` / `publishedBefore` upstream) and restores from the URL; Reset clears both inputs.
- [x] Broadcast selection maps to `eventType` only on video-capable searches (existing coercion + `(Video-only filters…)` note unchanged).
- [x] Four separate quality panels (Definitions/Captions/Licenses/Dimensions; input and URL names `definition`/`caption`/`license`/`dimension`), each default Any; non-Any picks map to `videoDefinition`/`videoCaption`/`videoLicense`/`videoDimension`; Any sends nothing.
- [x] URL round-trip: `?type=episode&event=live&definition=high&caption=none&license=creativeCommon&dimension=3d` restores exactly; unset groups return to defaults after back/forward (no stale carry-over); legacy URLs (`?type=show`, rev-2 `?def=high&cap=none&lic=creativeCommon&dim=3d`, pre-T-0012 `?live=1`, `?hd=1`, `?sd=1`, `?cc=1`, `?nocap=1`, `?commons=1`, `?stdLic=1`, `?upcoming=1`, `?completed=1`, `?dim=3d`) still restore the equivalent new control.
- [x] Reset clears the opt-in + all quality radios back to Any (plus existing filters); no removed control id is referenced by the script.
- [x] The six superseded Advanced → More rows are gone; remaining Advanced rows behave as before.
- [x] Layout stays neat at 1500px and 360px; zero inline `style=` attributes.
- [x] Exclude words field sits in the search form between the keyword and the Search button (placeholder `exclude words`, hidden label, Enter submits); still sent as `-word` query tokens with URL key `ex`, reload restores it, Reset clears it; no `f-ex`/`qh-ex` markup remains in Advanced.
- [x] Advanced spans the full filter-grid width at every viewport (verified at 1500px, 900px and 360px — not only ≥1200px); the search bar is one row at desktop widths with equal inputs and a right-aligned Search button, and stacked full-width fields with a right-aligned button at 360px; the Search button still hides while Filters are open.
- [x] Clear ✕ (rev 7): every text input (index exclude/channel scope/playlist scope/topic/location/radius, tools resolver, settings region/lang) shows a ✕ inside its right edge when it has a value; clicking it empties the field, keeps focus and hides the ✕; inputs stay `type="text"` (no search-type switch); the keyword field keeps its native search ✕.
- [x] Clear ✕ sizing (rev 7): Advanced wrappers keep the 300px cap (dropped ≤720px), settings keeps 6em, tools/search rows still fill their flex row and stack at narrow widths; programmatic clears (Reset, URL restore) keep ✕ visibility in sync; zero inline `style=` attributes still hold.
- [x] Advanced → More flexible rows (rev 8): at ≤720px the three checkboxes and the Channel type select sit inline on the label's line (label → control → ?), while Category and the Topic/Location/Radius text fields wrap to a full-width row below their label; help info spans the row; >720px keeps the desktop grid unchanged; no horizontal overflow at 360/700/900px.

## Verification

Automated verification (run by agent):

```text
node static checks — ALL PASS (rev 6 + rev 7 + rev 8):
  [rev 6]
  inline <script> blocks (2) compile via vm.Script (no syntax errors)
  every $("#id") / setRadio(name) / input[name] reference resolves to markup
  removed ids absent (incl. qh-after/qh-before/qh-ex); Features + Video quality legends gone; old Type value show gone
  Type option Episode (Show) uses value episode; JS maps episode -> type=video&videoType=episode
  legacy type=show URL mapping present in readStateFromURL
  quality radio input names + URL keys are full words (definition/caption/license/dimension)
  abbreviated rev-2 keys still read as legacy; no abbreviated checkedRadio/setRadio usage
  broadcast opt-in id f-event; label defaults to Disabled and flips Enabled/Disabled in syncEventUI
  filtergrid contains 10 top-level fieldsets before Advanced, incl. Dates before Definitions
  Dates panel: labels linked to inputs, After/Before inside it, ? badge in the legend, toggle immediately before the bottom info,
  short combined info (range + after:/before: token), After/Before rows gone from Advanced, .daterow two-column grid + full-width inputs
  exclude words: input lives in the search form between keyword and Search (placeholder "exclude words", hidden label), old Advanced row gone (no f-ex/qh-ex)
  search form: .search-panel .search-form flex-wrap + wrapper-aware flex 1 1 240px fields + right-aligned submit; <=480px fields flex-basis 100%
  Advanced: .filtergrid > fieldset.fs-full { grid-column: 1 / -1 } sits outside the 1200px media query
  no .qualgrid/.qgroup markup or CSS remain
  [rev 7]
  input-clear.js parses via vm.Script; targets input[type="text"] and never sets type=search
  all 6 index + 2 settings + 1 tools text inputs still type="text" (f-ex, f-scope, f-plscope, f-topic, f-loc, f-locRad, region, lang, tools input)
  every page loads <script src="/input-clear.js">; index calls window.syncInputClear() from readStateFromURL + resetFilters; settings reset syncs too
  CSS: .inputclear position relative, .clrbtn cursor pointer, .clrbtn[hidden] display none, Advanced wrapper 300px cap (+ max-width none <=720px), resolve-row 280px, settings 6em
  still zero inline style= attributes
  [rev 8]
  CSS <=720px: .moredetails .advrow flex + wrap; .advcontrol flex 0 1 auto; text-input + Category controls flex 1 1 100%;
  qinfo/hint flex 1 1 100%; .inputclear fills the row; desktop .advrow keeps grid-template-columns 200px 1fr 28px
  wrangler dev smoke (port 18795) — 200, page serves with the new panels
Playwright (Chromium, real browser against wrangler; /api/search mocked — no quota spent):
  [rev 6 functional]
  initial: Dates panel immediately before Definitions; After/Before inside the panel; ? badge in the legend; info hidden
  ? toggles the short info line at the bottom (display none -> block -> none); Dates rows stay in the aligned two-column grid (full-width inputs, no content overflow) at 1500px / 900px / 360px
  date range 2024-01-01..2024-06-01 -> call publishedAfter=2024-01-01T00:00:00Z + publishedBefore=2024-06-01T00:00:00Z; URL ?q=dated&after=2024-01-01&before=2024-06-01; reload restores both inputs + same params
  exclude: form order ytas-q,f-ex,submit; Enter in the exclude field with "spoiler,clickbait" -> call q="excl -spoiler -clickbait", URL ex=spoiler,clickbait, status "1 result. (exclusions)"; reload restores the field; Reset clears it
  Reset -> dates cleared, opt-in off (label Disabled) + all four quality panels back to Any
  regression: Episode (Show) + broadcast on + HD -> type=video&videoType=episode&eventType=live&videoDefinition=high; URL type=episode&event=live&definition=high
  plain search sends no new params; legacy pre-T-0012 quality/event keys still map
  submit button hides while Filters are open (hidden + display:none) and shows again when closed — desktop and 360px
  layout 1500px / 900px: search bar one row with equal inputs + right-aligned button; Advanced width == filtergrid width (1438px / 838px)
  layout 360px: search + exclude stacked full-width, button right-aligned (right edge == form right); Advanced width == filtergrid width (306px)
  no horizontal/content overflow at any width; 0 console errors / warnings
  [rev 7 functional]
  6/6 index text inputs wrapped (f-ex, f-scope, f-plscope, f-topic, f-loc, f-locRad), all type=text
  ✕ hidden when empty (hidden + display:none) -> shown while typing (display:flex) -> click clears value, refocuses input, hides ✕
  Reset re-sync: f-ex + f-scope filled -> Reset -> both values "" and ✕ hidden
  URL restore: ?q=test&ex=spoiler -> f-ex "spoiler" with visible ✕
  sizing: #f-scope wrapper 300px (Advanced cap); #region wrapper 90px (6em); tools resolver wrapper 962px (flex fill)
  tools page: resolver input wrapped, typed value cleared by ✕; settings page: region cleared by ✕; settings Reset -> region "" + ✕ hidden
  search form order label,ytas-q,label,wrap:f-ex,button — one row desktop (q width == exclude width 605/675/565px), stacked full-width at 360px with right-aligned button
  0 console errors; 3 mocked search calls
  [rev 8 layout, 360px/700px/900px/1500px]
  More rows are flex at 360/700px (<=720px), grid at 900/1500px (>720px -> desktop layout restored)
  checkboxes (Embeddable only / Playable outside YouTube / Paid promotion): control shares the label line, ? adjacent (e.g. label right 155 -> checkbox left 167, ? 189..211)
  Channel type: label 40..127, select 135..215, ? 221..243 on one line (centers aligned)
  Category: label row 1, select row 2 full width (252 of 280 row px + ? 22 + gap 6)
  Topic id / Location / Radius: label row 1, input wrapper row 2 full width (252 of 280)
  help info (qh-loc): display block, width 280 == row width; qh-emb help opens inline full width; checkbox toggles
  clear ✕ still shows inside the More text fields and clears the value (f-topic /m/04rlf -> "")
  no horizontal overflow at 360/700/900px; no label/control overlap at 700/900px
  0 console errors / pageerrors
  note: the two browser scripts ran before a one-line `cursor: pointer` addition to `.clrbtn` (non-layout property; asserted by the rev 7 static check)
```

HDT decision reason:

REQUIRED — per `dev/verification.md`, filter UI changes need browser/human evidence (visible enable/disable state, result semantics, URL round-trip) beyond syntax and static checks.

HDT steps and user report:

```text
1. Start: `npx wrangler dev` and open the local URL it prints (e.g. http://127.0.0.1:8787/).
2. Search bar: desktop shows [search] [exclude words] [Search] in one row; at phone width the two fields stack and the
   Search button sits right-aligned below them. While Filters are open the Search button is hidden; close Filters and it returns.
3. Open Filters. Expect: Type ends with "Episode (Show)"; no Features panel; Broadcasts shows Live/Upcoming/Completed
   greyed out and the checkbox label says "Disabled"; a Dates panel sits just before Definitions (After + Before),
   and Definitions, Captions, Licenses and Dimensions are four separate panels with Any selected. The Advanced panel
   spans the full width of the grid at every window size (try a half-screen window).
4. Pick Episode (Show) and search -> results are episodes; the URL shows type=episode. An old link with type=show
   also opens with Episode selected.
5. Tick the broadcast checkbox (label changes to "Enabled"; Live preselected). Try Upcoming on a channel that premieres
   often -> results are upcoming streams. Untick (label back to "Disabled") -> radios grey out; a new search has no
   broadcast filter.
6. Click the "?" next to DATES -> a short combined info line appears at the bottom of the Dates panel; click again to hide.
7. Set After = 2024-01-01 and Before = 2024-06-01, search -> results stay inside that range; the URL shows
   after=2024-01-01&before=2024-06-01. Reload / paste the URL -> both dates restore.
8. Type spoiler in the exclude words field and search -> results drop videos with that word; the URL shows ex=spoiler.
   Reload -> the field restores. Reset -> it clears.
9. Any text field (exclude words, channel scope, playlist scope, topic id, location, radius — and the fields on /tools
and /settings) shows a small ✕ inside its right edge once it has text. Click it -> the field empties, the cursor stays
in the field, and the ✕ disappears. The fields stay ordinary text fields (keyword keeps its own search ✕).
10. Pick High definition (HD) + No captions and search -> results respect it; URL shows definition=high&caption=none.
11. Back / Forward and pasting the URL in a new tab restore the same filter state.
12. Advanced → More on a phone-sized window (or narrow the browser): the three checkboxes and Channel type sit on the
    same line as their label; Category and the Topic/Location/Radius fields take the full width on the line below
    their label; tapping a "?" shows the help text across the row. On a wide window the section keeps its previous
    two-column (label right / control left) layout.
13. Reset -> checkbox unchecked (label "Disabled"), dates cleared, exclude words cleared, all four quality panels Any.
Report: pass, or the panel/step that differed.
```

HDT status: PASS (2026-10-19 — user report: "all pass"). Covers the full step list incl. rev 6 (exclude words in the search bar, Advanced full width), rev 7 clear ✕ (input type stays `text`), rev 8 flexible Advanced → More rows, and the B-0001 RTL card check.

## Pending Decision

None. User confirmed (2026-10-19) removing the six superseded Advanced rows and starting implementation in the same session.

## Notes / Evidence

- YouTube search.list refs (task reference): `eventType` live|upcoming|completed; `videoDefinition` any|high|standard; `videoCaption` any|closedCaption|none; `videoLicense` any|creativeCommon|youtube; `videoDimension` any|2d|3d. <https://developers.google.com/youtube/data/reference/rest/v3/search/list>
- Legacy URL read mapping lives in `readStateFromURL`: pre-T-0012 keys map onto the replacement controls, and `type=show` maps onto `type=episode`; one control per param removes the need for precedence.
- Rev 2 (2026-10-19, user review): the single Video quality wrapper was split into four top-level panels, and the Type value `show` was renamed to `episode` (URL key changes; legacy `type=show` still read).
- Rev 3 (2026-10-19, user review): quality input/URL names use full words (`definition`/`caption`/`license`/`dimension`), the broadcast checkbox label became state-based (currently `Enabled` / `Disabled`), and the user's `f-event` id is preserved.
- Rev 4 (2026-10-19, user review): After/Before moved from Advanced into a new Dates panel placed before Definitions; the panel has one `?` badge next to its legend and a combined info line at the bottom. The user's broadcast label edit (`Disabled` / `Enabled`) is preserved.
- Rev 5 (2026-10-19, user review): Dates rows neatened — right-aligned labels + full-width inputs in a two-column grid, smaller legend help badge, and a shorter two-line info note.
- Rev 6 (2026-10-19, user review): Exclude words moved from Advanced into the search bar (keyword + exclude words + Search; stacked on phones) and the Advanced fieldset now spans the full filter grid at every viewport. The exclude `?` help badge was dropped with the row; the field keeps its `-word`/`ex` semantics and a `title` tooltip.
- Rev 7 (2026-10-19, user review): Every text input gets a clear ✕ like the search field's native cancel button, without changing the input type. New shared `public/input-clear.js` wraps each `input[type="text"]` in `.inputclear` + `.clrbtn` (hidden while empty; click clears, re-fires input/change, refocuses); per-context sizing in `styles.css`; script included on `/`, `/tools` and `/settings`; index + settings re-sync programmatic clears via `window.syncInputClear()`. The results-card meta bidi bug (RTL channel names reordering ` · time`) found in the same review is tracked as `B-0001` and fixed in the same working tree.
- Rev 8 (2026-10-19, user review with a before/after sketch): Advanced → More rows are flexible on narrow screens — a wrapping flex row where compact controls (checkboxes, short Channel type select) share the label's line while wide fields (text inputs, long Category select) fill a full-width line below the label; help info spans the row. Scoped to ≤720px so the desktop grid is untouched.
- Doc audit (2026-10-19, user request, refs: search.list / videos.list / videoCategories.list .md.txt): the whole param chain was re-checked against the official reference. All emitted param names, enum values, and the documented `type=video` constraints match (see the audit summary in `dev/now.md`); optional hardening ideas (language/geo/location-radius input checks, `hl` for categories, exclude-only queries) are parked as `PL-0001`–`PL-0004` in `dev/parking-lot.md`.
- Working tree carried pre-existing uncommitted user edits (filter reorder, category list, worker comments, tools/README/.gitignore, LICENSE, assets/) — preserved, not part of this task's commit scope.

## Affected Durable Artifacts

- `dev/roadmap.md`, `dev/milestones/M-0003-filter-topbar-settings.md`, `dev/now.md`
- Implementation affects: `public/index.html`, `public/styles.css`, `public/input-clear.js` (new), `public/tools.html`, `public/settings.html`, `README.md`, `ARCHITECTURE-MAP.md`, `dev/project.md`
- Related bug record: `dev/bug-fixes/B-0001-card-meta-rtl-bidi.md`

## Commit Checkpoint

Suggested commit message:

```text
feat: broadcast, dates and video-quality filter panels replace Features
```

Commit status: `COMMITTED` (see `dev/now.md` Last Checkpoint)

## Handoff

COMPLETE + HDT PASS (2026-10-19, user report "all pass"); record moved to `dev/tasks/done/`. Only the commit checkpoint remains (policy: ASK).
