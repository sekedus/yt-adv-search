---
id: M-0003
status: IN_PROGRESS
created: "2026-10-15"
updated: "2026-10-22"
---

# M-0003 — Filter/topbar/settings neat pass

## Objective

Second UI polish pass: neater advanced filters + search placement, centered brand with mobile hamburger nav, neater settings defaults with merged save/reset. Follow-up T-0013 extends the pass with resolver links, scoped Shorts detection, an API origin gate, and mobile nav close-on-outside.

## In Scope

- T-0008 filter/topbar/settings work only.
- T-0009 mobile nav/focus follow-up.
- T-0010 quota-aware keys + result cache + playlist scope + keyboard/scroll UX.
- T-0011 favicon wiring + beginner README.
- T-0012 filter panel rework: Episode (Show) label/value `episode`, Features removed, Broadcasts (opt-in `eventType`) + four separate Definitions/Captions/Licenses/Dimensions panels (`videoDefinition`/`videoCaption`/`videoLicense`/`videoDimension`), Dates panel (After/Before), exclude words moved into the search bar, Advanced full width at every viewport, rev 7 clear ✕ on every text input (custom `input-clear.js`; input type stays `text`), rev 8 flexible Advanced → More rows at ≤720px.
- T-0013 follow-up: resolver image/title channel links + Invidious button + found/cached status with Refresh next to it (7-day channel cache); scoped Shorts detection (HEAD `www.youtube.com/shorts/<id>` first, `UUSH` API fallback, 1-day cache) with a card badge and `/shorts/<id>` links; `/api/*` own-origin gate (localhost + headerless allowed); transparent mobile-nav backdrop with close-on-outside; categories cached 1 month per region with no browser list cache and a region-change `fresh=1` refetch; q parsing where `%20`/literal spaces are spaces, `+` is a literal plus, whitespace-only q is accepted, and app URLs encode q with `%20`/`%2B`; resolver multi-check for bare names (`@handle`, `/user`, `/c`) with distinct-channel cards and exact explicit URL forms, using a fixed-host `/c/` page lookup.

## Out of Scope

- Authentication/per-user tokens, a Hide Shorts toggle, new upstream hosts/endpoints beyond the fixed Shorts HEAD probe and fixed `/c/` page resolver, or resolver/nav redesigns.
- Worker changes outside the T-0013 origin gate, Shorts probe, and requested channel/category cache tuning.

## Exit Criteria

- [x] T-0008 acceptance criteria pass + HDT PASS.
- [x] T-0009 acceptance criteria pass + HDT PASS.
- [x] T-0010 acceptance criteria pass + HDT PASS.
- [x] T-0011 acceptance criteria pass + HDT PASS.
- [x] T-0012 acceptance criteria pass + HDT PASS (PASS 2026-10-19).
- [x] T-0013 acceptance criteria pass + HDT PASS (PASS 2026-10-22).

## Tasks

- [x] T-0008 — Filter panel neat layout + topbar center/hamburger + settings merge (COMPLETE; HDT PASS 2026-10-16)
- [x] T-0009 — Mobile nav overlay fix + focus/autofocus + topbar/nav + stacked help + no-inline-style (COMPLETE; HDT PASS 2026-10-16)
- [x] T-0010 — Quota-aware keys + result cache + playlist scope + keyboard/scroll UX (COMPLETE; HDT PASS 2026-10-16)
- [x] T-0011 — Favicon wiring + beginner README (COMPLETE; HDT PASS 2026-10-15)
- [x] T-0012 — Broadcast, Dates + video-quality filter panels, Episode (Show) label, clear ✕ on text inputs (COMPLETE; HDT PASS 2026-10-19)
- [x] T-0013 — Resolver channel links + Invidious + multi-check (`/@`, `/user`, `/c`, `/channel`) + found/cached status + Refresh next to status, scoped Shorts badges + `/shorts/` links (HEAD-first + 1-day cache), `/api/*` origin gate, mobile nav backdrop/outside close, channel 7-day/category 1-month caches + search default 30 min, no browser category list + region-fresh refetch, clear × focus/aria-hidden fix, q `%20`/literal-space vs literal-plus parsing (COMPLETE; HDT PASS 2026-10-22; cache harness 7/7 + multi harness 15/15 + Playwright 9/9)

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
T-0012 COMPLETE (HDT PASS 2026-10-19, user report "all pass"); B-0001 COMPLETE (HDT PASS 2026-10-19).
T-0013 COMPLETE (HDT PASS 2026-10-22, user report "all test pass"); committed. Every task and exit criterion in M-0003 is satisfied. The milestone stays IN_PROGRESS until the user explicitly confirms closing it.
