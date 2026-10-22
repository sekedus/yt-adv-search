---
id: T-0010
type: feature
status: COMPLETE
milestone: M-0003
size: MEDIUM
created: "2026-10-15"
updated: "2026-10-15"
hdt_requirement: REQUIRED
hdt_status: PASS
cancellation_reason: null
---

# T-0010 — Quota-aware keys + result cache + playlist scope + keyboard/scroll UX

Frontmatter is the canonical source for task metadata. Do not add a second `Status` field in the body.

## Objective

Cut YouTube API quota burn and round out search UX: skip quota-exhausted keys until next 00:00 UTC, cache proxied API results in the Worker with a fresh-reload bypass, support `playlist:`-scoped keyword search with local filtering plus a playlist field in Advanced filters, add `/`-to-focus on the homepage search, and add top/bottom jump buttons.

## Size / Scope

MEDIUM — touches `worker.js` (rotation, cache, playlist path) + `public/index.html` + `public/styles.css` (refresh button, `/` shortcut, jump buttons). Bounded to the five requested items.

### In Scope

- Quota-exhausted key exclusion until next-day 00:00 UTC.
- Worker-side GET result cache for `/api/search` (and `/api/channel` where safe) + frontend fresh-reload button.
- `playlist:` operator (`playlist:PLAYLIST_ID + keyword`) via `playlistItems.list` workaround with local keyword filter + playlist scope field in Advanced filters.
- `/` focuses the search input when not already in an editable element.
- Floating top/bottom buttons bottom-right.

### Out of Scope

- New pages, new API providers, auth/sessions, key-management UI.
- Changing `ytas.*` storage keys or `.container`/filter/topbar class contracts.
- Full offline support.

## Acceptance Criteria

- [x] Quota: a key whose upstream response is `403` with `reason: quotaExceeded` / `domain: youtube.quota` (ref `https://developers.google.com/youtube/v3/docs/errors`) is excluded from rotation until next `00:00 UTC`; other non-200 errors still rotate without exclusion; exhausted keys are never leaked in responses/logs; all-keys-exhausted returns a clean error.
- [x] Cache: repeated identical `GET /api/search` (and channel where applied) hits upstream at most once within the cache TTL; a hot-reload/Refresh button on results bypasses cache (`fresh=1` / `no-cache`) and fetches upstream — the button is shown only when the last response was a cache HIT; cached responses carry a cache-status indicator usable by UI/debug. Max cache time is user-configurable in Settings (1min/5min/15min/1h, server-clamped 60s..1h, excluded from the shareable URL and cache key).
- [x] Playlist: `playlist:PLAYLIST_ID keyword` resolves via `playlistItems.list` (paginated, capped) and filters items locally by keyword; a Playlist scope field exists in Advanced filters, syncs to URL (`playlist`/`scope`), and shows a `(Playlist-scoped)` note like channel scope; invalid playlist ID yields a clean error.
- [x] `/` shortcut: on `/`, when focus is not in `input/textarea/select/contenteditable`, focus moves to `#ytas-q` and the keystroke is not typed; no hijack when already editing or in a dialog/menu.
- [x] Jump buttons: floating top/bottom buttons fixed bottom-right, scroll to page top/bottom (smooth where supported), keyboard-focusable with labels, hidden until useful (e.g. top button after scroll), zero inline styles, responsive at 360px and desktop.
- [x] Entity decoding: titles/channel names/descriptions containing upstream HTML entities (e.g. `Beginner&#39;s Guide` verbatim from `search.list`, confirmed live 2026-10-16) render decoded (`Beginner's Guide`); no double-escaping through `esc()`.
- [x] Categories: Category filter options load live from `GET /api/categories` (region-aware, `videoCategories.list`, slimmed to assignable `{id,title}`, server-cached 1 week + 7-day localStorage copy); hardcoded options remain as fallback.

## Verification

Automated verification (run by agent):

```text
node --check worker.js — PASS
inline <script> syntax (vm.Script, index/tools/settings) — PASS
style= grep in index.html — zero PASS
node functional tests (mocked upstream + memory caches.default) — 43/43 PASS:
  quota shape detection, midnight-UTC math, operator parsing, local filter,
  rotation + exclusion + no-retry, non-quota 403 still rotates,
  all-exhausted clean error without key leak, cache MISS/HIT/fresh, bodies equal,
  TTL clamp (60s floor, 1h ceiling, garbage fallback) + cacheTtl stripped from key,
  categories slim/assignable/HIT/1-week max-age/bad-region default,
  playlist fetch + local filter + search-shaped mapping + scope echo + paging
wrangler dev smoke (port 18787, real process) — PASS:
  / /tools /settings 200; /api/search (no q) 400 clean JSON + x-cache-status MISS;
  /api/channel (no params) 400 clean JSON + MISS;
  live /api/categories?regionCode=US 200 with 15 assignable categories (1 unit);
  one live search probe (100 units) proving upstream sends `&#39;` verbatim
  (live YouTube search otherwise not probed — search.list burns ~100 units/call)
