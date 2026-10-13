---
id: T-0001
type: feature
status: COMPLETE
milestone: M-0001
size: MEDIUM
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: NOT_REQUIRED
hdt_status: NOT_APPLICABLE
cancellation_reason: null
---

# T-0001 — Worker proxy + key rotation + operator resolution

## Objective

Serve static routes and proxy `/api/search` + `/api/channel` to YouTube v3 with server-side key rotation and operator resolution.

## Size / Scope

### In Scope

- `worker.js`: static serving for `/`, `/tools`, `/settings`; `GET /api/search`, `GET /api/channel`.
- Parse `YOUTUBE_API_KEYS=k1,k2` (comma, trim); try in order; rotate on non-200/quota; clean error when all fail (no key values in responses/logs).
- Operator resolution: `channel:UC...` → `channelId`; `handle:@x`/`handle:x` → `channels.list forHandle` → `channelId`; `user:NAME` → `channels.list forUsername` → `channelId`; `before:`/`after:` → `publishedBefore/After`; unknown `a:b` stays in `q`.
- Full `search.list` param allow-list forwarding; optional `videos.list` enrichment path when `enrich=true`.
- Fixed-host egress to `www.googleapis.com` only.

### Out of Scope

- Page markup/CSS (T-0002..T-0004); enrichment UI toggle; persistence.

## Acceptance Criteria

- [x] `GET /api/search?q=handle:fireship+adobe` scopes via resolved `UCsBjURrPoezykLs9EqgamOA`; `user:USERNAME` resolves via `forUsername` the same way.
- [x] Bad first key rotates to second; all-bad returns clean error without leaking keys.
- [x] `before:/after:` map to `publishedBefore/After`; unknown operators stay literal.

## Verification

```text
node --check worker.js
npx wrangler dev (smoke: /, /tools, /settings, /api/search?q=test, /api/channel?handle=fireship)
```

HDT decision reason: no UI/runtime behavior in this task; smoke + secrets review cover it per `dev/verification.md`. Effective `hdt_requirement: NOT_REQUIRED`.

## Notes / Evidence

Blocking edges: blocks T-0002, T-0003. Blocked by: none.

Automated verification (run by agent):

- `node --check worker.js` — PASS.
- Mocked unit checks (32/32 PASS, script removed after run): operator parsing
  (`channel:`/`handle:`/`user:`/`before:`/`after:`, unknown `a:b` literal, bad
  date literal), `parseChannelRef` (UC id, `@handle`, `/channel/`, `/@`, `/user/`),
  egress guard (bad path rejected, base fixed to
  `https://www.googleapis.com/youtube/v3`), rotation recovery (403 then 200),
  all-bad 502 clean with no key values in body, `handle:` scoping to
  `UCsBjURrPoezykLs9EqgamOA`, `user:` via `forUsername`, upstream `q` keeps
  unknown operators, date mapping to `publishedBefore/After`, `/api/channel`
  handle resolution, static `/`, `/tools`, `/settings` 200 HTML, unknown 404,
  no-keys 500.
- Live `wrangler dev` smoke (dummy keys `SMOKE_DUMMY_KEY_*`): `GET /`, `/tools`,
  `/settings` → 200 HTML; `/nope` → 404; `/api/search` (no q) → 400
  `{"error":"Missing q ..."}`; `/api/search?q=test` → 502 clean after rotating
  both dummy keys (upstream 400); `/api/channel?handle=fireship` → 502 clean
  after rotation. No key values in any response body.

Security (Level 1, targeted review per `dev/security.md`):

- Secrets: keys only in `env.YOUTUBE_API_KEYS`, injected server-side as `key=`
  over HTTPS; never reflected in responses; worker emits no logs with key
  material (no `console.*` calls).
- Egress: fixed `https://www.googleapis.com/youtube/v3` + path allow-list
  (`/search`, `/channels`, `/videos`); user `url=` input is parsed, never fetched.
- Validation: `search.list` allow-list forwarding (`key`/`enrich`/`part` never
  forwarded, `part` forced); `q` max 500, `url` max 1000, handle/username caps;
  `maxResults` clamped 1–50 (default 25); missing `q`+`channelId` → 400 without
  touching quota; bad handle → 404 clean.
- Remaining uncertainty: real-key quota rotation timing not exercised (would
  spend quota); mocked + dummy-key rotation is the credible proxy.

HDT: NOT_REQUIRED — pure worker plumbing; smoke + secrets review cover it per
`dev/verification.md`. No UI/runtime behavior in this task.

## Affected Durable Artifacts

- `ARCHITECTURE-MAP.md` (Worker API section when code lands)
- `dev/roadmap.md`, linked milestone, `dev/now.md`

## Commit Checkpoint

```text
feat: worker proxy with key rotation and operator resolution
```

Commit status: `UNCOMMITTED`

## Handoff

Start here first; T-0002/T-0003 need its endpoints.
