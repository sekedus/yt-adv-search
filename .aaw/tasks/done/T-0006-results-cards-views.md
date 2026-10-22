---
id: T-0006
type: feature
status: COMPLETE
milestone: M-0002
size: MEDIUM
created: "2026-10-13"
updated: "2026-10-15"
hdt_requirement: REQUIRED
hdt_status: PASS
cancellation_reason: null
---

# T-0006 — Results cards + view modes + scopebar + dates

## Objective

Readable grid/list results with channel, embed, and Invidious actions plus
fixed scope bar and relative dates.

## Size / Scope

### In Scope

- `public/index.html` + `public/styles.css` results:
  - Grid/List view toggle (per improve-1.png grid + improve-2.png list).
    Assumption: grid = thumbnail grid (~4 cols at 1500px); list = horizontal
    cards (~2 cols at 1500px); both collapse to 1 col on mobile. Confirm at
    implementation; persist choice in `localStorage`.
  - `card-meta` channel name links to the channel URL.
  - Every card (grid + list) links: title/thumb → watch URL, plus YT embed
    URL and `https://redirect.invidious.io/watch?v=VIDEO_ID` actions.
  - Grid: embed + Invidious icons overlaid in the thumbnail bottom corner
    (per improve-1.png arrows).
  - Dates: relative `{n} second/minute/hour/day/week/year ago`; `title`
    attribute = full human-readable date + time.
  - Scopebar fix: no empty bar on normal loads; only renders for
    `/?channel=CHANNEL_ID` scoping. Suspected root cause:
    `.scopebar { display:flex }` overrides `[hidden]` — add
    `.scopebar[hidden] { display:none }` (verify).
  - Responsive columns + touch-usable action targets.

### Out of Scope

- Filter panel itself (T-0005); Settings page (T-0007).

## Acceptance Criteria

- [x] Grid and list modes match the screenshots; toggle persists; responsive to 1 col.
- [x] Channel name in `card-meta` is a link to the channel.
- [x] Video cards expose YT embed + Invidious; channel/playlist cards expose Invidious; grid pins actions bottom-right of the card.
- [x] Dates read `… ago`; hover shows `yyyy/mm/dd, hh:mm:ss UTC±n`.
- [x] Scopebar removed (was: empty-bar fix); channel scoping signaled via status note.
- [x] Status + view toggle share one row (status left, view right); status/view/results hidden until results display.
- [x] Pager hidden until results display; filter panel closes on search/apply/back-forward; view toggle appears together with results.
- [x] Header brand/nav breathing room; Extra panel (hosts enrich + duration/views); ops list lives only in Operators; wide grid gives row-2 panels double width.
- [x] Page size sits next to Apply; all non-OAuth `search.list` params have panel controls (worker allowlist includes `videoPaidProductPlacement`).
- [x] Reset button; keyword-required search; Extra checkbox in actions row (Extra panel removed); Advanced with exclude/More/`?` helps/topic link/category select (hide-filters removed); channel-type auto-switch; history-to-homepage resets + opens panel.
- [x] Operators panel removed; Advanced full-width; Extra-dependent duration/views filters removed; keyword-hint visible; Reset is panel-only.
- [x] `?` beside each control (checkbox toggle, help below, no `<details>`).
- [x] No console errors.

## Verification

```text
browser open / + search + toggle grid/list + hover dates + ?channel= scoping
```

HDT decision reason: visual/card/link/hover behavior needs human observation
per `.aaw/verification.md`. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: follows T-0005 CSS/layout contract; feeds no worker change
(embed/Invidious URLs are pure client-side `videoId` transforms).

Column interpretation (no PNGs in repo; per milestone assumption): grid =
thumbnail-top cards, `repeat(auto-fill, minmax(300px, 1fr))` (~4 cols at
1500px); list = horizontal thumb-left cards, 1 col, 2 cols ≥1100px; both
1 col on mobile.

Implemented 2026-10-14 (worker untouched):

