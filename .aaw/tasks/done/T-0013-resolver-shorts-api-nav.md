---
id: T-0013
type: feature
status: COMPLETE
milestone: M-0003
size: MEDIUM
created: "2026-10-20"
updated: "2026-10-22"
hdt_requirement: REQUIRED
hdt_status: PASS
cancellation_reason: null
---

# T-0013 — Resolver links/multi-check, scoped shorts, API origin gate, nav close, cache + q parsing

## Objective

The original follow-ups plus a bounded cache/UX/search follow-up on the open M-0003 milestone:

1. Channel resolver (`/tools`): make the channel image and title link to the channel on YouTube, and add an Invidious button next to **Use in search**.
2. Search: detect Shorts for channel- and playlist-scoped results with a HEAD check against `https://www.youtube.com/shorts/<videoId>` first (`200` = Short, redirect to `/watch` = regular video), fall back to the channel `UUSH…` Shorts-playlist API probe when HEAD is inconclusive, cache each result for one day, and mark detected videos with a **Shorts** badge.
3. Worker API: only answer `/api/*` requests that come from this Worker's own origin (plus localhost for development), so other sites cannot use the proxy/quota.
4. Mobile `primaryNav`: open the menu with a transparent full-screen backdrop and close it when the user clicks outside the nav.
5. Cache/UX follow-up: detected Shorts cards link to `/shorts/<id>`; remove the browser localStorage category list; force fresh region-aware categories when the Region setting differs from the last loaded category region; cache channel lookups 7 days and categories 1 month; add a Tools Refresh button next to the lookup status; the status shows the found channel title and appends `(cached)` for a cache HIT; add a 30-minute Max cache time option and make it the default.
6. Search `q` parsing: support a literal space or `%20` as a space (including a whitespace-only query), but keep a literal `+` as a plus; encode app-generated page/API `q` values with `%20`/`%2B` instead of form-style `+`.
7. Channel resolver multi-check: a bare name checks `/@handle`, `/user/name`, and `/c/name`, deduplicates by canonical channel ID, and shows every distinct channel; explicit `/user/...`, `/c/...`, `/@handle`, and `/channel/<id>` URLs stay single-form. `/c/` resolves through the fixed YouTube channel page because the Data API has no custom-URL lookup.

## Size / Scope

MEDIUM — touches `public/tools.html`, `public/index.html`, `public/settings.html`, `public/styles.css` only if a shared control needs adjustment, and `worker.js`. Bounded to the seven items; no redesign.

### In Scope

- `/tools` result card: channel image + title open `https://youtube.com/channel/<id>` in a new tab; a secondary Invidious button (`https://redirect.invidious.io/channel/<id>`) sits next to **Use in search**.
- Worker shorts detection only when the search is channel-scoped (`channelId`, `channel:`, `handle:`, `user:`) or playlist-scoped (`playlist:` / Playlist scope).
  - Stage 1: `HEAD https://www.youtube.com/shorts/<videoId>` (fixed host, no cookies/key). `200` → Short; `3xx` with `Location` matching `/watch` → regular video. Other statuses/redirects → stage 2.
  - Stage 2: `playlistItems.list` with `playlistId = UUSH + channelId.slice(2)` and `videoId`; non-empty response → Short. Missing/404 Shorts playlist → this channel's videos are not Shorts.
  - Both positive and negative results are cached in `caches.default` for **1 day** (`/__shorts/<videoId>` keys).
  - The first unresolved video is a HEAD canary; if it fails, the rest of the response uses API probes instead of wasting 40 HEAD calls. Probe/cache failures never fail the search.
