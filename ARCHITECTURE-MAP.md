# Architecture Map

## Status

Product baseline complete through T-0012; T-0013 COMPLETE + HDT PASS (2026-10-22); M-0003 IN_PROGRESS with all tasks/exit criteria satisfied, awaiting explicit user close.

## Purpose

A compact navigation map for the codebase. Points to where capabilities will live once implemented.

## Map

### Project Domains

| Domain / Area | Primary Path(s) | Responsibility | Key Dependencies | Consumers | Tests |
|---|---|---|---|---|---|
| Search UI | `public/index.html` (route `/`) | Search panel bar (keyword + exclude words `-word`/`ex`; text fields get a clear ✕ via shared `input-clear.js`), Filters (main grid incl. opt-in Broadcasts `eventType`, a Dates panel with After/Before (`publishedAfter`/`publishedBefore`), and separate Definitions/Captions/Licenses/Dimensions panels using `videoDefinition`/`videoCaption`/`videoLicense`/`videoDimension`; full-width `.advgrid` advanced incl. playlist scope), results grid (bidi-safe card meta: channel + time isolated; `Shorts` badge for scoped detection; detected Shorts link to `/shorts/<id>`), pagination, enrichment toggle, refresh bypass, `/` shortcut, jump buttons (`.jumpbtns`); categories fetched from `/api/categories` with no browser list cache (sessionStorage stores only the last loaded region); whitespace-only q is a valid search; page/API q encoded as `%20`/`%2B` (not form `+`), and the page parser also keeps a raw `+` literal | `/api/search`, `/api/categories`, shared `public/styles.css` + `public/input-clear.js`, `localStorage` | Browser user | Browser HDT + Playwright |
| Worker API | `worker.js` (`/api/search`, `/api/channel`, `/api/categories`) | Own-origin gate for `/api/*` (same origin + localhost; headerless CLI passes), key rotation + quota exclusion (403 quotaExceeded → skip till 00:00 UTC), GET cache (`caches.default`; search 60-3600 s, default 30 min; channel 7 days; categories 1 month; `?fresh=1` bypass; channel/category bypass rewrites), resolver bare-name multi-check (`forHandle` + `forUsername` + fixed `www.youtube.com/c/<slug>` GET; canonical-ID dedupe; URL-form cache key v=2), operator resolution (incl. `playlist:` via playlistItems), raw q parsing (`%20`/literal space = space; `+` = literal plus; whitespace-only q allowed; truly empty q requires scope), scoped Shorts detection (HEAD `www.youtube.com/shorts/<id>`: 200 = Short, 3xx `/watch` = video; UUSH API fallback; 1-day result cache; cap 40 HEAD + 6 API fallbacks), `search.list`/`videos.list`/`channels.list`/`playlistItems.list` forwarding | `YOUTUBE_API_KEYS`, googleapis v3, fixed YouTube web HEAD + `/c/` GET | Search UI, Tools page | `node --check`, mocked Node harness, multi harness, cache harness, workerd HEAD + `/c/` smoke, wrangler smoke |
| Channel resolver | `public/tools.html` (route `/tools`) | URL/handle/ID/username/bare name → ID + snippet + channel/Invidious links + `Use in search`; bare names check `@handle` + `/user` + `/c` and show every distinct channel (`Found <n> channels` + `Matched by ...`); explicit URL forms/kind selectors stay exact; status `Found: <title>` (+ ` (cached)` on `x-cache-status: HIT`) with **Refresh** next to it (`fresh=1`, rewrites the combined 7-day cache) | `/api/channel` | Browser user | Playwright + Browser HDT |
| Settings | `public/settings.html` (route `/settings`) | Theme, neat defaults grid (Save/Reset merged), enrichment opt-in, max cache time (search only; default 30 min), key-index status | `localStorage`, `/api/search` status | Search UI, Tools page | Browser HDT |
| Shared style | `public/styles.css` | Auto-dark theme, centered-brand hamburger topbar with transparent nav backdrop (outside click closes), Invidious-like filters/results | none | All pages | Visual check |
| Shared input UX | `public/input-clear.js` | Clear ✕ on every `input[type="text"]` (wraps in `.inputclear`; type stays `text`; programmatic resets call `window.syncInputClear()`); the visible button is a real **Clear** control (no `aria-hidden`) and a focused ✕ moves focus to its input before hiding | `public/styles.css` | All pages | `node --check` + Playwright + Browser HDT |

### Entry Points

- `GET /` — search page.
- `GET /tools` — resolver page.
- `GET /settings` — preferences page.
- `GET /api/search?...` — proxied `search.list` (+ optional `videos.list` enrichment).
- `GET /api/channel?handle=|id=|username=|url=` - proxied `channels.list`; `url=` bare names run the multi-check, explicit URL forms resolve one form, and `/c/` reads the fixed YouTube page.
- `GET /api/categories?regionCode=` — slimmed assignable `videoCategories.list`, cached 1 month; `fresh=1` bypasses and rewrites the region entry.

### Important Flows

#### Search

