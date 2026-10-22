---
id: T-0002
type: feature
status: COMPLETE
milestone: M-0001
size: MEDIUM
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: REQUIRED
hdt_status: PASS
cancellation_reason: null
---

# T-0002 — Search page (filters, results, theme)

## Objective

Invidious-like `/` page: bar, Filters panel + Apply, results grid, Next/Prev, theme toggle, enrichment opt-in.

## Size / Scope

### In Scope

- `index.html` + shared `styles.css`: header (bar, theme toggle, gear → `/settings`, Search|Tools nav), collapsible Filters (date incl. Last Hour, type incl. Movie/Show, duration, features with disabled tooltips, sort incl. Rating/Date), Apply button, results cards, pager.
- Client builds `/api/search` query from bar + filters + `pageToken`; default `maxResults=25` (5/10/25/50), `order=relevance`, `safeSearch=moderate`.
- Enrichment checkbox OFF default, mirrored with Settings, `localStorage` persisted.
- Auto theme (dark default) + manual toggle persisted.

### Out of Scope

- Worker internals (T-0001); Tools/Settings pages (T-0003/T-0004) except shared header/CSS contract.

## Acceptance Criteria

- [x] Filters map to API params; unmappable show disabled with tooltip; Shorts omitted.
- [x] `handle:fireship adobe` shows Fireship-scoped results; duration badge only when enrichment ON.
- [x] Theme auto-dark works; toggle persists; no console errors.

## Verification

```text
browser open / + console check + filter/operator/pager interactions
node --check worker.js (if touched)
```

HDT decision reason: real UI/runtime behavior per `.aaw/verification.md`; automated checks cannot prove rendering/filter feel. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: blocked by T-0001; blocks T-0004 (shared header/CSS contract).

Automated verification (run by agent):

- `node --check worker.js` — PASS (worker untouched).
- Static checks 36/36 PASS (script removed after run): inline scripts parse;
  all referenced element ids exist, no duplicate ids; 4K/360/HDR disabled with
  tooltips; no Shorts option; Rating/Date/Last-Hour/Movie/Show options present;
  API text rendered via `textContent` (no unescaped `innerHTML` with snippets);
  CSS theme contract (`data-theme` auto/dark/light, shared classes/vars);
  `localStorage` keys (`ytadv.theme/maxResults/order/enrich/safeSearch/region/lang`);
  `?channel=`/`?channelId=` link-in contract for T-0003.
- Live `wrangler dev` smoke (port 8788, dummy keys): `GET /` → 200 real
  `index.html` (searchForm + filtersPanel present); `GET /styles.css` → 200 CSS
  (ASSETS binding works); `/api/search` (no q) → 400 clean JSON.
- XSS check: titles/descriptions/thumbnail alts set via `textContent`/`.src`
  with URLs built by `encodeURIComponent`; only escaped static skeleton in
  `innerHTML`.

Contracts set for later tasks:

- Shared CSS: `public/styles.css` (`.topbar/.container/.card/.results/.pager`,
  theme vars). Copy the `<head>` theme-init snippet + header markup for
  `/tools` (T-0003) and `/settings` (T-0004).
- Prefs keys: `ytadv.theme|order|safeSearch|region|lang|enrich` (settings mirrors
  `maxResults` too). Enrichment OFF default.
- Tools link-in: `/?channel=UC…` scopes + auto-runs; `/?q=` prefills.

HDT: REQUIRED — PASS (user report 2026-10-13: all manual steps passed —
scoped search, filters + enrichment badges, disabled tooltips, pager, theme
persistence, zero console errors). Task COMPLETE; moved to done/.

## Affected Durable Artifacts

- `README.md` (if user-visible behavior changes)
- `ARCHITECTURE-MAP.md`, `.aaw/roadmap.md`, milestone, `.aaw/now.md`

## Commit Checkpoint

```text
feat: search page with invidious-like filters
```

Commit status: `UNCOMMITTED`

## Handoff

Needs T-0001 endpoints live (or mocked) before HDT.