- Detection caps: at most 40 videos considered per response. When HEAD works, at most 6 API fallbacks run; if HEAD is unavailable, up to 40 API probes run. More videos/fallbacks → `shortsDetectionLimited`. This keeps search + probes inside the free-plan subrequest budget.
- Frontend: a `Shorts` badge on detected video thumbnails; playlist/duration badges stay intact; non-scoped searches unchanged.
- Detected Shorts card links: thumbnail and title use `https://youtube.com/shorts/<id>`; ordinary videos keep `https://youtube.com/watch?v=<id>`.
- Channel lookup cache/status: `/api/channel` fixed at 7 days (`max-age=604800`). A successful Tools lookup fills the status with `Found: <title>` (green `.ok` style) and appends ` (cached)` when the response header says `HIT`. The **Refresh** button sits next to the status in the `.resultbar` (not in the card actions), sends `fresh=1`, and the Worker bypasses the read and rewrites the cache entry so later lookups see the refreshed data.
- Channel lookup multi-check: bare names/URLs with no explicit form check `channels.list?forHandle`, `channels.list?forUsername`, and the `/c/<name>` page. Results are deduplicated by canonical ID, each item carries `matchedBy` (`handle`/`username`/`custom`/`id`), and the Tools UI renders one card per distinct channel with `Matched by @name + /user/name + /c/name`. One result keeps `Found: <title>`; multiple results show `Found <n> channels`. Explicit `/@handle`, `/user/name`, `/c/name`, and `/channel/<id>` URLs, plus the explicit kind selector, resolve only that form. `/c/` uses a fixed `https://www.youtube.com/c/<encoded>` GET (no cookies/API key, ≤3 same-host redirects, canonical/externalId extraction); failure is a normal not-found.
- Resolver cache key: URL-form requests are versioned (`v=2`) in `caches.default` so a pre-multi single-result entry cannot hide the new behavior for 7 days; a multi response is cached as one payload, and Refresh rewrites it.
- Categories cache: `/api/categories` fixed at 1 month (`max-age=2592000`), keyed per `regionCode`. The browser `ytas.catList` localStorage list is removed. sessionStorage stores only the last successfully loaded region; when the settings region differs, the next request adds `fresh=1` plus `cache:no-store`, bypasses the server read, rewrites the new region's entry, then updates the marker. Search cache TTL remains client-controlled 60–3600 s, now with a 30-minute default (1800 s) and a matching Settings option; the Worker default also becomes 1800 s.
- Query parsing: `/api/search` and the page URL read `q` from the raw query string. `%20` and a literal space are spaces; a literal `+` stays a plus (`%2B` also means plus). A whitespace-only q is forwarded as a real search; a truly empty q without channel/playlist scope is still rejected. The app preserves a whitespace-only input as a keyword, encodes q with `%20`/`%2B` in both the page URL and `/api/search`, and leaves the other parameters to `URLSearchParams`.
- `/api/*` origin gate: allow same-origin (`Origin`/`Referer` matches the request origin), localhost/127.0.0.1 for development, and requests with no browser origin headers (`curl`, scripts). Reject other origins with `403` JSON. Static pages are not gated. No CORS/`Access-Control-Allow-Origin` widening.
- Mobile nav: a transparent `.nav-backdrop` element covers the viewport while `#primaryNav.open`; clicking it closes the nav. The hamburger stays clickable and keeps `aria-expanded` in sync. Closing also happens above 700px. Keep the existing nav card styling.
- State/docs: milestone, roadmap, `now.md`, architecture map, README update where material.

### Out of Scope

- Hiding/filtering shorts (this task detects and labels only; a Hide Shorts toggle can be a follow-up).
- Authentication, per-user tokens, or a hard security boundary. Origin checks are abuse deterrence, not authentication; direct `curl`/scripts without origin headers still pass.
- Any new upstream host or endpoint beyond the fixed `www.youtube.com/shorts/<id>` HEAD probe, the fixed `www.youtube.com/c/<name>` resolver GET, and the existing `www.googleapis.com` endpoints.
- Redesigning the resolver card or the nav dropdown.
- Changing the search-result cache range beyond adding the 30-minute option/default (still 60–3600 s) or localizing category titles with `hl` (remains PL-0003).
- Reintroducing a browser-side category list cache.

## Decisions (assumptions)

The clarification prompt was interrupted; proceeding with the recommended defaults, recorded here so they can be corrected without rework:

