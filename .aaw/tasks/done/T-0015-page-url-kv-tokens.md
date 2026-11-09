---
id: T-0015
type: feature # feature | fix | chore | research
status: COMPLETE # PLANNED | IN_PROGRESS | AWAITING_USER_DECISION | AWAITING_HDT | AWAITING_USER_REVIEW | BLOCKED | COMPLETE | CANCELLED
milestone: null # standalone task; no milestone
size: MEDIUM # SMALL | MEDIUM | LARGE
created: "2026-11-09"
updated: "2026-11-09"
hdt_requirement: REQUIRED # UNDECIDED | NOT_REQUIRED | REQUIRED
hdt_status: PASS # NOT_STARTED | AWAITING_USER | PASS | FAIL | DECLINED | NOT_APPLICABLE
cancellation_reason: null # Required text when status is CANCELLED; otherwise null
---

# T-0015 — Search pagination in the URL (`?page=N`) with a KV page-token store

## Objective

Make search pagination reloadable, bookmarkable, and shareable with a short URL
(`?q=text&page=2` instead of an opaque token) by storing YouTube `pageToken` values in
Cloudflare KV, keyed by a hash of the effective search parameters. Page tokens stay
server-side; the URL carries only the page number.

## Size / Scope

MEDIUM — `worker.js`, `public/index.html`, `wrangler.toml`, plus docs and state files.
One bounded task; no milestone (single coherent acceptance/verification boundary).

### In Scope

- `wrangler.toml`: one KV namespace binding `PAGE_TOKENS` (id is a placeholder until the
  user creates the namespace). Local dev uses Miniflare's local KV.
- `worker.js`:
  - Accept `page` on `/api/search` (integer, clamped 1..20; invalid → 1). Raw
    `pageToken` still works when `page` is absent; `page` wins if both are present.
  - Canonical key: SHA-256 (WebCrypto) over the final upstream `ytParams` (the object
    actually sent to `search.list`), sorted `k=v` joined with `&`, excluding
    `pageToken`, `page`, `fresh`, `cacheTtl`, and `enrich`. Store the first 16 bytes as
    32 hex chars.
  - KV layout: `pt:v1:<hash>:<n>` → raw page token, one key per page (`n >= 2`), with
    `expirationTtl: 604800` (7 days). Write page `n+1` only when it is absent, via
    `ctx.waitUntil` so the write stays off the response path (add `ctx` to
    `async fetch(request, env, ctx)`).
  - Page resolution for both branches: `search.list` and playlist scope
    (`fetchPlaylistItems`).
  - Response adds `page`, `hasPrev`, `hasNext`. Missing stored token or an upstream
    token rejection (`400` / `invalidPageToken`) deletes the stored key, serves page 1
    once, and returns a `pageFallback` marker (requested page) instead of an error.
  - KV unavailable / binding missing: degrade to today's page-1-only behavior; never
    throw and never emit a 5xx because of KV.
  - No raw query text, IP, or user identity is written to KV — only the hash and the
    opaque token.
