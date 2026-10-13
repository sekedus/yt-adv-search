# Project Constraints

Use this file for constraints that materially affect technical decisions.

## Runtime / Platform Baseline

- Runtime: Cloudflare Workers (V8 isolates, no Node APIs unless compatible).
- OS/platform: any hosting the Worker; local dev via `wrangler dev` with `.env`.
- Browsers: modern evergreen (Chrome, Edge, Firefox, Safari) with `prefers-color-scheme`, `localStorage`, `fetch`.
- Mobile platforms: responsive single-column layout, no native app.

## Compatibility / Legacy

- Minimum supported runtime version: Cloudflare Workers runtime (no version pin in v1).
- Minimum browser version(s): evergreen last 2 years; no IE/legacy polyfills.
- Legacy support policy: none beyond evergreen.

**Do not** invent additional legacy support beyond this policy.

## Resource Constraints

- Memory: keep DOM light; paginate (max 50/page, default 25); lazy-load thumbnails.
- CPU: no client build step; vanilla JS parsing only.
- Offline requirements: none (requires live YouTube API).
- External service limitations: YouTube Data API v3 quotas — `search.list` 100 calls/day bucket, `channels.list`/`videos.list` from 10k pool; enrichment OFF by default; rotate keys on non-200.

## Security Constraints

- `YOUTUBE_API_KEYS` server-only (`.env` local, Worker secrets prod); never embed in HTML/JS responses.
- Proxy only to fixed `https://www.googleapis.com/youtube/v3/*`; no open-fetch proxy.
- No auth/session in v1; no user data stored server-side.

## Deployment Constraints

- Stored on Cloudflare Worker; `.env` for local only (`YOUTUBE_API_KEYS=k1,k2` comma-separated).
- Static routes `/`, `/tools`, `/settings` + API `/api/search`, `/api/channel` from one Worker.