- Shorts behavior: **badge only** (matches "detect shorts"; no results are removed).
- Shorts check order: **HEAD first**, API only when HEAD is inconclusive/unavailable, **1-day cache** of both positive and negative results.
- API restriction: **own origin + localhost**, headerless CLI/script requests allowed. No new env var required.
- Nav: **transparent full-screen backdrop** behind the existing nav card; outside click closes.
- Shorts links: detected Shorts use `/shorts/<id>`; non-detected videos and non-scoped results keep `/watch?v=` because only scoped searches carry `it.shorts`.
- Channel cache/status: fixed **7 days**; Refresh is a real cache refresh (bypass + rewrite), not just a one-off bypass. Status is only filled on a successful lookup; `(cached)` is shown only for a cache HIT. Refresh lives next to the status, not in the card actions.
- Categories cache: fixed **1 month**; browser localStorage list removed. Only the last loaded region is kept in sessionStorage; a region mismatch forces `fresh=1` for the new region. The hardcoded options remain only as a failure fallback.
- Search cache: range stays **60–3600 s**; the new **30-minute** option is the default in Settings, the index fallback, and the Worker when no `cacheTtl` is supplied. Existing saved values are preserved.
- Search q: only the `q` parameter gets literal-plus parsing; a raw `+` means plus, while `%20`/literal space means space. A whitespace-only q is valid and is forwarded; an empty q without scope remains an error. App-generated q uses `%20`/`%2B` in the page URL and API request so normal multi-word searches keep working.
- Resolver multi-check: bare names are **ambiguous** and check all three forms; explicit URL forms and explicit kind selectors are **exact**. This matches the examples: bare `android`/`tensorflow` show two channels, bare `chrome`/`firebase` show one; `/@chrome` stays not found while `/c/chrome` resolves Google Chrome.
- Custom `/c/` lookup: the Data API has no custom-URL parameter, so use a fixed-host YouTube page GET and read the canonical channel ID. Do not send cookies or API keys; only same-host redirects; cap the parsed document; do not add an open proxy.
- Multi status/UI: one channel keeps `Found: <title>`; multiple show `Found <n> channels`; each card shows its `Matched by` forms; cache is one combined 7-day payload.

## Acceptance Criteria

- [x] /tools: clicking the channel image or title opens `https://youtube.com/channel/<id>` in a new tab; **Invidious ↗** sits next to **Use in search**; Invidious opens `https://redirect.invidious.io/channel/<id>`; the card layout still works at 360px.
- [x] `/tools` status: a successful lookup fills `Found: <title>` with the green `.ok` style; a second normal lookup adds ` (cached)`; **Refresh ↻** is in the status row (not inside `.resolve-actions`), sends `fresh=1`, updates the card, and a later normal lookup shows `(cached)` with the refreshed data.
- [x] Channel- and playlist-scoped results mark detected Shorts with a **Shorts** badge; non-scoped searches and non-video results are unchanged; a failed/missing HEAD or Shorts playlist does not fail the search.
- [x] Detected Shorts card image/title link to `https://youtube.com/shorts/<id>`; ordinary videos still link to `https://youtube.com/watch?v=<id>`.
- [x] HEAD `200` is treated as Short, `3xx → /watch` as regular video, and an inconclusive HEAD falls back to the UUSH API probe. Results are cached for 1 day; a repeat search for the same videos makes no HEAD/API checks.
- [x] Detection considers at most 40 videos per response; HEAD is capped at 40, API fallback at 6 when HEAD works (40 if HEAD is unavailable); skipped coverage sets `shortsDetectionLimited`.
- [x] `/api/channel` stores `max-age=604800`; a second lookup is a HIT; `fresh=1` bypasses the read, rewrites the entry, and the next normal lookup returns the refreshed data.
- [x] Bare-name multi-check: `android` → 2 distinct channels (Android official via handle/custom, legacy `android` via username); `tensorflow` → 2; `chrome` → 1 (Google Chrome via `/c/chrome`); `firebase` → 1 (handle + username + custom deduplicated). Each item has the expected `matchedBy` forms, and the response has `lookup.mode: "multi"` plus `pageInfo.totalResults`.
- [x] Explicit forms stay exact: `/c/chrome` → Google Chrome; `/c/android` → Android; `/user/chrome` → 404; `/user/android` → the legacy channel; `@chrome` → 404; `@GoogleChrome` → Google Chrome; `/channel/<id>` → that ID. `/c/` uses the fixed `www.youtube.com/c/<encoded>` page (no cookies/API key, only same-host redirects) and returns 404 when no canonical ID is present.
- [x] Tools renders all distinct channels from a bare name (2 cards for android/tensorflow), shows `Found 2 channels`, and displays `Matched by @... + /user/... + /c/...` per card; one result keeps `Found: <title>`; Refresh re-runs the multi check and `(cached)` appears on a HIT.
- [x] URL-form channel cache keys are versioned so an old single-result cache entry cannot serve after the multi-check change; a multi response is cached as one 7-day payload.
- [x] `/api/categories` stores `max-age=2592000` per region; a second lookup is a HIT; changing the region setting makes the next categories request use `fresh=1` and the new region, and no `ytas.catList` localStorage list remains.
- [x] Search cache TTL remains client-controlled 60–3600 s, defaults to 30 minutes (1800 s), and `fresh=1` remains read-only for search.
- [x] `/api/search?q=%20` (or a literal space) runs a whitespace search; `q=hello%20world` is two words; `q=hello+world` keeps the plus literal; an empty q without channel/playlist scope is still `400`.
- [x] The search input accepts a whitespace-only query, keeps it in the page URL as `q=%20`, and sends `q=%20` (not `+`) to `/api/search`; a literal plus is sent as `%2B`.
- [x] The page URL uses the same rule: `/?q=hello+world` keeps the plus literal and rewrites it to `q=hello%2Bworld`; `/?q=hello%20world` is two words.
- [x] Settings → Max cache time offers **30 minutes**, selects it on a fresh/Reset profile, and a search without a saved preference sends `cacheTtl=1800`.
- [x] `/api/*` returns `403` for a cross-site `Origin`/`Referer` and for `Sec-Fetch-Site: cross-site` without a matching origin; same-origin, localhost, and headerless requests pass; `/`, `/tools`, `/settings` stay accessible.
- [x] Mobile nav: opening shows the transparent backdrop; clicking outside closes the nav; `aria-expanded` follows; resizing to >700px closes it; desktop nav is unchanged.
- [x] Clear × controls: clicking one clears the input, returns focus to that input, remains announced as **Clear** while visible, and produces no `aria-hidden` focus warning in the console.
- [x] No console errors; no layout overflow at 360/700/1500px.

