# Verification Contract

> Initialized after discovery 2026-10-13. Keep it compact: how this project proves a change is correct.

## Purpose

Define the minimum credible evidence for moving work from `IMPLEMENTED` to `TESTED` or `VERIFIED` for a vanilla + Cloudflare Worker project with no build.

## Primary Checks

```text
node --check worker.js
```

Purpose: worker syntax is valid without deploying.

```text
npx wrangler dev --test-scheduled=false (smoke: GET /, /tools, /settings, /api/search?q=test, /api/channel?handle=fireship, /api/channel?url=android)
```

Purpose: routes serve, proxy forwards, rotation path executes (with test key or mocked upstream).

Render check: open each page in a modern browser, confirm no console errors and theme toggle works.

Purpose: static pages parse and run.

## Change -> Verification Matrix

| Change type | Minimum evidence | Extra evidence when applicable |
|---|---|---|
| docs/text | read back edited file | reviewer read |
| worker logic (`worker.js`) | `node --check` + wrangler smoke for touched endpoint | quota/rotation failure-path test (bad key → rotates; all bad → clean error) |
| UI (HTML/CSS/JS) | browser open + console-clean + interaction exercised | HDT when runtime/user interaction matters (search, filters, tools, settings — REQUIRED) |
| integration (YouTube API) | live or recorded upstream response mapped correctly | real-key smoke for at least one query per endpoint |
| security-sensitive (keys, proxy) | targeted review: no key in responses/logs + fixed-host egress | abuse test: oversized query, unknown operator, bad handle |
| architecture | affected smoke + code review | ADR when hard-to-reverse decision changes |

## Secondary Checks

| Check | Command | When required |
|---|---|---|
| Syntax | `node --check worker.js` | every worker change |
| Smoke | `npx wrangler dev` + curl/browser hits | every route/API change |
| Browser | manual open + console check | every UI change |
| Unit tests | none in v1 | n/a |
| Build | none (no build) | n/a |

## Manual / Runtime Verification

- Search `handle:fireship adobe` with filters → results scoped to Fireship, thumbnails/titles render.
- Tools: paste `https://www.youtube.com/@Fireship/videos` → shows `UCsBjURrPoezykLs9EqgamOA`. Bare `android` → two distinct channels (`Android` + legacy `android`); bare `chrome` → Google Chrome via `/c/chrome`; explicit `/@chrome` stays not found.
- Settings: change theme/max/enrichment → persists after reload.
- All-keys-bad → clean error, no key values leaked.

## Human Development Test (HDT)

See `.aaw/hdt.md`.

HDT is REQUIRED for T-0002, T-0003, T-0004 (real UI/runtime behavior). NOT_REQUIRED for pure worker plumbing only if wrangler smoke + review cover it (T-0001 default NOT_REQUIRED unless UI behavior changes).

## Completion Vocabulary

- `IMPLEMENTED` — code or project content exists.
- `TESTED` — at least one relevant check was executed.
- `VERIFIED` — all required checks for the task passed and expected behavior was confirmed with suitable evidence.
- `UNVERIFIED` — evidence is incomplete.

Resolve each task's `hdt_requirement` from this contract and record the reason in the task. A `REQUIRED` HDT blocks completion until PASS. Run agent checks yourself; do not ask users to repeat passed commands.
