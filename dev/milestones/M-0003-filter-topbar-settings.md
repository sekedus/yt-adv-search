---
id: M-0003
status: IN_PROGRESS
created: "2026-10-15"
updated: "2026-10-16"
---

# M-0003 — Filter/topbar/settings neat pass

## Objective

Second UI polish pass: neater advanced filters + search placement, centered brand with mobile hamburger nav, neater settings defaults with merged save/reset.

## In Scope

- T-0008 filter/topbar/settings work only.
- T-0009 mobile nav/focus follow-up.
- T-0010 quota-aware keys + result cache + playlist scope + keyboard/scroll UX.

## Out of Scope

- Worker/API, results cards, new endpoints.

## Exit Criteria

- [x] T-0008 acceptance criteria pass + HDT PASS.
- [x] T-0009 acceptance criteria pass + HDT PASS.
- [x] T-0010 acceptance criteria pass + HDT PASS.

## Tasks

- [x] T-0008 — Filter panel neat layout + topbar center/hamburger + settings merge (COMPLETE; HDT PASS 2026-10-16)
- [x] T-0009 — Mobile nav overlay fix + focus/autofocus + topbar/nav + stacked help + no-inline-style (COMPLETE; HDT PASS 2026-10-16)
- [x] T-0010 — Quota-aware keys + result cache + playlist scope + keyboard/scroll UX (COMPLETE; HDT PASS 2026-10-16)

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
