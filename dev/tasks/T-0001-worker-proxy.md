---
id: T-0001
type: feature
status: PLANNED
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
- Operator resolution: `channel:UC...` → `channelId`; `handle:@x`/`handle:x` → `channels.list forHandle` → `channelId`; `before:`/`after:` → `publishedBefore/After`; unknown `a:b` stays in `q`.
- Full `search.list` param allow-list forwarding; optional `videos.list` enrichment path when `enrich=true`.
- Fixed-host egress to `www.googleapis.com` only.

### Out of Scope

- Page markup/CSS (T-0002..T-0004); enrichment UI toggle; persistence.

## Acceptance Criteria

- [ ] `GET /api/search?q=handle:fireship+adobe` scopes via resolved `UCsBjURrPoezykLs9EqgamOA`.
- [ ] Bad first key rotates to second; all-bad returns clean error without leaking keys.
- [ ] `before:/after:` map to `publishedBefore/After`; unknown operators stay literal.

## Verification

```text
node --check worker.js
npx wrangler dev (smoke: /, /tools, /settings, /api/search?q=test, /api/channel?handle=fireship)
```

HDT decision reason: no UI/runtime behavior in this task; smoke + secrets review cover it per `dev/verification.md`. Effective `hdt_requirement: NOT_REQUIRED`.

## Notes / Evidence

Blocking edges: blocks T-0002, T-0003. Blocked by: none.

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