- `public/index.html`:
  - Read/write `?page=N`; omit it at page 1 so short links stay short. Keep the existing
    `q` `%20` / `%2B` encoding and whitespace-only-q behavior.
  - Prev/Next = page ∓ 1, `pushState` on paging so browser Back/Forward works.
  - New search, Apply, filter change, and Reset return to page 1.
  - Reload, `popstate`, and bfcache `pageshow` restore the page and results from the URL.
  - Show a notice when the Worker reports `pageFallback` ("page N unavailable — showing
    page 1") and clean the URL back to page 1 in that case.
- Docs: `README.md` share/bookmark sentence mentions the page number;
  `ARCHITECTURE-MAP.md` records the KV binding, `/api/search` page contract, and the new
  request param; `.aaw/constraints.md` and `.aaw/security.md` record the storage
  exception (hashed param key + opaque tokens, 7-day TTL, no identity).
- State: this task, `.aaw/roadmap.md`, `.aaw/now.md`.

### Out of Scope

- Putting page tokens (or a token chain) in the URL — rejected as ugly/too long.
- Rebuilding an unvisited page by walking from page 1 — `search.list` costs 100 quota
  units per call, so a page-5 rebuild would cost 400 units. Missing pages fall back.
- A client-side `sessionStorage` token mirror (optional hardening; not needed for
  cross-device correctness).
- D1, Durable Objects, R2, or replacing the existing response cache.
- Changing page size, `maxResults`, default filters, or any other search behavior.
- Creating a milestone or reopening M-0003.

## Acceptance Criteria

- [x] URL never contains a page token; pages 2+ are `?<existing params>&page=N`, page 1
      omits `page`.
- [x] Reloading, bookmarking, and Back/Forward restore the same page and results.
- [x] Next/Prev move exactly one page when the surrounding tokens exist; Prev is
      disabled on page 1, Next is disabled when no next page exists.
- [x] `?page=N` without a stored token serves page 1 with a visible notice and no 5xx.
- [x] An upstream token rejection deletes the KV entry, serves page 1 with the notice,
      and leaks no key material.
- [x] The KV key is a 128-bit hex SHA-256 of the canonical upstream params; changing any
      search-affecting param changes it, while `fresh`, `cacheTtl`, `enrich`, and `page`
      do not.
- [x] KV entries use `expirationTtl: 604800`; `page` is clamped to 1..20 and bogus values
      resolve deterministically.
- [x] A response served from the existing cache performs zero KV reads/writes.
- [x] Missing KV binding/config degrades to page-1-only search with no crash.
- [x] Playlist-scoped search paginates through the same `?page=N` mechanism.
- [x] Existing search, filters, operator parsing, share links, status notes, and layout
      are unchanged; no console errors at 360px or desktop width.
- [x] `README.md`, `ARCHITECTURE-MAP.md`, `.aaw/constraints.md`, `.aaw/security.md` reflect
      the new storage and URL behavior.

## Verification

Commands / checks and expected results:

```text
node --check worker.js
# PASS: worker syntax parses

node <inline-script-check>.mjs
# PASS: every inline <script> in public/index.html compiles

node <t0015-harness>.mjs
# mocked upstream + fake KV map:
# - page 1 stores next token at :2 with ttl 604800
# - page 2 reads :2, stores :3
# - missing :N -> page 1 + pageFallback, one upstream call with no token
# - upstream 400 on token -> key deleted + page 1 + pageFallback
# - hash: same effective params -> same key; order-independent; page/fresh/cacheTtl/enrich
#   ignored; q/order/maxResults/filters/date/channel/playlist each change the key
# - page clamp: 0/-1/abc/999 -> 1/1/1/20; page+pageToken -> page wins
# - KV absent -> 200 page-1 result; KV throw -> 200 page-1 result
# - cached path: handler not invoked, zero KV calls
# - playlist scope: page 2 resolves and stores :3

npx wrangler dev  (local Miniflare KV)
# smoke: GET /, /?q=test&page=2, /api/search?q=test, /api/search?q=test&page=2,
#        /api/search?q=test&page=99, playlist scope; static pages 200

Playwright/Chromium (mocked /api/search, no quota)
# - Next -> ?page=2, results replace; Prev -> page 1 and URL drops `page`
# - reload restores page 2; Back/Forward restore pages
# - new search/Apply/reset -> page 1; unavailable page -> notice + URL cleanup
# - 360px + 1280px: no overflow, pager state correct, 0 console errors

Security review
# - no API keys or raw queries in KV keys/values or logs
# - KV key contains only hex + page index; page clamped before use
# - tokens are not reflected anywhere new
```

HDT decision reason:

REQUIRED — this is a UI/runtime change to search pagination plus a real Cloudflare KV
integration. `.aaw/verification.md` marks search/filter/page interaction as HDT
REQUIRED, and Miniflare cannot prove deployed KV behavior, cross-device links, or
propagation timing. Automated checks passed first; the task stayed `AWAITING_HDT`
until the user's report passed (PASS recorded 2026-11-09).

## Pending Decision

None. Design approved by the user 2026-11-09: SHA-256 (not MD5 — WebCrypto has no MD5),
page number in the URL, one KV key per page, 7-day TTL, cap 20 pages, no page rebuild,
page-1 fallback for missing/expired tokens.

Prerequisite outside the repo: the user must run
`npx wrangler kv namespace create PAGE_TOKENS` and paste the id into `wrangler.toml`
before deploying. Local development and automated checks use local KV only.

## Notes / Evidence

- User request 2026-11-09: remember pagination in the URL, simple `q=text&page=1` style,
  stored for 1 week, full parameter (except page) hash as key, work across devices.
- Agreed constraints from the design discussion:
  - KV key: `pt:v1:<32 hex>:<n>` (~43 bytes). Value: raw token, 40–90 bytes.
  - KV allows 60 s – 30 days TTL; 7 days is `expirationTtl: 604800`.
  - Same-colo KV read-after-write is immediate; other colos propagate within ~60 s, so
    sequential paging and same-colo share links are unaffected.
  - YouTube tokens are opaque and can expire; the 7-day TTL is a maximum, not a promise,
    so fallback is part of the feature, not an edge case.
  - A `?page=N` link only resolves pages someone has already visited. Rebuilding costs
    100 quota units per page and is deliberately not implemented.
  - Cost: 1–2 KV reads only on a search-cache miss, 1 KV write per newly discovered
    page; free-tier KV limits are far above this app's traffic.
- Existing behavior to preserve: `pageTokens` in memory, `runSearch()` replace-state
  paging, `%20`/`%2B` q encoding, playlist scope, response cache keyed on the full URL
  (so `?page=2` is a separate cache entry), 30-minute default cache TTL.
- Constraint change: `.aaw/constraints.md` currently says "no user data stored
  server-side". This task adds pseudonymous storage (param hash + opaque token, 7-day
  TTL, no identity/IP). Both constraints and security profiles must be updated as part
  of implementation, before the code is considered complete.

