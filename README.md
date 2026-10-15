# yt-adv-search

Fast, lightweight YouTube advanced search using YouTube Data API v3 through a key-hiding Cloudflare Worker.

## Why

YouTube removed Last Hour and Rating/Date sorting; Invidious is heavy for quick filtered search. This restores those filters via the API with `channel:` / `handle:` / date operators.

## What it does (v1)

- Search page `/`: Invidious-like bar + Filters (date, type, duration, features, sort) + results + Next/Prev.
- Filters sync to the URL (shareable/bookmarkable; back/forward restores) and include Advanced filters with full `search.list` coverage plus per-control help.
- Operators: `channel:UC...`, `handle:@fireship`, `before:`/`after:` resolved server-side.
- Tools page `/tools`: paste channel URL / handle / username → channel ID (e.g. `@Fireship` → `UCsBjURrPoezykLs9EqgamOA`).
- Settings page `/settings` (gear): theme Auto/Dark/Light, page size, SafeSearch, region/language, duration+views opt-in, max result-cache time.
- Auto theme, dark default. No login.

## Architecture

Browser → Worker `/api/search`, `/api/channel` → Google. Keys in `YOUTUBE_API_KEYS=key1,key2` (`.env` local, Worker secrets prod), rotated server-side on non-200. Vanilla HTML/CSS/JS, no build.

## Run / use

- Local: `npx wrangler dev` with `.env` containing `YOUTUBE_API_KEYS`.
- Deploy: set Worker secret `YOUTUBE_API_KEYS`, deploy Worker serving `/`, `/tools`, `/settings`, `/api/*`.

## Constraints

- Evergreen browsers only; no offline use; YouTube quotas apply (`search.list` 100/day bucket).
- Secrets never leave the Worker; enrichment call OFF by default.

## Docs

- `dev/project.md` – scope and stack.
- `ARCHITECTURE-MAP.md` – where code lives.
- `dev/verification.md` – how changes are proven.
- `dev/roadmap.md` – milestones and tasks.