```text
input bar + filters (+ playlist scope, ?fresh=1 bypass)
  -> page q read/encoded as %20/%2B (raw + stays plus; space needs %20)
  -> worker origin gate for /api/* (same origin + localhost; headerless passes)
  -> worker parses raw q (literal + stays +; %20/space splits words)
  -> worker parses channel:/handle:/playlist:/before:/after:
  -> playlist: via playlistItems.list (3 pages) + local keyword filter
  -> channels.list forHandle when needed
  -> cached GET (search cache 60–3600s, default 1800s / 30 min) or search.list with mapped params
      + quota-aware key rotation (quotaExceeded keys skipped till 00:00 UTC)
  -> optional videos.list enrichment (opt-in)
  -> scoped Shorts check: HEAD https://www.youtube.com/shorts/<videoId>
      (200 = Short; 3xx to /watch = regular video; 1-day result cache)
  -> ambiguous/blocked HEAD: playlistItems.list on UUSH<channel suffix> + videoId
      (cap 40 HEAD checks; at most 6 API fallbacks when HEAD works; 404 = no
      Shorts playlist; failures non-fatal)
  -> results grid (+ Shorts badges, Cached/Fresh/Playlist-scoped notes)
```

#### Resolve channel

```text
tools input (URL/@handle/UC../username/bare name)
  -> /api/channel (7-day caches.default entry, keyed by the request URL + v=2 for url= forms)
  -> bare name: channels.list forHandle + forUsername + fixed GET www.youtube.com/c/<slug>
       -> canonical channel IDs deduped; matchedBy forms attached
  -> explicit /@, /user/, /c/, /channel/ or selected kind: one form only
  -> ID + title + thumbnail
  -> card image/title link to youtube.com/channel/<id>; Invidious button
  -> status Found: <title>, or Found <n> channels with Matched by source lines
  -> Refresh next to the status re-runs with fresh=1 (bypass + rewrite)
```

#### Categories

```text
settings region or US
  -> /api/categories?regionCode=<region>
  -> 1-month caches.default entry per region
  -> if sessionStorage last region differs: add fresh=1 + no-store
     (bypasses the server read and rewrites that region's entry)
  -> fill the Category select; store only the last region in sessionStorage
```

### Hotspots / Sensitive Boundaries

| Area | Why sensitive | Contract / Risk | Verification |
|---|---|---|---|
| `worker.js` key rotation | Quota errors, key leak risk | Rotate on non-200; quotaExceeded keys excluded till 00:00 UTC (in-memory per isolate); never reflect keys; fixed-host egress only (`/search`, `/channels`, `/videos`, `/playlistItems`, `/videoCategories`, plus `www.youtube.com/shorts` HEAD and `www.youtube.com/c/<slug>` GET) | `node --check` + smoke + secrets review |
| Operator parsing | `handle:` has no native API; mis-parse scopes wrong channel | Unknown `a:b` stays literal; `@` stripped before `forHandle`; short `playlist:` stays literal | Unit-ish smoke + HDT `handle:fireship` |
| q parsing | URLSearchParams turns `+` into a space; a plus in a search must stay literal | Raw q parser: `%20`/literal space = space; `+`/`%2B` = plus; whitespace-only q forwarded; truly empty q still 400 without scope; app encodes q as `%20`/`%2B` | Cache harness + Playwright + HDT q step |
| API origin gate | No login; quota-backed proxy | Same-origin + localhost only; headerless CLI/scripts still pass (deterrence, not authentication); static pages stay public | Node harness + live 403 smoke |
| Shorts check | HEAD to YouTube web is outside the Data API quota but adds a fixed egress host; the UUSH playlist is undocumented | Only channel/playlist scope; 40 HEAD checks/response; 6 API fallbacks when HEAD works (40 if HEAD is unavailable); 404 skips the channel; results cached 1 day; failures never fail the search | Mocked Node harness + real workerd HEAD smoke + HDT on a real channel |
| Resolver `/c/` page lookup | The Data API has no custom-channel-URL parameter; a page GET is outside the API quota but fetches a large HTML document | Bare names and explicit `/c/` only; fixed host, encoded slug, no cookies/API key, max 3 same-host redirects, 3 MB parse cap, canonical/externalId only, never returned; failure is a normal not-found; combined result cached 7 days | Multi harness + live `/c/chrome` smoke + HDT explicit forms |
| Filter mapping | Some Invidious options have no API equivalent | Disabled with tooltip; Movie / Episode (Show) via `videoType` (`channelType=show` for show channels) | HDT per filter group |
| Quota | `search.list` 100/day bucket | Enrichment OFF default; max 50, default 25; search cache 60–3600s (default 1800s / 30 min); channel 7 days; categories 1 month; quota keys skipped till midnight UTC | Smoke + cache harness + error-state HDT |

### Reusable Capabilities

| Capability | Existing Implementation | How to Reuse |
|---|---|---|
| Theme (auto/dark) | `public/styles.css` + per-page head init | `prefers-color-scheme` + `localStorage` override |
| Proxy fetch | `worker.js` helper | Same helper for search/channel/videos |

### Test Surface

- Syntax: `node --check worker.js`
- Smoke: `wrangler dev` hits for `/`, `/tools`, `/settings`, `/api/*`
- Worker harness: mocked upstream for origin gate + HEAD/API Shorts checks + 1-day cache (no quota)
- Multi harness: bare-name `/@`/`/user`/`/c` checks, explicit URL/kind forms, `/c/` canonical lookup, dedupe + cache/refresh
- Cache harness: channel 7-day TTL + refresh rewrite; categories 1-month TTL + region key + fresh rewrite; search TTL/bypass semantics; q `%20`/literal space/literal plus/empty
- Playwright: q `%20`/`%2B` in page/API URLs, whitespace-only q, Tools multi cards/status/Refresh, Shorts links, categories, settings, clear-button focus
- HDT: search/filters/operators, scoped Shorts badges + `/shorts/` links, resolver links/Invidious + bare-name multi-check + exact URL forms + found/cached status/Refresh next to status, clear-button focus/no `aria-hidden` warning, category region change + no `ytas.catList`, mobile nav outside close, settings persistence, all-keys-bad error, q space/plus behavior
