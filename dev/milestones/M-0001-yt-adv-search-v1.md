---
id: M-0001
status: COMPLETE
created: "2026-10-13"
updated: "2026-10-13"
---

# M-0001 — yt-adv-search v1

## Objective

Working search + tools + settings on one Cloudflare Worker with key-hiding rotation and Invidious-like filtering.

## In Scope

- Worker proxy with rotation and operator resolution
- Search page with full + re-added filters and pagination
- Tools resolver page
- Settings page with persistence

## Out of Scope

- Login, history, infinite scroll, Shorts filter, database

## Exit Criteria

- [x] Search via proxy returns scoped results with no key leak
- [x] `handle:fireship` scopes to Fireship channel
- [x] Re-added filters (Last Hour, Rating/Date) work via API
- [x] Tools resolves `@Fireship` URL to `UCsBjURrPoezykLs9EqgamOA`
- [x] Settings persist; theme auto-dark; enrichment OFF default
- [x] `node --check` + wrangler smoke + required HDTs pass

## Tasks

- [x] T-0001 — Worker proxy + key rotation + operator resolution
- [x] T-0002 — Search page (filters, operators client, results, theme)
- [x] T-0003 — Tools page (channel resolver)
- [x] T-0004 — Settings page + header/nav polish

## Related Parking-Lot Ideas

None — parking lot empty at planning time.

## Constraints / Decisions

- Vanilla, no build; `YOUTUBE_API_KEYS` server-only; enrichment opt-in OFF; see `dev/project.md`, `dev/security.md`, `dev/verification.md`.

## Notes

Planning-only. Child tasks are PLANNED. No implementation started.