## Verification

Commands / checks and expected results:

```text
node --check worker.js
node <t0013-harness>.mjs   # mocked fetch: origin gate + HEAD/API Shorts checks + 1-day cache
node <cache-harness>.mjs   # channel 7d/refresh, categories 1 month/region/fresh, search TTL/default, q space/%20/literal plus/empty
node <channel-multi-harness>.mjs # bare multi, explicit forms, /c/ page, dedupe, cache/refresh
npx wrangler dev           # static smoke: /, /tools, /settings; resolver live forms
Playwright/Chromium        # mocked /api/*; multi cards/status, status/cached, refresh next to status, links, badges, nav, region/category storage, q %20/%2B + whitespace-only search
```

HDT decision reason:

REQUIRED - the task changes user-visible runtime behavior on three pages (resolver links/buttons, bare-name multi-check cards/`/c/` resolution, found/cached status + Refresh next to it, result-card Shorts links/badges, category region refresh, search max-cache default, mobile nav overlay, q space/plus behavior) and the API/cache boundary. Automated mocked checks cover logic, but real browser interaction and network behavior need human confirmation.

## Pending Decision

None. Assumptions are recorded under Decisions; correct them before closeout if they do not match intent.

## Notes / Evidence

- User request 2026-10-20: "new task on m3: channel resolver: link to channel on image & title, add invidious button next to 'use in search'; extra: detect shorts for channel/playlist scope, ref: %TEMP%\yt-shorts.md; api/backend can only be accessed by specific domain e.g.: this worker; primaryNav: transparent background when open nav on mobile, so close nav when click outside nav".
- Reference: `%TEMP%\yt-shorts.md` (StackOverflow 78703474 / 76602819): `playlistId = "UUSH" + channelId.slice(2)`, then `playlistItems.list` with `videoId`; non-empty `items` means the video is a Short. The API fallback uses `UUSH`; a scoped playlist already named `UUSH…`, `UUPS…`, or `UUMS…` is marked directly.
- Follow-up 2026-10-20: "optimize short check: first check with HEAD, if 200 is short, if redirect is video. if fail (not 200 or redirect), fallback to api ... cache it for 1 day." Implemented with `www.youtube.com/shorts/<id>` HEAD first (apex `youtube.com` 301s to `www`), 3xx `/watch` = regular video, other outcomes → UUSH API fallback; positive + negative results cached 1 day. The automatic harness and real-workerd checks cover the new path.
- Follow-up 2026-10-21: "short url to youtube use `/shorts/`, not `/watch?v=`; remove 'Categories in browser localStorage'; when Region on settings changed, if region on settings not same with region in Categories cache, next api call is fresh categories based new region; channel lookup = 7 days; categories = 1 month; channel lookup: add refresh button." Implemented as detected-Short links, localStorage category-list removal + sessionStorage region marker, fixed 7-day/1-month TTLs, and a Tools Refresh button that rewrites the channel cache.
- Follow-up 2026-10-21: "channel lookup: fill status when found & cache (if cache), refresh button next to status." Implemented: success status is `Found: <title>` plus ` (cached)` on `x-cache-status: HIT`; the Refresh button moved from the card actions to the `.resultbar` next to the status.
- Follow-up 2026-10-21: Chrome warning "Blocked aria-hidden on an element because its descendant retained focus" from `<button.clrbtn>`. Fixed in `public/input-clear.js`: the × is a real **Clear** control (`aria-label`, no `aria-hidden`); `syncOne` moves focus to the input before hiding a focused ×. Playwright clicks ×, verifies focus returns to the input, and asserts no `aria-hidden` console message.
- Follow-up 2026-10-21: "add max cache time 30 minutes, then set default to it." Added `1800` to the Settings select and made it the default in Settings/load/save/reset, the index fallback, and the Worker search default. Existing stored preferences are preserved.
- Follow-up 2026-10-21: "add support search ` ` or `%20` (space) only in `q` parameter, not `+`." Implemented raw-q parsing: `%20`/literal space = space, `+` = plus; whitespace-only q is forwarded; empty q still requires scope. The app now encodes q as `%20`/`%2B` in both the page URL and `/api/search`, and the keyword guard accepts a whitespace-only query.
- Follow-up 2026-10-22: channel lookup multiple check. Bare names now check `@handle` + `/user/` + `/c/` and show distinct channels; explicit URL forms stay exact. `/c/` is resolved from the fixed YouTube page canonical ID because the Data API has no custom-URL lookup. Examples verified live: bare `android`/`tensorflow` → 2 channels, bare `chrome`/`firebase` → 1; `/c/chrome` → Google Chrome, `/user/chrome` and `@chrome` → not found, `@GoogleChrome` → Google Chrome, `/user/android` → legacy channel.
- Historical context: a duration-based Hide Shorts heuristic was removed in T-0006 because the API has no Shorts filter; this task replaces the heuristic with the HEAD/UUSH membership check for scoped searches only.

