# Project Context

This file stores durable domain vocabulary and terminology agreed during discovery and implementation.

Do not use this file as a task list, implementation log, or general project diary.

## Domain Terms

- **Channel ID** — YouTube `UC...` identifier. Resolved server-side, never typed manually when a handle/URL is known.
- **Handle** — `@fireship` form, with or without `@`. Resolved via `channels.list forHandle` to a Channel ID.
- **Operator** — Prefix in the search box scoped to resolution, e.g. `channel:UC...`, `handle:@fireship`, `before:YYYY-MM-DD`, `after:YYYY-MM-DD`. Unknown `foo:bar` stays literal query text.
- **Filter** — UI control mapping to a `search.list` parameter (date → `publishedAfter/Before`, duration → `videoDuration`, etc.).
- **Re-added filter** — Filter YouTube.com removed in Jan 2026 but this project restores via API: Last Hour, Sort by Rating/Date, Movie/Show.
- **Key rotation** — Trying `YOUTUBE_API_KEYS` in order and advancing on any non-200/quota error. Keys live only in Worker secrets / local `.env`, never in browser JS.
- **Tools page** — Separate `/tools` route for the Channel-ID resolver, distinct from the one-page search UI.

## Important User/Business Concepts

- **Opt-in enrichment** — Extra `videos.list` call for duration/view count is OFF by default and only runs when the user enables it, to save quota.
- **Settings page** — Separate `/settings` route opened by the gear button; holds theme, defaults, and the enrichment opt-in. Persisted in `localStorage`.

## Naming Decisions

- [Term] must be called `[preferred term]` throughout the project.