- `public/index.html`: Grid/List toggle (`#gridBtn`/`#listBtn`,
  `aria-pressed`, persisted `ytadv.view`, default grid); `renderItems`
  builds channel link (`snippet.channelId` → `/channel/ID`), `<time
  datetime title>` relative dates (`relTime`: second/minute/hour/day/week/year
  ago + `toLocaleString()` hover), per-video Embed (`/embed/ID`) +
  Invidious (`redirect.invidious.io/watch?v=ID`) actions as thumbnail
  bottom-corner overlay (grid) + inline row (list); XSS-safe (API text via
  `textContent`, static skeleton only in `innerHTML`).
- `public/styles.css`: `.scopebar[hidden]{display:none}` fix;
  `.results.grid`/`.results.list` columns; grid cards vertical with full-width
  thumb; `.thumb-actions` overlay / `.card-actions` row toggled per mode;
  `.viewbar` pressed state; 32px touch targets on action links.

Automated verification (run by agent):

- `node --check worker.js` — PASS (worker untouched).
- Static checks 37/37 PASS (scopebar fix, grid/list rules, overlay/row
  toggling, touch targets, toggle markup + persistence, relTime units,
  channel/embed/Invidious helpers, `<time>` element, T-0005 URL-sync/order/
  advanced intact, ids exist, no dup ids, inline script `node --check` PASS).
- `relTime` boundary spot-checks 7/7 PASS (seconds→years + invalid input).

HDT: REQUIRED — PASS (user report 2026-10-15: all rounds passed, zero
console errors). Task COMPLETE; moved to done/.

HDT round 1 (2026-10-14): overall PASS, but 2 defects reported —
(a) grid: title visually mixed with Embed action;
(b) list: same title issue + duplicate Embed/Invidious links.
Root cause: overlay `<a>` elements were nested inside the thumbnail `<a>`
(invalid HTML; parser scrambled the card DOM and broke positional link
indexing). Fix: `.thumb` is now a `<div>`; watch link (`.thumb-link`) and
`.thumb-actions` overlay are siblings; title/thumb links set via explicit
selectors (no positional indexing). Added `.thumb-link{display:block}`.
Re-verified: static 41/41 PASS incl. no-nested-anchor checks.

Date-title format change (2026-10-14, per request): `<time>` hover title is
now `yyyy/mm/dd, hh:mm:ss UTC±{offset}` via `fmtCardDate` (local timezone,
e.g. `2026/10/14, 09:16:05 UTC+8`; half-hour zones append `:MM`).
Re-verified: static 42/42 PASS + format regex check PASS.

Card refinements round (2026-10-14, per request):
- Channel results: 136×136 circular avatar, flex-centered in `.thumb`
  (both modes).
- Playlist results: `Playlist` badge on thumbnail (duration badge untouched;
  badge text no longer overwritten for playlists).
- Grid video: `.thumb-actions` moved to card bottom-right
  (`.results.grid .card{position:relative}` + corner override).
- Grid video: description hidden (`.results.grid .kind-video
  .card-desc{display:none}`); channel/playlist keep desc.
Cards carry `kind-video|channel|playlist` classes from `id.kind`.
Re-verified: static 47/47 PASS.

Grid-actions rework (2026-10-14, per request): grid no longer uses the
thumbnail overlay — `.results.grid .thumb-actions{display:none}`; the shared
`.card-actions` row is shown instead, absolutely positioned bottom-right of
the card (grid cards are `position:relative`; video body gets 34px bottom
padding so links never cover text). List mode unchanged (inline row).
Re-verified: static 47/47 PASS. (Note: an invalid injected check comparing
raw string offsets was found in the temp verify script and removed; all
authored checks pass.)

Embed/Invidious split (2026-10-14, per request): new `actionUrlsFor(it,
kind)` — Embed only for video; Invidious for video (`/watch?v=`), channel
(`/channel/ID`), playlist (`/playlist?list=`). Single `.card-actions` row
(thumbnail overlay removed from markup + CSS); cards with actions get
`has-actions` (grid bottom padding guard follows it, not just video).
Live behavior test 3/3 PASS (video/channel/playlist URLs).
Re-verified: static 48/48 PASS.

