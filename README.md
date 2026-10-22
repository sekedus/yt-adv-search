# yt-adv-search

<picture>![GitHub repo size](https://img.shields.io/github/repo-size/sekedus/yt-adv-search?label=Size)</picture>
[![GitHub License](https://img.shields.io/github/license/sekedus/yt-adv-search?label=License)](./LICENSE)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/sekedus/yt-adv-search)

<details>
<summary><strong>Preview</strong></summary>

<picture>![yt-adv-search screenshot](./assets/yt-adv-search.png)</picture>
</details>

<br>

A fast, simple YouTube search page with filters that YouTube itself removed – like **Last Hour** and **sort by Rating/Date** – plus handy shortcuts for searching inside one channel or playlist.

No login. No build step. Just open it in your browser and search.

<br>

## What can you do with it?

- **Search page (`/`)** – type a query and optional exclude words in the search bar (any text field has a small ✕ to clear it), open **Filters** to narrow by upload date or an exact date range, type, duration, broadcast status, four video-quality panels (definitions, captions, licenses, dimensions), and sort order. Filters become part of the page URL, so you can bookmark or share a search. Inside a channel or playlist, detected Shorts get a **Shorts** badge.
- **Search shortcuts** – type these right in the search box:
  - `channel:UCK8sQmJBp8GCxrOtXWBpyEA space` – search inside one channel
  - `handle:@madebygoogle health` – same, using a channel's @handle
  - `user:youtube dance` – same, using a legacy username
  - `playlist:PLbpi6ZahtOH57M7nNfcy_eAOdtptnAYX8 lego` – search inside one playlist
  - `after:2024-01-01 before:2024-06-01 watch` – only videos from that date range
- **Tools page (`/tools`)** - paste a channel URL, `@handle`, ID, legacy username, or bare name and get its channel ID, with channel links, an Invidious button, and a button to use it in search. A bare name checks `@name`, `/user/name`, and `/c/name` and shows every distinct channel it finds, with the matching forms on each card; explicit URLs and selected kinds resolve that one form. `/c/` names are resolved from the fixed YouTube channel page. The status shows the found channel (or the number of channels) and marks it `(cached)` on a cache hit; a **Refresh** button next to it bypasses the 7-day resolver cache.
- **Settings page (`/settings`)** - pick theme (Auto/Dark/Light), page size, SafeSearch, region, language, and how long search results may be cached (default 30 minutes). Channel lookups (7 days) and categories (1 month) use fixed cache times. Settings are stored in your browser only.

<br>

## How it works

```
Your browser → Cloudflare Worker → YouTube's official API → back to you
```

Your YouTube API keys live **only on the Worker** (never in the web page).

The Worker forwards your search to Google, rotates through your keys if one fails, skips quota-exhausted keys until midnight UTC, and caches repeat searches for 30 minutes by default to save quota. Channel lookups are cached for 7 days and the category list for 1 month; the category list for a new region is fetched fresh when the Region setting changes. Its API refuses requests coming from other websites' pages (localhost is allowed for development), so other sites cannot use your quota. Shorts badges use a lightweight HEAD check first and only fall back to the API when that is inconclusive. Resolver multi-check reads a fixed YouTube channel page for `/c/` names (no cookies or API key) and keeps all other resolver egress on the Google API; a bare name may therefore take a moment on its first lookup. Search links encode a space in the `q` parameter as `%20`; a raw `+` is treated as a plus (use `%20` for spaces), not a space.

<br>

## Getting started

### Prerequisites

- **Cloudflare account** ([login/sign-up](https://dash.cloudflare.com)).
- **Node.js 22+** ([download](https://nodejs.org/en/download/)).
- **Git** ([download](https://git-scm.com/downloads)).
- **YouTube Data API v3 key**.

### Get a YouTube API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and sign in.
2. Create a project (any name, e.g. `yt-adv-search`).
3. Open **APIs & Services** → **Library**, find **YouTube Data API v3**, click **Enable**.
4. Open **APIs & Services** → **Credentials** → **Create Credentials** → **API key**.
5. Provide a **Name** → **Select API restrictions** → check **YouTube Data API v3** → **Create**.
6. Copy the key (a long string like `AIzaSy...`).

You can add more keys later, separated by commas – the app rotates through them automatically.

<br>

## Get running

Choose the method that suits you best. All three give you the same result: a working page with search filters, tools, and settings.

---

### Option A: Deploy button

Click the button below to deploy straight from the Cloudflare dashboard:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/sekedus/yt-adv-search)

1. You'll be taken to the **Cloudflare dashboard**.
2. Connect your **GitHub** account.
3. Give it a name (e.g. `yt-adv-search`) and click **Deploy**.
4. Wait until the build finishes, then add your API key as described in [Add your API key](#add-your-api-key-all-methods).

---

### Option B: Via the Cloudflare dashboard

1. Fork this repository to your GitHub account.
2. In the Cloudflare dashboard, go to **Workers & Pages** and click **Create application**.
3. Connect your GitHub account, select the forked repository, and click **Deploy**.
4. Wait until the build finishes, then add your API key as described in [Add your API key](#add-your-api-key-all-methods).

---

### Option C: From your local PC

Run the app on your own computer – good for trying things out before going online:

```text
git clone https://github.com/sekedus/yt-adv-search
cd yt-adv-search
cp .env.example .env
```

Then open `.env` in any text editor and paste your key:

```text
YOUTUBE_API_KEYS=YourYoutubeApiKeyV3Here
```

(For two keys: `YOUTUBE_API_KEYS=key1,key2`. This file is git-ignored – your keys never get committed.)

Start it:

```text
npx wrangler dev
```

Open the address it prints (usually http://localhost:8787), type something like `handle:@madebygoogle fold`, and press **Search**. That's it.

To publish online later:

```text
npx wrangler login
npx wrangler secret put YOUTUBE_API_KEYS
npx wrangler deploy
```

The second command stores your key(s) safely on Cloudflare (paste when asked). The third publishes the app – search, tools, settings, and API all come from the one Worker.

---

### Add your API key

The app can't search until it has a key.

#### Online (Options A, B, or a deployed Option C)

1. In the Cloudflare dashboard go to **Workers & Pages** → your worker.
2. Open **Settings** → **Runtime variables and secrets**.
3. Click **Add variable**, name it `YOUTUBE_API_KEYS`, and paste your key (or comma-separated keys) as the value.
4. Click **Add variable and deploy**.

No code changes needed.

#### Local dev (Option C)

Put the key in the `.env` file as shown above.

<br>

## Everyday use

- **First search to try:** `handle:@madebygoogle pixel` with the **This month** filter.
- **Share a search:** copy the page URL after searching – filters and operators are all in the link.
- **Save quota:** leave **Extra duration + views** off in Settings unless you need it, and raise **Max cache time** if you repeat searches (default 30 minutes). Search results follow that setting; channel lookups (7 days) and categories (1 month) are fixed.
- **Proxy check:** the **Check proxy** button in Settings only verifies the Worker answers – it never spends quota or shows keys.

<br>

## About quotas (why searches sometimes stop)

YouTube gives each API key roughly **10,000 units per day** (resets 00:00 UTC). One normal search costs about **100 units**, so one key covers roughly **100 searches a day**.

The app stretches this by caching repeat searches and rotating keys, and it tells you clearly when all keys are exhausted instead of leaking anything.

Shorts detection first uses free HEAD checks against YouTube's Shorts URLs. Only inconclusive checks fall back to the Data API (normally a handful per search; up to 40 if YouTube blocks the HEAD check), and each result is cached for a day.

Details: [YouTube Data API quota usage](https://developers.google.com/youtube/data/getting-started?hl=en#quota).

<br>

## If something goes wrong

| You see... | It usually means... | Try this |
|---|---|---|
| `Server misconfigured: no API keys` | The Worker has no key | Check `.env` locally, or add the `YOUTUBE_API_KEYS` secret in the dashboard (or `npx wrangler secret put YOUTUBE_API_KEYS`) |
| `YouTube API request failed` with `quotaExhausted: true` | All keys hit today's limit | Wait for the daily reset, or add another key |
| Empty results | Filters too narrow, or typo in `channel:`/`playlist:` ID | Loosen the date filter, check the ID in `/tools` |
| `Forbidden origin` | `/api/*` was called from another website | Use this Worker's own pages; localhost is allowed for development |
| Page looks unstyled / 404 on `/styles.css` | Dev server serving from wrong folder | Run `npx wrangler dev` from the repo root (where `wrangler.toml` is) |
| Settings don't stick | Browser blocks `localStorage` | Allow site data, or use a normal (non-private) window |

<br>

## Project layout

```text
worker.js        The Cloudflare Worker: pages + /api/* (origin gate, key rotation, cache, scoped Shorts probes)
public/          The website: index.html (search), tools.html, settings.html, styles.css, favicon.png
wrangler.toml    Worker config: serves ./public as assets
.env.example     Template for local keys (copy to .env, never commit real keys)
```

<br>

## For contributors

- `dev/project.md` – scope and stack.
- `ARCHITECTURE-MAP.md` – where code lives.
- `dev/verification.md` – how changes are proven.
- `dev/roadmap.md` – milestones and tasks.

<br>

**Notes**: vanilla HTML/CSS/JS, no build, no database. Evergreen browsers only. Secrets never leave the Worker; search enrichment stays **OFF** by default to save quota.

<br>

## Similar projects

- [mkuchak/youtube-advanced-search](https://github.com/mkuchak/youtube-advanced-search?tab=readme-ov-file#readme)
- [flazeIguess/zerodig](https://github.com/flazeIguess/zerodig?tab=readme-ov-file#readme)

<br>

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Google or YouTube. It uses the official YouTube Data API v3 under the [YouTube API Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service).

<br>

## License

[GNU General Public License v3.0](./LICENSE)
