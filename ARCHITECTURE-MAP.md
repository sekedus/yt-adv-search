# Architecture Map

## Status

IN_PROGRESS v1 — `worker.js` landed (T-0001); pages pending T-0002..T-0004.

## Purpose

A compact navigation map for the codebase. Points to where capabilities will live once implemented.

## Map

### Project Domains

| Domain / Area | Primary Path(s) | Responsibility | Key Dependencies | Consumers | Tests |
|---|---|---|---|---|---|
| Search UI | `public/index.html` (route `/`) | Bar, Filters, results grid, pagination, enrichment toggle | `/api/search`, shared `public/styles.css`, `localStorage` | Browser user | Browser HDT |
| Worker API | `worker.js` (`/api/search`, `/api/channel`) | Key rotation, operator resolution, `search.list`/`videos.list`/`channels.list` forwarding | `YOUTUBE_API_KEYS`, googleapis v3 | Search UI, Tools page | `node --check`, wrangler smoke |
| Channel resolver | `public/tools.html` (route `/tools`) | URL/handle/username → ID + snippet + `Use in search` | `/api/channel` | Browser user | Browser HDT |
| Settings | `public/settings.html` (route `/settings`) | Theme, defaults, enrichment opt-in, key-index status | `localStorage`, `/api/search` status | Search UI, Tools page | Browser HDT |
| Shared style | `public/styles.css` | Auto-dark theme, Invidious-like filters/results | none | All pages | Visual check |

### Entry Points

- `GET /` — search page.
- `GET /tools` — resolver page.
- `GET /settings` — preferences page.
- `GET /api/search?...` — proxied `search.list` (+ optional `videos.list` enrichment).
- `GET /api/channel?handle=|id=|username=` — proxied `channels.list`.

### Important Flows

#### Search

```text
input bar + filters
  -> worker parses channel:/handle:/before:/after:
  -> channels.list forHandle when needed
  -> search.list with mapped params + key rotation
  -> optional videos.list enrichment (opt-in)
  -> results grid
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
| `worker.js` key rotation | Quota errors, key leak risk | Rotate on non-200; never reflect keys; fixed-host egress only | `node --check` + smoke + secrets review |
| Operator parsing | `handle:` has no native API; mis-parse scopes wrong channel | Unknown `a:b` stays literal; `@` stripped before `forHandle` | Unit-ish smoke + HDT `handle:fireship` |
| Filter mapping | Some Invidious options have no API equivalent | Disabled with tooltip; Movie/Show via `videoType`/`channelType` | HDT per filter group |
| Quota | `search.list` 100/day bucket | Enrichment OFF default; max 50, default 25 | Smoke + error-state HDT |

### Reusable Capabilities

| Capability | Existing Implementation | How to Reuse |
|---|---|---|
| Theme (auto/dark) | `public/styles.css` + per-page head init | `prefers-color-scheme` + `localStorage` override |
| Proxy fetch | `worker.js` helper | Same helper for search/channel/videos |

### Test Surface

- Syntax: `node --check worker.js`
- Smoke: `wrangler dev` hits for `/`, `/tools`, `/settings`, `/api/*`
- HDT: search/filters/operators, resolver with `@Fireship`, settings persistence, all-keys-bad error