### Implementation (2026-11-09)

- `worker.js`: `PAGE_TOKEN_TTL_S` (604800), `MAX_PAGE` (20), `pageTokenKv`,
  `pageParamsHash` (SHA-256 → first 16 bytes hex), `pageTokenKey`, `requestedPage`,
  `pageTokenGet/Put/Delete`; `handleSearch(requestUrl, env, fetchImpl, ctx)` resolves
  `page` for both `search.list` and playlist scope, stores `nextPageToken` at `N+1`
  (only when `page` is explicit), deletes a rejected token and retries page 1, and adds
  `page`, `hasPrev`, `hasNext`, `pageFallback`. `fetchYT` now surfaces
  `invalidPageToken` (400) and `fetchPlaylistItems` propagates it. `handleFetch` and
  `worker.fetch` accept `ctx` for `waitUntil`.
- `public/index.html`: `currentPage` state, `?page=N` in `currentStateToURL` (only > 1),
  clamped restore in `readStateFromURL`, `buildParams(page)` always sends the page to
  the API, `runSearch(page)` restores/aligned page state, Prev/Next move ±1 with
  `pushState`, new search/Apply/Reset return to page 1, refresh stays on the page,
  `pageFallback` replaces the URL with page 1 and shows a notice.
- `wrangler.toml`: `PAGE_TOKENS` KV binding (placeholder id until the deploy
  prerequisite is done).
- Docs: `README.md` (share/bookmark + `?page=`), `ARCHITECTURE-MAP.md` (binding,
  `/api/search` page contract, KV flow + hotspot), `.aaw/project.md`,
  `.aaw/constraints.md`, `.aaw/security.md`.

### Automated evidence (2026-11-09)

- `node --check worker.js` — PASS.
- Inline `<script>` extraction from `public/index.html` (`inline-1.js`, `inline-2.js`)
  + `node --check` — PASS (2/2 scripts compile).