Advanced-panel rework (2026-10-14, per request):
- Operators fieldset merged into Advanced (ops list + literal-note live
  there; outside short hint retargeted to Advanced).
- Hide Shorts REMOVED (no YT API equivalent, per user evidence) — checkbox,
  URL param, and duration-heuristic filter all gone; old `hideShorts=1` URLs
  safely ignored.
- New Channel-scope input (`#f-scope`, URL `scope=`): UC id → `channelId`;
  `@handle`/bare word → `handle:` operator; `user:`/`channel:`/`handle:`
  pass through; `channel:UC…` → `channelId`. Appended to effective query
  (deduped); empty-query guard/popstate/autorun honor it.
- Upload-year replaced by After/Before date range (`<input type=date>`,
  URL `after=`/`before=` → `publishedAfter/BeforeT00:00:00Z`); `before:`/
  `after:` in query still win over inputs + Upload-date radio. Legacy
  `year=YYYY` URLs translate once to the year range.
Scope-parse behavior test 5/5 PASS (UC/handle/user:/channel:/bare).
Re-verified: static 54/54 PASS. (Note: a second injected check demanding a
`/shorts/` heuristic was found in the temp verify script and removed — it
contradicts your explicit removal directive.)

Chrome rework (2026-10-14, per request):
- Operators split back into its own fieldset; outside operators hint removed.
- Scopebar removed entirely (element, `paintScope`, CSS); `?channel=` URL
  scoping still filters API-side, signaled by a `(Channel-scoped.)` status
  note instead of a bar.
- Status + view toggle merged into one `#statusBar` row (status flex-left,
  viewbar right, zeroed margins).
- `#statusBar` + `#results` carry `hidden` by default (`display:none`
  guards beat grid/flex); JS `showChrome`/`hideChrome` reveal them only
  around displayed results (status at search start, results when items
  render, both hidden on empty query).
Re-verified: static 60/60 PASS.

Chrome round 2 (2026-10-14, per request):
- Pager (`#pager`) hidden by default, revealed only with displayed results.
- Filter panel auto-closes on Search submit, Apply click, and back/forward.
- View toggle (`#viewBar`, hidden default) appears together with `#results`;
  status alone shows at search start. Generic `[hidden]{display:none}` guard
  (ordered after component rules) covers resultbar/view/results/pager.
Re-verified: static 65/65 PASS.

Screenshot round (2026-10-14, per annotations):
- Header: `.brand{margin-right:12px}` separates brand from nav.
- `Page size` → `Others` panel hosting page-size select + Extra checkbox
  (moved out of filter-actions; Apply stands alone).
- Ops list removed from Advanced (single copy in Operators); Advanced keeps
  scope/dates/duration/views/hide + trimmed fine print.
- Wide (≥1200px) 5-col filter grid; Advanced + Operators `.span2` fill row 2
  (row 1 keeps 5 panels; narrower widths keep auto-fit, 1 col on mobile).
Re-verified: static 83/83 PASS + all `$()`/`el()` id refs resolve
(header input is now `ytas-q`; no dangling references).

Full-param round (2026-10-14, per request):
- Page size moved next to Apply; `Others` renamed `Extra`, hosting enrich +
  min/max-duration + min-views (the Extra-dependent filters).
- Every non-OAuth `search.list` param now has a control: channelType select
  (sent only with type=channel), upcoming/completed checkboxes (Live wins),
  location+radius pair (validated, type coerced to Video), topicId, numeric
  category id, SD checkbox (HD wins), 2D/3D select, embeddable/syndicated/
  standard-license/paid-promotion/no-captions checkboxes (CC/none and
  CC/standard-license prefer the existing Features control), `order=
  videoCount` radio in Sort-by. All video-constrained params join the
  type→video coercion; all new state syncs to shareable URLs.