### Automated evidence (2026-10-20)

- `node --check worker.js` — PASS.
- Inline-script extraction + `node --check` for `index.html`, `tools.html`, `settings.html` — PASS (6/6 inline scripts).
- Node worker harness with mocked upstream (`t0013-worker-harness-v2.mjs`) — PASS, 16/16:
  - origin helper 8/8 (same-origin Origin/Referer, cross-origin, localhost, headerless, `Sec-Fetch-Site`);
  - cross-origin `/api/search` → 403 without any upstream call; same-origin/headerless → 200; `Sec-Fetch-Site: cross-site` → 403;
  - HEAD `200` → Short; HEAD `303 Location: /watch` → regular video; zero API fallbacks for resolved HEADs;
  - positive and negative results cached with `cache-control: max-age=86400`; a second search for the same videos makes zero HEAD/API calls;
  - HEAD canary failure → HEAD disabled, API probes all videos (one canary HEAD only);
  - one ambiguous HEAD → only that video uses the API fallback;
  - missing UUSH playlist → one 404 probe, all group videos cached false;
  - non-scoped search makes no HEAD/API checks; known `UUSH` playlist marked directly; normal playlist uses HEAD;
  - 45 videos → 40 HEAD checks + `shortsDetectionLimited`; API failure is non-fatal and not cached; static `/` not origin-gated.
