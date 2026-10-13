---
id: T-0006
type: feature
status: PLANNED
milestone: M-0002
size: MEDIUM
created: "2026-10-13"
updated: "2026-10-13"
hdt_requirement: REQUIRED
hdt_status: PENDING
cancellation_reason: null
---

# T-0006 — Results cards + view modes + scopebar + dates

## Objective

Readable grid/list results with channel, embed, and Invidious actions plus
fixed scope bar and relative dates.

## Size / Scope

### In Scope

- `public/index.html` + `public/styles.css` results:
  - Grid/List view toggle (per improve-1.png grid + improve-2.png list).
    Assumption: grid = thumbnail grid (~4 cols at 1500px); list = horizontal
    cards (~2 cols at 1500px); both collapse to 1 col on mobile. Confirm at
    implementation; persist choice in `localStorage`.
  - `card-meta` channel name links to the channel URL.
  - Every card (grid + list) links: title/thumb → watch URL, plus YT embed
    URL and `https://redirect.invidious.io/watch?v=VIDEO_ID` actions.
  - Grid: embed + Invidious icons overlaid in the thumbnail bottom corner
    (per improve-1.png arrows).
  - Dates: relative `{n} second/minute/hour/day/week/year ago`; `title`
    attribute = full human-readable date + time.
  - Scopebar fix: no empty bar on normal loads; only renders for
    `/?channel=CHANNEL_ID` scoping. Suspected root cause:
    `.scopebar { display:flex }` overrides `[hidden]` — add
    `.scopebar[hidden] { display:none }` (verify).
  - Responsive columns + touch-usable action targets.

### Out of Scope

- Filter panel itself (T-0005); Settings page (T-0007).

## Acceptance Criteria

- [ ] Grid and list modes match the screenshots; toggle persists; responsive to 1 col.
- [ ] Channel name in `card-meta` is a link to the channel.
- [ ] Both modes expose YT embed + Invidious URLs; grid shows them in the bottom corner.
- [ ] Dates read `… ago`; hover shows full date + time.
- [ ] No empty scopebar on plain `/`; `/?channel=UC…` still scopes with a visible bar.
- [ ] No console errors.

## Verification

```text
browser open / + search + toggle grid/list + hover dates + ?channel= scoping
```

HDT decision reason: visual/card/link/hover behavior needs human observation
per `dev/verification.md`. Effective `hdt_requirement: REQUIRED`.

## Notes / Evidence

Blocking edges: follows T-0005 CSS/layout contract; feeds no worker change
(embed/Invidious URLs are pure client-side `videoId` transforms).

## Affected Durable Artifacts

- `ARCHITECTURE-MAP.md`, `dev/roadmap.md`, milestone, `dev/now.md`

## Commit Checkpoint

```text
feat: results grid-list cards with channel embed invidious links
```

Commit status: `UNCOMMITTED`

## Handoff

Confirm grid/list column interpretation against improve-1.png / improve-2.png
before finalizing CSS; keep action-icon markup shared between modes.