wrangler caught + fixed: non-function worker exports rejected by workerd
  (CACHE_TTL_S/Map) — replaced with function-only hooks; re-smoked PASS
```

HDT decision reason:

REQUIRED — per `.aaw/verification.md` UI changes (search, filters, buttons) need human/runtime evidence, and quota/cache/playlist paths need real-behavior confirmation beyond `node --check`.

HDT status: PASS (user report 2026-10-16: pass — covers quota/cache/refresh UX, playlist scope + history round-trip, `/` shortcut, jump buttons, resultbar desktop/mobile layout, mobile list rows + full-height thumbs, Tools card, entity-decoded titles, custom cache TTL, live categories, back-nav to `/` without errors).

## Pending Decision

None.

## Notes / Evidence

- Quota example shape: `403` + `errors[].reason === "quotaExceeded"`, `domain === "youtube.quota"`.
- Current rotation (`worker.js:fetchYT`) retries every key on any non-200 with no memory and discards the upstream body — quota detection needs body parsing + per-key exclusion store (in-memory + KV when bound, expiry = next 00:00 UTC).
- Current search flow (`ARCHITECTURE-MAP.md` Search) has no cache layer; `playlist:` is not parsed by `parseQueryOperators`.
- Frontend contracts: `#ytas-q`, `scopeToParams`/`buildParams`/`syncURL`, `resultBar` status note pattern `(Channel-scoped)`; keep `ytas.*` keys; T-0009 zero-inline-style rule applies.
- Cache key must exclude the API key value; vary only on safe request params.
- Follow-up fixes (2026-10-15, still AWAITING_HDT): Refresh `hidden` until a HIT response (`runSearch` hides on start, shows only when `x-cache-status === HIT`); `readStateFromURL` now clears playlist scope when the param is absent (stale value resurrected playlist searches on back-nav and rewrote `/` to `/?playlist=…`); resultbar mobile layout — `.statusbar` full row 1 (text flexes, Refresh compact), `.view` wraps to left-aligned row 2 at ≤700px, desktop single row unchanged.
- Pre-existing same-shape staleness in `scope`/`after`/`before` URL restore (T-0005 pattern) left untouched — not reported, changing it would alter channel/date back-button behavior.
- Resultbar layout fix (2026-10-15): Refresh moved out of `.statusbar` to a direct `.resultbar` child; status no longer greedy (`flex: 0 1 auto`), View pushed right via `margin-left: auto`. Desktop: text + Refresh left, View right (one row). Mobile ≤700px: status row 1, Refresh left + View right sharing row 2.
- Mobile list-view fix (2026-10-16): List cards were stacking full-width like Grid on phones (giant thumbnails). At ≤640px List now stays a compact row (140px thumb, 96px channel avatar, description hidden, tighter actions); video/playlist thumbs stretch to the full row height via cover-crop. Grid stacking unchanged. Same compact row applied to the Tools `#result` card (banner-wide image, direct `height: 100%` since its img has no link wrapper).
- Entity-title diagnosis (2026-10-16): `Adobe&#39;s` arrives verbatim from upstream `search.list` (proven with one live 100-unit probe: `Beginner&#39;s Guide`). Our render path was already correct (`textContent`, `esc()` dead) — fix is a `decodeEntities` (textarea) helper applied to title/channel/desc in index + Tools title, never fed back through `esc()`.
- Custom cache TTL (2026-10-16): Settings "Max cache time" (60/300/900/3600s, `ytas.cacheTtl`, Save/Reset/dirty-wired); search/channel send `cacheTtl`, server clamps 60s..1h, stripped from cache key and shareable URL.
- Live categories (2026-10-16): `GET /api/categories` → `videoCategories.list` (region validated, default US), slimmed assignable-only `{id,title}`, server-cached 1 week; homepage populates `#f-cat` with 7-day localStorage copy + hardcoded fallback, preserving URL selection. Live smoke: 15 US categories, 200 + MISS then 200.
- Back-nav crash fix (2026-10-16): `resetFilters` still called `$(boxes[i])` with bare IDs after the tree-wide `$` refactor to `querySelector` (`null.checked` on history back to `/`); fixed to `"#" + boxes[i]`. Verified it was the only remaining bare-ID `$()` call site.

## Affected Durable Artifacts

- `.aaw/roadmap.md`, `.aaw/milestones/M-0003-filter-topbar-settings.md`, `.aaw/now.md`
- Implementation will affect: `worker.js`, `public/index.html`, `public/styles.css`, `ARCHITECTURE-MAP.md`

## Commit Checkpoint

Suggested commit message:

```text
feat: quota-aware key rotation, cached search with refresh, playlist scope, slash-focus and jump buttons
```

Commit status: `COMMITTED` (see `.aaw/now.md` Last Checkpoint)

## Handoff

Implementation in progress. Worker quota/cache/playlist paths first, then frontend refresh + scope + shortcut + buttons, then automated checks + HDT.