- Real workerd smoke (temp worker importing `checkShortByHead`, live YouTube):
  - `GAH8Je1kZ-A` → `{known:true, short:true}` (HEAD 200);
  - `82CX6WULNA0` → `{known:true, short:false}` (HEAD 303 → `/watch?v=82CX6WULNA0`);
  - `redirect:"manual"` exposes `status` + `Location` in workerd;
  - actual `shortCacheGet`/`shortCachePut` in workerd with a synthetic key: request 1 `{before:null, after:true}`, request 2 `{before:true, after:true}` (cache persists across requests).
- `wrangler dev` (4.151.3) — pages served at `http://127.0.0.1:8787`; live cross-origin `/api/search` 403, `Sec-Fetch-Site: cross-site` 403, `/tools` 200.
- Playwright/Chromium (headless, mocked `/api/*`, no quota spent) — PASS:
  - `/tools` at 360px: image + title link to `https://youtube.com/channel/<id>` (new tab), actions are exactly `Use in search` + `Invidious ↗` (Invidious target `_blank`), no horizontal overflow; desktop 1500px card renders with both actions in one row.
  - mobile nav on `/tools`, `/settings`, `/`: hamburger opens nav, backdrop is `display:block` with transparent background, outside click closes it, hamburger still toggles, resize >700px closes it, desktop nav/menu/backdrop states unchanged.
  - index with mocked channel-scoped result: exactly one `Shorts` badge on the short video; duration (`1:00`) and playlist badges remain intact.
  - 0 console/page errors across all three pages.
- Fix found while testing: the Tools result section lacked `id="result"`, so the existing ≤640px row CSS (`#result …`) never applied and the 355px banner overflowed the 336px card. Added `id="result"`; the mobile card now uses the intended 140px row and the new image link keeps `height:100%`.

### Automated evidence (2026-10-21 follow-up)

- `node --check worker.js` — PASS; inline-script extraction + `node --check` 6/6 — PASS.
- Cache harness with mocked upstream (`t0014-cache-harness.mjs`) — PASS, 7/7:
  - `/api/channel`: first lookup MISS → `cache-control: max-age=604800`; second lookup HIT with one upstream call; `fresh=1` bypasses and rewrites the entry (second title appears on the next normal HIT).
  - `/api/categories`: first lookup MISS → `max-age=2592000`; non-assignable categories filtered; second lookup HIT; `fresh=1` bypasses and rewrites; a different `regionCode` is a different key and calls upstream.
  - `/api/search`: `cacheTtl` is not part of the key; the first written TTL wins; `fresh=1` still bypasses without rewriting (search behavior unchanged).
  - `/api/search` without `cacheTtl`: the Worker default is `max-age=1800` (30 minutes).
  - `/api/search?q=%20`: a whitespace-only q is forwarded upstream as `q=" "` and returns 200; an empty q without scope still returns 400.
  - `/api/search?q=hello+world`: upstream q is `hello+world` (literal plus, no space); `/api/search?q=hello%20world`: upstream q is `hello world`.
- T-0013 worker harness (`t0013-worker-harness-v2.mjs`) — PASS, 16/16 regression (origin gate, HEAD/API Shorts, 1-day Shorts cache, caps, failure paths).
- Playwright/Chromium (headless, mocked `/api/*`, no quota spent) — PASS:
  - `/tools` status: first lookup shows `Found: Test Channel` with `.ok`; second normal lookup shows `Found: Test Channel (cached)`; **Refresh ↻** is in `.resultbar` next to `.status` (not in `.resolve-actions`), sends `fresh=1`, and shows `Found: Refreshed Channel`; a later normal lookup shows `Found: Refreshed Channel (cached)`; desktop and 360px keep the status and Refresh on one row (the status text wraps at 360px), with no overflow.
  - Search results: the detected Short's thumbnail/title link to `https://youtube.com/shorts/short1`; the ordinary video links to `https://youtube.com/watch?v=normal1`; exactly one Shorts badge; the mocked search request includes `cacheTtl=1800`.
  - Settings: **Max cache time** offers **30 minutes** (`1800`) and selects it on a fresh profile.
  - Categories: no `ytas.catList` localStorage entry after load; initial DE load calls `regionCode=DE` without `fresh`; changing to US calls `regionCode=US&fresh=1`; a second US load does not add `fresh`; the select shows the returned live list.
  - q parsing: loading `/?q=%20` shows a space in the input, keeps `q=%20` in the page URL, and sends a space to `/api/search`; submitting a space-only search from the form also works; `/?q=hello%20world` sends `q=hello%20world` (not `+`); `/?q=hello%2Bworld` and `/?q=hello+world` both keep the plus literal and send `q=hello%2Bworld`; page URLs use `%20`/`%2B` for q.
  - Clear ×: clicking a focused clear button returns focus to its input; no `aria-hidden` console message; 0 console/page errors.
