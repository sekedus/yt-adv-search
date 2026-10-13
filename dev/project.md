# Project

## Purpose

One-page, lightweight, fast YouTube advanced search (`yt-adv-search`) using YouTube Data API v3 through a Cloudflare Worker proxy.

## Problem

YouTube.com removed useful search filters (Last Hour, Sort by Rating/Date) and Invidious is heavy for simple search. Users need fast filter-rich search with operators (`channel:`, `handle:`, `before:`/`after:`) and safe API-key handling.

## Scope

- Routes on one Worker: `/` search, `/tools` channel-ID resolver, `/settings` preferences. Shared vanilla CSS.
- Search page: Invidious-like bar + Filters (Upload date / Type / Duration / Features / Sort By + Apply) + results grid + pagination + theme toggle + enrichment opt-in.
- All `search.list` parameters implemented; re-added Last Hour, Sort Rating/Date, Movie/Show via API mappings; unmappable features shown disabled with tooltip.
- Operators resolved server-side: `channel:UC...`, `handle:@x`/`handle:x` via `channels.list forHandle`, `before:`/`after:` to `publishedBefore/After`.
- Tools page: paste URL / `@handle` / `UC...` / username → `channels.list` → ID + title + `Use in search`.
- Settings page (gear): theme, max results, safeSearch, region, language, enrichment opt-in, key-index status. `localStorage` persisted.
- Key rotation server-side: `YOUTUBE_API_KEYS=k1,k2` in `.env` local / Worker secrets prod, rotate on non-200.

## Out of Scope

- No login/accounts, no search history, no infinite scroll (Next/Prev cursors only).
- No Shorts-as-type filter in v1 (no API equivalent).
- No backend database.

## Tech Stack

- Language(s): vanilla HTML, CSS, JavaScript (no framework, no build)
- Framework(s): none
- Runtime: Cloudflare Workers (V8 isolates), modern evergreen browsers
- Database: none
- Build tools: none (optional `wrangler` for dev/deploy only)
- Test tools: manual browser HDT + `node --check` for worker syntax; no unit framework in v1

## Project Constraints

- Keys never reach the browser; see `dev/constraints.md` and `dev/security.md`.
- Enrichment (`videos.list` duration/views) OFF by default to save quota.

## Success Criteria

- Search with filters returns correct `search.list` results through the proxy with no key leak.
- `handle:@fireship` resolves to `UCsBjURrPoezykLs9EqgamOA` and scopes results.
- Re-added filters (Last Hour, Rating/Date sort) produce ordered/filtered results via API.
- Pages load as single static assets with auto-dark theme.

## Discovery Status

COMPLETE (grill 2026-10-13, confirmed by user)
