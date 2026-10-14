---
id: M-0002
status: ACTIVE
created: "2026-10-13"
updated: "2026-10-14"
---

# M-0002 — Improve UI/UX

## Objective

Polish search + results + settings UI/UX: wider layout, shareable filter URLs,
clearer filter/settings copy, view-mode cards with channel/embed/Invidious
links and relative dates, fixed scope bar, and responsive behavior.

## In Scope

- Search header/layout: container 1500px, searchform max 600px centered,
  filter ↔ URL sync, filter panel open on homepage/first load, vertical
  checkbox/radio stacking, Sort-by + SafeSearch as radios, clearer enrich
  copy, operators block in filter panel, extra advanced filters if feasible
  (see yt-more-advanced.png), responsive.
- Results: grid/list view modes, channel URL in `card-meta`, YT embed +
  `redirect.invidious.io` links in both modes (bottom-corner overlay in grid),
  relative dates (`{n} … ago`) with full-date hover title, scopebar empty fix,
  responsive columns.
- Settings: region/lang ISO hints, proxy-status section split with Save/Reset,
  colored status (green success / red fail), responsive.

## Out of Scope

- New API endpoints, key-rotation changes, Tools page changes, login/history,
  infinite scroll, database.

## Exit Criteria

- [ ] 1500px container + 600px centered searchform; usable responsive down to 360px.
- [ ] Filters sync to URL (shareable/bookmarkable); panel open on first load with no results.
- [ ] Filter options stack vertically; Sort-by + SafeSearch are radios; enrich copy states quota cost; operators visible in panel.
- [ ] Advanced-filter feasibility decided (YT API vs client-side post-filter); implemented or explicitly dropped with reason.
- [ ] Grid/list view modes work per screenshots; channel/embed/Invidious links present in both; grid overlays in bottom corner.
- [ ] Dates render relative with full human-readable hover title.
- [ ] Scopebar hidden (no empty bar) except `/?channel=CHANNEL_ID` scoping.
- [ ] Settings show ISO 3166-1 / ISO 639-1 hints, split Save/Reset sections, colored proxy status.
- [ ] `node --check worker.js` (if touched) + route smoke + console-clean + required HDTs pass.

## Tasks

- [x] T-0005 — Search layout + filter panel UX (COMPLETE; HDT PASS)
- [ ] T-0006 — Results cards + view modes + scopebar + dates
- [ ] T-0007 — Settings polish + global responsive

## Related Parking-Lot Ideas

None — parking lot empty at planning time (reviewed 2026-10-13).

## Constraints / Decisions

- Vanilla, no build; `YOUTUBE_API_KEYS` server-only; enrichment stays opt-in OFF default.
- Assumption to confirm at implementation: grid = multi-column thumbnail grid
  (improve-1.png, ~4 cols at 1500px), list = horizontal cards (improve-2.png,
  ~2 cols at 1500px) with a Grid/List toggle; both collapse to 1 col on mobile.
- Advanced filters (yt-more-advanced.png: upload year, hide Shorts/watched,
  duration min/max, min views, hide titles/channels): YT API has no native
  support for most; default to client-side post-filter where feasible without
  extra quota, else drop with reason.
- Scopebar empty-bar root cause (to verify): `.scopebar { display:flex }`
  overrides `[hidden]` — needs `.scopebar[hidden] { display:none }`.

## Notes

Planning-only. Child tasks are PLANNED. No implementation started.