- `node --check public/input-clear.js` — PASS.
- `wrangler dev` served `/`, `/tools`, `/settings` during the Playwright run (static smoke); no live YouTube calls were made by the mocked UI.

### Automated evidence (2026-10-21 q parsing)

- `node --check worker.js` — PASS; inline-script extraction + `node --check` for `index.html`, `tools.html`, `settings.html` — PASS (6/6).
- Cache harness — PASS, 7/7 (channel/categories/search TTL/refresh plus q `%20`, literal plus, `%20` space, empty q).
- T-0013 worker harness — PASS, 16/16 regression (origin gate, HEAD/API Shorts, 1-day Shorts cache, caps, failure paths).
- Playwright/Chromium — PASS, 9/9 (mocked `/api/*`, no quota): resolver bare-name multi-check (`android` → 2 cards / `firebase` → 1 / Refresh reruns), whitespace-only q page load + form submit; page URL and API q use `%20`; literal plus uses `%2B` for `%2B` and raw `+` page URLs; Shorts links; Tools status/Refresh; categories; 30-minute default; clear-button aria/focus.
- `git -c core.whitespace=cr-at-eol diff --check` — PASS (`public/index.html` is stored as CRLF, so the default check flags every added line's CR).

### Automated evidence (2026-10-22 resolver multi-check)

- `node --check worker.js` — PASS; inline scripts 6/6 — PASS.
- `t0015-channel-multi.mjs` — PASS, 15/15: bare `android`/`tensorflow` → 2; `chrome` → 1 via custom page; `firebase` → 1 deduplicated with handle+username+custom; explicit `/c/chrome`, `/c/android`, `/user/chrome` (404), `/user/android`, `/@chrome` (404), `/@GoogleChrome`, `/channel/<id>`, explicit handle/username kinds; unknown → clean 404; combined multi cache HIT + fresh rewrite.
- Live `wrangler dev` resolver checks (real API/page, no search quota): bare `android` → `Android` + legacy `android`; bare `chrome` → `Google Chrome` via `/c/chrome`; bare `tensorflow` → 2; bare `firebase` → 1 with all three matches; explicit `/c/chrome` → 200 Google Chrome; `/user/chrome` → 404; `/@chrome` → 404; `/@GoogleChrome` → 200; `/user/android` → legacy; `/channel/<id>` → Android. `x-cache-status: HIT` on a repeat `url=android`; `cache-control: max-age=604800`.
- Playwright/Chromium — PASS, 9/9 (mocked `/api/*`): multi cards/status and `Matched by ...` lines, Refresh rerun, plus the existing T-0013 regression.
- Existing T-0013 worker harness 16/16 and cache harness 7/7 — PASS.

### HDT (PASS 2026-10-22)

User report 2026-10-22: **all test pass** — every HDT step above is accepted, including the cross-site 403 check. Task is verified and ready to close.

1. `/tools`: resolve `@Fireship`; the status should read `Found: Fireship`. Click the channel image and the title → both open the Fireship channel on YouTube. Click **Invidious ↗** next to **Use in search** → an Invidious channel page opens. Resolve the same channel again → the status should read `Found: Fireship (cached)`.
2. Search inside a channel that posts Shorts (e.g. `handle:@Fireship` or `channel:<id>`): some cards show a blue **Shorts** badge; ordinary videos do not. Repeat with a playlist scope containing Shorts. Detection tries a HEAD check first and only falls back to the API if that is inconclusive; a Short may still be unlabelled if neither method confirms it. Repeating the same search should be fast because each video's result is cached for a day.
3. Cross-site API check: run `curl.exe -i "<worker-url>/api/search?q=test" -H "Origin: https://example.com"` on Windows (use `curl` on macOS/Linux) → `403` with `{"error":"Forbidden origin"}`; normal searches in the app still work.
4. Narrow window (<700px): open ☰; the menu appears without a dimming layer; tap outside it → it closes. Widen the window → the menu closes and the normal desktop nav returns.
5. Detected Shorts links: click a Short's thumbnail or title → it opens `https://youtube.com/shorts/<id>`. A normal card still opens `https://youtube.com/watch?v=<id>`.
6. Categories / region: Settings → set Region to another 2-letter code (e.g. `DE`) → Save → Adv Search. The Category dropdown should list categories for the new region. In DevTools → Network, the categories request should be `/api/categories?regionCode=DE&fresh=1`; Application → Local Storage should have no `ytas.catList`; Session Storage should show `ytas.catRegion = DE`. Reload with the same region → no `fresh=1`.
7. Tools refresh: resolve a channel; **Refresh ↻** should sit next to the status (not inside the card actions). Click it → the card refreshes, the status returns to `Found: <title>` without `(cached)`. In DevTools → Network, the `/api/channel` request should include `fresh=1`; resolve again normally → the status should show `(cached)` with the refreshed data (the cache was rewritten).
8. Tools multi-check: enter bare `android` → two cards, **Found 2 channels**; the cards should say `Matched by @android + /c/android` and `Matched by /user/android`. Try bare `tensorflow` → 2; bare `chrome` → 1 (Google Chrome via `/c/chrome`); bare `firebase` → 1 (matched by `@firebase`, `/user/firebase`, and `/c/firebase`). Then check explicit forms: `/c/chrome` → Google Chrome, `/user/chrome` → not found, `@chrome` → not found, `@GoogleChrome` → Google Chrome, `/user/android` → the legacy `android`, `/channel/UC9M7-jzdU8CVrQo1JwmIdWA` → Android. A `/c/` lookup may take a moment because it reads the fixed YouTube page; after the first result, a repeat should be `(cached)`, and **Refresh** should re-run all checks.
9. Clear ×: type text in a field and click its ×. The field should clear and keep focus; the Console should have no `aria-hidden` warning.
10. Max cache time: open Settings on a fresh profile (or click Reset), and confirm **Max cache time** shows **30 minutes**. Start a search; DevTools → Network should show `cacheTtl=1800` on `/api/search`.
11. Search q: type a single space in the search box and press Search → results should load (not “Type a keyword to search”), and the browser URL should keep `q=%20` (not `q=+`). Search `hello world` → the page URL and `/api/search` request should use `q=hello%20world`. Search `C++` → the request should use `q=C%2B%2B`; the plus is not treated as a space. Opening `/?q=hello+world` directly should keep `hello+world` as one literal-plus query and rewrite the URL to `q=hello%2Bworld`; use `%20` for a space. Optionally, `curl.exe -sS -o NUL -w "%{http_code}" "<worker-url>/api/search?q=%20"` should return `200`, while an empty `q=` without scope should still return `400`.
12. Report: pass/fail per step, plus any console errors, a Shorts case that should have been labelled, a category/region mismatch, a q encoding problem, or a resolver form/count mismatch.

## Affected Durable Artifacts

- `.aaw/milestones/M-0003-filter-topbar-settings.md`
- `.aaw/roadmap.md`
- `.aaw/now.md`
- `ARCHITECTURE-MAP.md`
- `README.md`
- `.aaw/security.md` (origin gate + fixed-host `/c/` egress evidence)
- `.aaw/constraints.md` (fixed `/c/` page egress)

## Commit Checkpoint

Suggested commit message:

```text
feat: resolver links/multi-check (incl. /c/), scoped shorts + /shorts/ links, API gate, nav backdrop, cache tuning + refresh, q space/plus parsing
```

Commit status: `COMMITTED` 2026-10-22

## Handoff

Automated work complete 2026-10-22; HDT PASS from the user report "all test pass" on 2026-10-22. Task is COMPLETE and has moved to `.aaw/tasks/done/`; M-0003 remains IN_PROGRESS only because it closes on explicit user confirmation. The task commit checkpoint is offered; use the suggested message above after checking that pre-existing user edits are excluded.