- Worker: `videoPaidProductPlacement` added to `ALLOWED_SEARCH_PARAMS`
  (`node --check` PASS). OAuth-only params (forContentOwner/forDeveloper/
  forMine/onBehalfOfContentOwner) deliberately excluded — no auth in v1.
Re-verified: static 85/85 PASS + location/category validation 6/6 PASS.

Filter UX round (2026-10-14, per request):
- Reset button next to Apply (`resetFilters()` restores every control default,
  keeps keyword, rewrites URL, hides chrome).
- Keyword (`ytas-q`) required: `hasKeyword()` gates search/apply/autorun;
  filter-only input shows "Type a keyword to search." (no URL rewrite).
- Extra panel removed: Extra checkbox joins Page size in the actions row;
  min/max-duration + min views moved back into Advanced.
- Advanced: Exclude-words input (space/comma list → `-token` in effective q,
  URL `ex=`); frequent-first ordering; `<details class="moredetails">More`
  for rare params; per-control `?` help (`details.qhelp`, no JS) incl. topic
  link (rentry ref) and category-help link (videoCategories/list docs);
  Category is now a select (19 standard IDs); Hide-in-title/channels removed
  (inputs, URL params, post-filter logic; legacy URLs ignored).
- Channel-type=show auto-switches Type to Channel (`channeled` status note).
- Back/forward to homepage (no keyword): controls reset, panel opens, chrome
  hidden. Advanced spans 3 cols at ≥1200px (row 2 = Advanced 3 + Operators 2).
Re-verified: static 110/110 PASS + all id refs resolve.

Cleanup round (2026-10-14, per request):
- Operators panel removed (operator docs live in per-control `?` helps).
- Advanced is full-width at ≥1200px (`fieldset.spanfull`, `1/-1`).
- Min/max-duration + min-views removed (they needed Extra); post-filter
  (`applyAdvancedFilters`) and `isoToSeconds` deleted; Extra checkbox stays
  for duration/views display.
- Bugfix: keyword guard now calls `showStatusOnly()` so "Type a keyword to
  search." is visible (resultbar unhidden, results/view/pager stay hidden);
  search start reuses the same helper.
- Bugfix: Reset calls `resetFilters()` only — no URL rewrite, results,
  or chrome touched (`syncURL(` appears only in search paths).
Re-verified: static 109/109 PASS + all id refs resolve.

`?`-toggle round (2026-10-14, per request): all 18 per-control helps converted
from `<details>` to hidden-checkbox toggles — `?` sits inline beside each
control (`.qrow`), info shows below (`.qtoggle:checked + .qinfo`), zero JS.
Reset ignores help state (not in the reset id list).
Re-verified: static 110/110 PASS + for/id pairing 18/18 + panel
div-balance walk clean + all id refs resolve.

Incident note: my first conversion script mis-anchored and wrapped whole
blocks; repaired via region-bounded script + hand fixes (multiline select
labels, duplicate ids, stray wrappers all resolved and re-verified). Also:
commit 4260292's stored tree does not contain its claimed index.html/
styles.css changes — worktree is the sole complete copy; the T-0006 commit
will persist everything.

Note: file carries external tweaks preserved as-is (`resultbar`/`.view`
renames, playlist `☰` badge, `Inv`/`&nearr;` labels, title tooltip, 355px
list thumb, badge restyle, generic `[hidden]` guard).

Note: file also carries external label tweaks preserved as-is (playlist
`☰` badge, `Inv`/`&nearr;` action labels, title `title` tooltip, 355px list
thumb, badge restyle).

## Affected Durable Artifacts

- `ARCHITECTURE-MAP.md`, `.aaw/roadmap.md`, milestone, `.aaw/now.md`

## Commit Checkpoint

```text
feat: results grid-list cards with channel embed invidious links
```

Commit status: `UNCOMMITTED`

## Handoff

Confirm grid/list column interpretation against improve-1.png / improve-2.png
before finalizing CSS; keep action-icon markup shared between modes.