- Page-token Node harness (mocked upstream + fake KV, no quota) — **14/14 PASS**:
  page 1 writes `:2` with `expirationTtl: 604800` and key shape
  `pt:v1:<32 hex>:2`; page 2 reads `:2`/writes `:3`; last page has no next; unvisited
  page → page 1 + `pageFallback:4` with exactly one upstream call (no walk); invalid
  stored token → key deleted + page 1 + fallback; no KV binding and throwing KV both
  degrade to page 1 with HTTP 200; legacy `pageToken` still stateless; `page` wins over
  `pageToken`; hash is order-independent, ignores `pageToken`, and changes for q/
  maxResults/order/videoDuration/publishedAfter; `page` clamps 0/-5/abc→1 and 999→20;
  playlist scope (UUSH) paginates through the same store (3 upstream pages per result
  page); cache HIT performs zero KV reads/writes and zero upstream calls. The harness
  asserts the API key never appears in a response body.
- Playwright/Chromium (static server + mocked `/api/*`, no quota) — **10/10 PASS**:
  first search stays on page 1 with no `page` in the URL while the API request carries
  `page=1`; Next → `?page=2`; reload restores page 2; Prev drops the param; Back/
  Forward restore pages; `?page=9` never visited → page 1 + "page 9 unavailable —
  showing page 1" + URL cleanup; new search resets to page 1; mobile 360px page 2 has
  no horizontal overflow; 0 console/page errors; every `/api/search` call sends `page`.
- `wrangler deploy --dry-run` — PASS: config parses, bindings are
  `env.PAGE_TOKENS (KV Namespace)` + `env.ASSETS`, bundle 41.23 KiB / gzip 10.84 KiB.
- `wrangler dev` local smoke — PASS: `/` 200, `/?q=test&page=2` 200,
  `/api/search?q=` 400, cross-origin `/api/search` 403 (no upstream call).

### HDT — PASS (user report 2026-11-09: "all test pass")

Covers the manual steps: search, Next → `?page=2`, reload keeps page 2, Prev drops
the param, Back/Forward restore pages, second-window page-2 URL, filter change →
page 1, unvisited page → page 1 + notice, no console/UI errors. Task moved to
`AWAITING_USER_REVIEW`; not complete until the user confirms no further changes.

### Security evidence

```text
Security level: Level 1 (targeted storage review)
Attack surface: /api/search page params -> KV keys; no new client input path
Skills/workflows used: targeted storage/secret review (no full pen-test)
Tools/tests executed: page-token harness (key shape, TTL, no key leakage, kv-down
  fallback), cache-hit check, dry-run binding inspection, grep for query in keys
Findings: keys contain only `pt:v1:` + 32 hex + page index; values are opaque tokens;
  no raw q/IP/identity persisted; failed KV never produces a 5xx
Remaining uncertainty: real KV propagation (~60 s cross-colo) and token expiry timing
  are only proven by the deployed HDT
```

## Affected Durable Artifacts

- `worker.js`, `public/index.html`, `wrangler.toml`
- `README.md` (share/bookmark sentence)
- `ARCHITECTURE-MAP.md` (KV binding + `/api/search` page contract)
- `.aaw/constraints.md`, `.aaw/security.md`, `.aaw/project.md` (server-side storage
  exception + capability)
- `.aaw/roadmap.md`, `.aaw/now.md`, this task record

## Commit Checkpoint

Suggested commit message:

```text
feat: remember search pagination with ?page= and KV page tokens
```

Commit status: `COMMITTED 2026-11-09`

## Handoff

COMPLETE 2026-11-09 (automated PASS + HDT PASS, committed). The `PAGE_TOKENS`
namespace id is configured in `wrangler.toml` (`62e70c2ab3234fdeb768e6bcc600a326`);
deploy with `npx wrangler deploy`. If a token page fails unexpectedly, check the KV key
(`pt:v1:<hash>:N`), the `pageFallback` marker, and that `page=1` is sent on the first
search. Local `wrangler dev` still uses local Miniflare KV.
