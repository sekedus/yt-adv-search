---
id: M-0003
status: IN_PROGRESS
created: "2026-10-15"
updated: "2026-10-19"
---

# M-0003 — Filter/topbar/settings neat pass

## Objective

Second UI polish pass: neater advanced filters + search placement, centered brand with mobile hamburger nav, neater settings defaults with merged save/reset.

## In Scope

- T-0008 filter/topbar/settings work only.
- T-0009 mobile nav/focus follow-up.
- T-0010 quota-aware keys + result cache + playlist scope + keyboard/scroll UX.
- T-0011 favicon wiring + beginner README.
- T-0012 filter panel rework: Episode (Show) label/value `episode`, Features removed, Broadcasts (opt-in `eventType`) + four separate Definitions/Captions/Licenses/Dimensions panels (`videoDefinition`/`videoCaption`/`videoLicense`/`videoDimension`), Dates panel (After/Before), exclude words moved into the search bar, Advanced full width at every viewport, rev 7 clear ✕ on every text input (custom `input-clear.js`; input type stays `text`), rev 8 flexible Advanced → More rows at ≤720px.

## Out of Scope

- Worker/API, results cards, new endpoints.

## Exit Criteria

- [x] T-0008 acceptance criteria pass + HDT PASS.
- [x] T-0009 acceptance criteria pass + HDT PASS.
- [x] T-0010 acceptance criteria pass + HDT PASS.
- [x] T-0011 acceptance criteria pass + HDT PASS.
- [x] T-0012 acceptance criteria pass + HDT PASS (PASS 2026-10-19).

## Tasks

- [x] T-0008 — Filter panel neat layout + topbar center/hamburger + settings merge (COMPLETE; HDT PASS 2026-10-16)
- [x] T-0009 — Mobile nav overlay fix + focus/autofocus + topbar/nav + stacked help + no-inline-style (COMPLETE; HDT PASS 2026-10-16)
- [x] T-0010 — Quota-aware keys + result cache + playlist scope + keyboard/scroll UX (COMPLETE; HDT PASS 2026-10-16)
- [x] T-0011 — Favicon wiring + beginner README (COMPLETE; HDT PASS 2026-10-15)
- [x] T-0012 — Broadcast, Dates + video-quality filter panels, Episode (Show) label, clear ✕ on text inputs (COMPLETE; HDT PASS 2026-10-19)

## Related Parking-Lot Ideas

None reviewed yet for this milestone.

## Constraints / Decisions

- Vanilla, no build; keep `ytas.*` keys and shared CSS class contracts.
- Brand centering must not break 1500px container or 360px mobile.

## Notes

Created 2026-10-15 from user edit list + improve-4.png reference.
T-0008 COMPLETE (HDT PASS 2026-10-16).
M-0003 REOPENED 2026-10-16 for T-0009 follow-up; milestone completes only on explicit user confirmation.
T-0009 COMPLETE (HDT PASS 2026-10-16) — committed; milestone left open per user instruction.
T-0012 created 2026-10-19 from user filter-panel list; user confirmed (2026-10-19) removing the six superseded Advanced → More rows and starting implementation immediately. Implementation + automated evidence done 2026-10-19 (rev 6 after review: exclude words in the search bar, Advanced full width; rev 7 after review: clear ✕ on every text input via `public/input-clear.js`, input type stays `text`; results-card meta RTL bug fixed as B-0001; rev 8 after review with a before/after sketch: flexible Advanced → More rows at ≤720px — compact controls inline, wide fields full-width below the label); rev 9 (doc audit vs YouTube search.list/videos.list/videoCategories.list): param chain verified conformant, hardening ideas parked as PL-0001..PL-0004.
T-0012 COMPLETE (HDT PASS 2026-10-19, user report "all pass"); B-0001 COMPLETE (HDT PASS 2026-10-19). Every M-0003 task and exit criterion is satisfied — the milestone stays IN_PROGRESS until the user explicitly confirms closing.
