---
id: T-0003
type: feature
status: COMPLETE
milestone: M-0001
size: SMALL
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: REQUIRED
hdt_status: PASS
cancellation_reason: null
---

# T-0003 — Tools page (channel resolver)

## Objective

Separate `/tools` page resolving channel URL / handle / ID / username to channel ID via `/api/channel`.

## Size / Scope

### In Scope

- `tools.html` reusing shared header/CSS: input, Resolve button, result (ID, title, thumbnail, `Use in search` link to `/?channel=...`).
- Accept `https://www.youtube.com/@Fireship/videos`, `@fireship`, `fireship`, `UCsBjURrPoezykLs9EqgamOA`, legacy username.
- Clean errors for unknown handles; no key values shown.

### Out of Scope

- Search filters/results (T-0002); settings (T-0004).

## Acceptance Criteria

- [x] `@Fireship` URL pasted resolves to `UCsBjURrPoezykLs9EqgamOA` with title/thumbnail.
- [x] `Use in search` prefills search scoped to that channel.

## Verification

```text
browser open /tools + console check + resolve cases (URL, @handle, bare, UC id, bad input)
```

HDT decision reason: runtime UI behavior; needs human-observed resolve per `.aaw/verification.md`. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: blocked by T-0001. Independent of T-0002 except shared CSS.

Automated verification (run by agent):

- `node --check worker.js` — PASS (worker untouched).
- Static checks 25/25 PASS (script removed after run): inline scripts parse;
  all referenced ids exist, no dupes; shared header/CSS contract with `/`
  (topbar, nav, theme toggle, settings link, `ytadv.theme`); Tools marked
  current in nav; kind select (auto/id/handle/username) maps 1:1 to
  `/api/channel` params; `Use in search` links `/?channel=<id>` (matches
  T-0002 link-in contract); result rendered via `textContent`/DOM only.
- Live `wrangler dev` smoke: `GET /tools` → 200 real page; `/api/channel`
  (no params) → 400 clean JSON.

HDT: REQUIRED — PASS (user report 2026-10-13: URL/@handle/bare/ID cases all
resolve; nonsense handle returns clean 404 `{"error":...}` as designed — no
key material; `Use in search` scopes + auto-runs; zero console errors).
Task COMPLETE; moved to done/.

## Affected Durable Artifacts

- `ARCHITECTURE-MAP.md` (resolver section), `.aaw/roadmap.md`, milestone, `.aaw/now.md`

## Commit Checkpoint

```text
feat: tools channel resolver page
```

Commit status: `UNCOMMITTED`

## Handoff

Needs `/api/channel` from T-0001.
