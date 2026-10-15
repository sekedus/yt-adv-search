# Architecture Map

## Status

COMPLETE through M-0003 — Worker + pages + UI polish landed (T-0001..T-0009); T-0010 IN_PROGRESS (quota/cache/playlist/UX).

## Purpose

A compact navigation map for the codebase. Points to where capabilities will live once implemented.

## Map

### Project Domains

| Domain / Area | Primary Path(s) | Responsibility | Key Dependencies | Consumers | Tests |
|---|---|---|---|---|---|
| Search UI | `public/index.html` (route `/`) | Searchpanel bar, Filters (`.advgrid` neat layout, incl. playlist scope), results grid, pagination, enrichment toggle, refresh bypass, `/` shortcut, jump buttons (`.jumpbtns`) | `/api/search`, shared `public/styles.css`, `localStorage` | Browser user | Browser HDT |
| Worker API | `worker.js` (`/api/search`, `/api/channel`) | Key rotation + quota exclusion (403 quotaExceeded → skip till 00:00 UTC), GET cache (`caches.default`, `?fresh=1` bypass), operator resolution (incl. `playlist:` via playlistItems), `search.list`/`videos.list`/`channels.list`/`playlistItems.list` forwarding | `YOUTUBE_API_KEYS`, googleapis v3 | Search UI, Tools page | `node --check`, wrangler smoke |
| Channel resolver | `public/tools.html` (route `/tools`) | URL/handle/username → ID + snippet + `Use in search` | `/api/channel` | Browser user | Browser HDT |
| Settings | `public/settings.html` (route `/settings`) | Theme, neat defaults grid (Save/Reset merged), enrichment opt-in, max cache time, key-index status | `localStorage`, `/api/search` status | Search UI, Tools page | Browser HDT |
| Shared style | `public/styles.css` | Auto-dark theme, centered-brand hamburger topbar, Invidious-like filters/results | none | All pages | Visual check |

### Entry Points

- `GET /` — search page.
- `GET /tools` — resolver page.
- `GET /settings` — preferences page.
- `GET /api/search?...` — proxied `search.list` (+ optional `videos.list` enrichment).
- `GET /api/channel?handle=|id=|username=` — proxied `channels.list`.
- `GET /api/categories?regionCode=` — slimmed assignable `videoCategories.list`, cached 1 week.

### Important Flows

#### Search

```text
input bar + filters (+ playlist scope, ?fresh=1 bypass)
  -> worker parses channel:/handle:/playlist:/before:/after:
  -> playlist: via playlistItems.list (3 pages) + local keyword filter
  -> channels.list forHandle when needed
  -> cached GET (caches.default, 300s) or search.list with mapped params
      + quota-aware key rotation (quotaExceeded keys skipped till 00:00 UTC)
  -> optional videos.list enrichment (opt-in)
  -> results grid (+ Cached/Fresh/Playlist-scoped notes)
```

#### Resolve channel

```text
tools input (URL/@handle/UC../username)
  -> /api/channel
  -> channels.list forHandle|forUsername|id
  -> ID + title + thumbnail
```

### Hotspots / Sensitive Boundaries

| Area | Why sensitive | Contract / Risk | Verification |
|---|---|---|---|
| `worker.js` key rotation | Quota errors, key leak risk | Rotate on non-200; quotaExceeded keys excluded till 00:00 UTC (in-memory per isolate); never reflect keys; fixed-host egress only (`/search`, `/channels`, `/videos`, `/playlistItems`) | `node --check` + smoke + secrets review |
| Operator parsing | `handle:` has no native API; mis-parse scopes wrong channel | Unknown `a:b` stays literal; `@` stripped before `forHandle`; short `playlist:` stays literal | Unit-ish smoke + HDT `handle:fireship` |
| Filter mapping | Some Invidious options have no API equivalent | Disabled with tooltip; Movie/Show via `videoType`/`channelType` | HDT per filter group |
| Quota | `search.list` 100/day bucket | Enrichment OFF default; max 50, default 25; cache 300s; quota keys skipped till midnight UTC | Smoke + error-state HDT |

### Reusable Capabilities

| Capability | Existing Implementation | How to Reuse |
|---|---|---|
| Theme (auto/dark) | `public/styles.css` + per-page head init | `prefers-color-scheme` + `localStorage` override |
| Proxy fetch | `worker.js` helper | Same helper for search/channel/videos |

### Test Surface

- Syntax: `node --check worker.js`
- Smoke: `wrangler dev` hits for `/`, `/tools`, `/settings`, `/api/*`
- HDT: search/filters/operators, resolver with `@Fireship`, settings persistence, all-keys-bad error
