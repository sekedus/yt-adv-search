---
id: T-0003
type: feature
status: PLANNED
milestone: M-0001
size: SMALL
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: REQUIRED
hdt_status: NOT_STARTED
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

- [ ] `@Fireship` URL pasted resolves to `UCsBjURrPoezykLs9EqgamOA` with title/thumbnail.
- [ ] `Use in search` prefills search scoped to that channel.

## Verification

```text
browser open /tools + console check + resolve cases (URL, @handle, bare, UC id, bad input)
```

HDT decision reason: runtime UI behavior; needs human-observed resolve per `dev/verification.md`. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: blocked by T-0001. Independent of T-0002 except shared CSS.

## Affected Durable Artifacts

- `ARCHITECTURE-MAP.md` (resolver section), `dev/roadmap.md`, milestone, `dev/now.md`

## Commit Checkpoint

```text
feat: tools channel resolver page
```

Commit status: `UNCOMMITTED`

## Handoff

Needs `/api/channel` from T-0001.
