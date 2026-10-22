/* worker.js — yt-adv-search v1 (T-0001)
 *
 * Single Cloudflare Worker:
 *   GET /, /tools, /settings   -> static pages (ASSETS binding when present,
 *                                 otherwise a placeholder so smoke passes)
 *   GET /api/search?...        -> proxied youtube search.list with key rotation
 *                                 + server-side operator resolution
 *   GET /api/channel?...       -> proxied youtube channels.list (id/handle/
 *                                 username/url) with key rotation
 *
 * Secrets: env.YOUTUBE_API_KEYS = "k1,k2" (comma-separated, trimmed).
 * Keys never leave the worker: never reflected in responses, and the worker
 * emits no logs containing key material. API egress is fixed to
 * www.googleapis.com; Shorts detection adds a fixed HEAD-only probe to
 * www.youtube.com/shorts/<videoId>, and /c/ channel resolution adds a fixed GET
 * to www.youtube.com/c/<encodedName> (canonical-ID only; no cookies, no API key).
 */

"use strict";

const YT_HOST = "www.googleapis.com";
const YT_BASE = `https://${YT_HOST}/youtube/v3`;
const YT_WEB_HOST = "www.youtube.com";
const YT_WEB_SHORTS_BASE = `https://${YT_WEB_HOST}/shorts/`;
const YT_WEB_CUSTOM_BASE = `https://${YT_WEB_HOST}/c/`;
const YT_PATHS = new Set(["/search", "/channels", "/videos", "/playlistItems", "/videoCategories"]);

const MAX_Q_LEN = 500;
const MAX_URL_LEN = 1000;
const DEFAULT_MAX_RESULTS = 25;

// search.list params we forward verbatim (q/channelId/published* handled
// separately because operators override them; key/enrich/part never forward).
const ALLOWED_SEARCH_PARAMS = new Set([
  "channelType",
  "eventType",
  "location",
  "locationRadius",
  "maxResults",
  "order",
  "pageToken",
  "regionCode",
  "relevanceLanguage",
  "safeSearch",
  "topicId",
  "type",
  "videoCaption",
  "videoCategoryId",
  "videoDefinition",
  "videoDimension",
  "videoDuration",
  "videoEmbeddable",
  "videoLicense",
  "videoPaidProductPlacement",
  "videoSyndicated",
  "videoType",
  "fields",
]);

const STATIC_ROUTES = new Map([
  ["/", "/index.html"],
  ["/tools", "/tools.html"],
  ["/tools/", "/tools.html"],
  ["/settings", "/settings.html"],
  ["/settings/", "/settings.html"],
]);

const STATIC_ASSETS = new Set([
  "/index.html",
  "/tools.html",
  "/settings.html",
  "/styles.css",
  "/app.js",
  "/favicon.png",
  "/favicon.ico",
]);

/* ---------- helpers ---------- */

function getKeys(env) {
  const raw = (env && env.YOUTUBE_API_KEYS) || "";
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function cleanFail(upstreamStatus, quotaSeen) {
  const body = { error: "YouTube API request failed", upstreamStatus };
  if (quotaSeen) body.quotaExhausted = true;
  return json(
    body,
    502
  );
}

/* ---------- API origin gate (T-0013) ----------
 * The API is a quota-backed proxy with no login. Browsers always identify
 * the calling page through Origin/Referer/Sec-Fetch-Site, so refuse pages
 * that are not this Worker's own origin (or localhost during development).
 * Requests with no browser origin headers (curl, scripts, server-side
 * clients) still pass: this is abuse deterrence, not authentication, and a
 * malicious non-browser client can spoof headers anyway. */
function parseOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLocalDevOrigin(origin) {
  try {
    const u = new URL(origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]";
  } catch {
    return false;
  }
}

function apiOriginAllowed(request, requestUrl) {
  const origin = parseOrigin(request.headers.get("Origin"));
  const referer = parseOrigin(request.headers.get("Referer"));
  const source = origin || referer;
  if (source) {
    return source === requestUrl.origin || isLocalDevOrigin(source);
  }
  // A browser that suppressed Origin/Referer still sends Sec-Fetch-Site.
  // `none` covers address-bar/direct navigation; `same-origin` is this app.
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") return false;
  return true;
}

function buildYTUrl(path, params) {
  if (!YT_PATHS.has(path)) throw new Error("blocked egress path");
  const url = new URL(YT_BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  return url;
}

// Try keys in order; rotate on any non-200 or network throw. Key values are
// never logged nor returned — only the fixed upstream host is ever fetched.
//
// T-0010 quota exclusion: a key that fails with 403 quotaExceeded
// (youtube.quota) is skipped until next 00:00 UTC. The store is in-memory
// per isolate (no KV binding in v1), keyed by key index, so one isolate may
// retry an exhausted key while another already skips it — bounded extra
// quota burn, no correctness issue.
//
// T-0013: `opts.stopOn404` lets optional probes (the UUSH Shorts playlist)
// stop immediately on a deterministic 404 instead of rotating every key.
const quotaExhaustedUntil = new Map(); // keyIndex -> epoch ms

function nextMidnightUtcMs(nowMs) {
  const d = new Date(nowMs);
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

// True for the documented quota shape: 403 + errors[].reason quotaExceeded
// (domain youtube.quota); falls back to a quota mention in the message.
// Ref: https://developers.google.com/youtube/v3/docs/errors
function isQuotaErrorPayload(status, bodyText) {
  if (status !== 403 || !bodyText) return false;
  try {
    const parsed = JSON.parse(bodyText);
    const errs = (parsed && parsed.error && parsed.error.errors) || [];
    for (const e of errs) {
      if (!e) continue;
      if (e.reason === "quotaExceeded") return true;
      if (e.domain === "youtube.quota") return true;
    }
    const msg = String((parsed && parsed.error && parsed.error.message) || "");
    if (/quota/i.test(msg)) return true;
    return false;
  } catch {
    return /quotaExceeded/i.test(bodyText);
  }
}

async function fetchYT(env, path, params, fetchImpl, opts) {
  const keys = getKeys(env);
  if (keys.length === 0) {
    return { ok: false, error: json({ error: "Server misconfigured: no API keys" }, 500) };
  }
  const impl = fetchImpl || fetch;
  const now = Date.now();
  let lastStatus = 502;
  let quotaSeen = false;
  let attempted = 0;
  for (let i = 0; i < keys.length; i++) {
    if ((quotaExhaustedUntil.get(i) || 0) > now) {
      quotaSeen = true;
      continue;
    }
    attempted++;
    const url = buildYTUrl(path, { ...params, key: keys[i] });
    try {
      const res = await impl(url.toString());
      if (res.ok) {
        const data = await res.json();
        return { ok: true, data };
      }
      lastStatus = res.status || 502;
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch {
        bodyText = "";
      }
      // Optional probes treat a missing resource as "not found", not as a
      // key failure: retrying with another key cannot change a 404.
      if (lastStatus === 404 && opts && opts.stopOn404) {
        return { ok: false, notFound: true, upstreamStatus: 404 };
      }
      if (isQuotaErrorPayload(lastStatus, bodyText)) {
        quotaSeen = true;
        quotaExhaustedUntil.set(i, nextMidnightUtcMs(now));
      }
    } catch {
      lastStatus = 502;
    }
  }
  if (attempted === 0 && quotaSeen) {
    return {
      ok: false,
      error: json(
        { error: "YouTube API quota exhausted on all keys — retry after 00:00 UTC", quotaExhausted: true, upstreamStatus: 403 },
        502
      ),
    };
  }
  return { ok: false, error: cleanFail(lastStatus, quotaSeen) };
}

/* ---------- GET result cache (T-0010) ----------
 * Successful /api/search, /api/channel, and /api/categories responses are
 * cached in caches.default. Search TTL is client-controlled (60-3600 s,
 * default 30 min); channel lookups are cached 7 days, categories 1 month. Bypass with
 * ?fresh=1 or Cache-Control: no-cache/no-store. Channel/category bypass
 * requests rewrite the entry (manual refresh updates the cache); search
 * bypass remains read-only. The cache key is the request URL minus
 * `fresh`/`cacheTtl` — API keys never appear in the URL (server-side only),
 * so the key carries no secret material. Served responses carry
 * x-cache-status HIT/MISS. Caching is best-effort: any cache failure falls
 * through to upstream, and runtimes without caches.default simply skip the
 * layer. */
const CACHE_TTL_S = 1800; // search default: 30 minutes.
const CACHE_TTL_MAX_S = 30 * 24 * 3600; // categories may be cached 1 month.
const CHANNEL_TTL_S = 7 * 24 * 3600; // resolver lookups change rarely.
const CAT_TTL_S = 30 * 24 * 3600; // video categories change rarely: 1 month.

// Clamp a client-supplied TTL (seconds) into [min, max]; fallback on garbage.
function clampTtl(v, fb, min, max) {
  const n = parseInt(String(v), 10);
  if (Number.isNaN(n)) return fb;
  return Math.min(max, Math.max(min, n));
}

function cacheStore() {
  try {
    if (typeof caches !== "undefined" && caches && caches.default) return caches.default;
  } catch {
    /* non-worker runtime: no cache */
  }
  return null;
}

function isFreshBypass(requestUrl, request) {
  if (requestUrl.searchParams.get("fresh") === "1") return true;
  try {
    const cc = String((request && request.headers && request.headers.get("cache-control")) || "").toLowerCase();
    if (cc.includes("no-cache") || cc.includes("no-store")) return true;
  } catch {
    /* ignore */
  }
  return false;
}

// Test/observability hooks (functions only: workerd rejects non-function
// exports). Never expose key material — indexes and counts only.
function resetQuotaExclusions() {
  quotaExhaustedUntil.clear();
}

function quotaExclusionCount() {
  return quotaExhaustedUntil.size;
}

function isKeyQuotaExcluded(index) {
  return (quotaExhaustedUntil.get(index) || 0) > Date.now();
}

function cacheKeyRequest(requestUrl) {
  const u = new URL(requestUrl.toString());
  u.searchParams.delete("fresh");
  u.searchParams.delete("cacheTtl"); // affects stored max-age only, not content
  // URL-form resolver requests now use multi-check semantics. Version their
  // cache key so a pre-upgrade single-result entry cannot serve for 7 days.
  if (u.pathname === "/api/channel" || u.pathname === "/api/channel/") {
    if (u.searchParams.has("url")) u.searchParams.set("v", "2");
  }
  return new Request(u.toString(), { method: "GET" });
}

function withCacheStatus(res, hit) {
  const h = new Headers(res.headers);
  h.set("x-cache-status", hit ? "HIT" : "MISS");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

async function cachedApi(request, requestUrl, handler, ttlS, opts) {
  const ttl = clampTtl(ttlS, CACHE_TTL_S, 60, CACHE_TTL_MAX_S);
  const store = cacheStore();
  const bypass = isFreshBypass(requestUrl, request);
  const keyReq = store ? cacheKeyRequest(requestUrl) : null;
  if (keyReq && !bypass) {
    try {
      const hit = await store.match(keyReq);
      if (hit) return withCacheStatus(hit, true);
    } catch {
      /* cache read failure: fall through to upstream */
    }
  }
  const res = await handler();
  const writeOnBypass = !!(opts && opts.writeOnBypass);
  if (res && keyReq) {
    if (res.status === 200 && (!bypass || writeOnBypass)) {
      try {
        const h = new Headers(res.headers);
        h.set("cache-control", "public, max-age=" + ttl);
        await store.put(keyReq, new Response(await res.clone().text(), { status: res.status, headers: h }));
      } catch {
        /* caching is best-effort */
      }
    }
    return withCacheStatus(res, false);
  }
  return res;
}

// YYYY-MM-DD -> YYYY-MM-DDT00:00:00Z; full datetimes pass through when valid.
// Returns null when unparseable (caller keeps the token literal).
function normalizeDateValue(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00Z`;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

/* q is special: URLSearchParams decodes "+" as a space, but q must keep a
 * literal plus. Decode percent escapes only and treat a raw "+" as "+"
 * (a real space must arrive as "%20" or a literal space). */
function queryParamLiteral(requestUrl, name) {
  const raw = (requestUrl.search || "").replace(/^\?/, "");
  for (const part of raw.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const rawKey = eq < 0 ? part : part.slice(0, eq);
    let key;
    try { key = decodeURIComponent(rawKey.replace(/\+/g, "%2B")); }
    catch { key = rawKey; }
    if (key !== name) continue;
    const rawVal = eq < 0 ? "" : part.slice(eq + 1);
    try { return decodeURIComponent(rawVal.replace(/\+/g, "%2B")); }
    catch { return rawVal; }
  }
  return null;
}

// Split operator tokens out of q. Unknown `a:b` stays literal.
function parseQueryOperators(rawQ) {
  const raw = String(rawQ || "");
  const tokens = raw
    .split(/\s+/)
    .filter(Boolean);
  const kept = [];
  let channel = null;
  let handle = null;
  let username = null;
  let playlist = null;
  let publishedAfter = null;
  let publishedBefore = null;
  for (const tok of tokens) {
    const idx = tok.indexOf(":");
    if (idx > 0) {
      const prefix = tok.slice(0, idx).toLowerCase();
      const value = tok.slice(idx + 1);
      if (!value) {
        kept.push(tok);
        continue;
      }
      if (prefix === "channel") {
        channel = value;
        continue;
      }
      if (prefix === "handle") {
        handle = value;
        continue;
      }
      if (prefix === "user") {
        username = value;
        continue;
      }
      if (prefix === "playlist") {
        const v = String(value).trim();
        // Playlist IDs are opaque YouTube tokens (PL/UU/FL/RD/OL/LL…);
        // accept any token-shaped value, leave the rest literal.
        if (/^[A-Za-z0-9_-]{10,}$/.test(v)) {
          playlist = v;
          continue;
        }
        kept.push(tok);
        continue;
      }
      if (prefix === "before") {
        const d = normalizeDateValue(value);
        if (d) {
          publishedBefore = d;
          continue;
        }
        kept.push(tok);
        continue;
      }
      if (prefix === "after") {
        const d = normalizeDateValue(value);
        if (d) {
          publishedAfter = d;
          continue;
        }
        kept.push(tok);
        continue;
      }
      kept.push(tok);
      continue;
    }
    kept.push(tok);
  }
  const onlyWhitespace = raw.length > 0 && raw.trim() === "";
  return {
    cleanQ: onlyWhitespace ? raw : kept.join(" "),
    channel,
    handle,
    username,
    playlist,
    publishedAfter,
    publishedBefore,
  };
}

// Resolve handle:@x / user:NAME to a UC channel id via channels.list.
// Returns { channelId } or { notFound } or { error }.
async function resolveHandleToChannelId(env, handle, username, fetchImpl) {
  const ytParams = { part: "snippet" };
  if (handle) ytParams.forHandle = String(handle).replace(/^@/, "").trim();
  else if (username) ytParams.forUsername = String(username).trim();
  else return { notFound: true };
  if (!ytParams.forHandle && !ytParams.forUsername) return { notFound: true };
  const r = await fetchYT(env, "/channels", ytParams, fetchImpl);
  if (!r.ok) return { error: r.error };
  const items = (r.data && r.data.items) || [];
  if (items.length === 0 || !items[0].id) return { notFound: true };
  return { channelId: items[0].id };
}

function decodeRefPart(v) {
  try { return decodeURIComponent(v); } catch { return v; }
}

// Parse tools input (full URL, @handle, UC id, username) into a typed ref.
// `explicit` means the input named one URL form; a bare word is ambiguous and
// may be checked as handle + legacy username + custom URL.
function parseChannelRef(input) {
  const s = String(input || "").trim();
  if (!s) return null;
  if (/^UC[\w-]{10,}$/.test(s)) return { kind: "id", value: s, explicit: true };
  if (/^@[\w][\w.-]*$/.test(s)) return { kind: "handle", value: s.slice(1), explicit: true };
  let url = null;
  try {
    if (/^[\w-]+(\.[\w-]+)+[/?#]/.test(s) || s.includes("://")) {
      url = new URL(s.includes("://") ? s : `https://${s}`);
    } else if (s.startsWith("youtube.com") || s.startsWith("www.youtube.com") || s.startsWith("youtu.be")) {
      url = new URL(`https://${s}`);
    } else if (/^\/(?:@|channel\/|user\/|c\/)/.test(s)) {
      // Path-only forms copied from the address bar: /@handle, /c/name, etc.
      url = new URL(`https://www.youtube.com${s}`);
    }
  } catch {
    url = null;
  }
  if (url) {
    const host = url.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      // ref: https://support.google.com/youtube/answer/6180214?hl=en

      // youtube.com/channel/channel_id
      const mCh = url.pathname.match(/\/channel\/(UC[\w-]+)/);
      if (mCh) return { kind: "id", value: mCh[1], explicit: true };

      // youtube.com/@handle
      const mAt = url.pathname.match(/\/@([^\s/?#]+)/);
      if (mAt) return { kind: "handle", value: decodeRefPart(mAt[1]), explicit: true };

      // youtube.com/user/legacy_username
      const mUser = url.pathname.match(/\/user\/([^\s/?#]+)/);
      if (mUser) return { kind: "username", value: decodeRefPart(mUser[1]), explicit: true };

      // youtube.com/c/custom (no Data API lookup; resolved from the page)
      const mC = url.pathname.match(/\/c\/([^\s/?#]+)/);
      if (mC) return { kind: "custom", value: decodeRefPart(mC[1]), explicit: true };

      return null;
    }
    return null;
  }
  if (s.includes("/@")) {
    const m = s.match(/@([^\s/?#]+)/);
    if (m) return { kind: "handle", value: decodeRefPart(m[1]), explicit: true };
  }
  // Bare word: ambiguous between a handle and a legacy username/custom URL.
  if (/^[\w][\w.-]*$/.test(s)) return { kind: "handle", value: s.replace(/^@/, ""), explicit: false };
  return null;
}

/* ---------- static ---------- */

function placeholderPage(title, heading, message) {
  const html =
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${title}</title></head><body>` +
    `<header><nav><a href="/">Search</a> | <a href="/tools">Tools</a> | ` +
    `<a href="/settings">Settings</a></nav></header>` +
    `<main><h1>${heading}</h1><p>${message}</p></main></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function serveStatic(pathname, env) {
  if (STATIC_ROUTES.has(pathname) || STATIC_ASSETS.has(pathname)) {
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      try {
        // Browsers auto-request /favicon.ico; the file on disk is
        // favicon.png, so serve the same bytes for both paths.
        const assetPath =
          STATIC_ROUTES.get(pathname) ||
          (pathname === "/favicon.ico" ? "/favicon.png" : pathname);
        const res = await env.ASSETS.fetch(new Request(`https://assets${assetPath}`));
        if (res && res.ok) return res;
      } catch {
        /* fall through to placeholder/404 */
      }
    }
    if (STATIC_ROUTES.has(pathname)) {
      if (pathname === "/") {
        return placeholderPage(
          "yt-adv-search",
          "Search",
          "Search page lands in T-0002. API is live at /api/search."
        );
      }
      if (pathname.startsWith("/tools")) {
        return placeholderPage(
          "Tools — yt-adv-search",
          "Tools",
          "Channel resolver lands in T-0003. API is live at /api/channel."
        );
      }
      return placeholderPage(
        "Settings — yt-adv-search",
        "Settings",
        "Settings page lands in T-0004."
      );
    }
    return new Response("Not found", { status: 404 });
  }
  return null;
}

/* ---------- playlist scope (T-0010) ----------
 * search.list has no playlistId param, so `playlist:ID keyword` is served
 * via playlistItems.list (paginated, capped) with keyword matching done
 * locally. Items are mapped to the search-like shape the frontend renders
 * ({ id: { kind, videoId }, snippet }). */

// Fetch up to 3 pages (150 items) of a playlist. Returns search-shaped items.
async function fetchPlaylistItems(env, playlistId, pageToken, fetchImpl) {
  const items = [];
  let next = pageToken || null;
  let prev = null;
  let first = true;
  for (let p = 0; p < 3; p++) {
    const ytParams = { part: "snippet", playlistId, maxResults: 50 };
    if (next) ytParams.pageToken = next;
    const r = await fetchYT(env, "/playlistItems", ytParams, fetchImpl);
    if (!r.ok) return { error: r.error };
    const data = r.data || {};
    if (first) {
      prev = data.prevPageToken || null;
      first = false;
    }
    for (const it of data.items || []) {
      const sn = (it && it.snippet) || {};
      const vid = sn.resourceId && sn.resourceId.videoId;
      if (!vid) continue;
      items.push({
        id: { kind: "youtube#video", videoId: vid },
        snippet: {
          title: sn.title,
          description: sn.description,
          channelTitle: sn.videoOwnerChannelTitle || sn.channelTitle,
          channelId: sn.videoOwnerChannelId || sn.channelId,
          publishedAt: sn.publishedAt,
          thumbnails: sn.thumbnails,
        },
        playlistScope: playlistId,
      });
    }
    next = data.nextPageToken || null;
    if (!next) break;
  }
  return { items, nextPageToken: next, prevPageToken: prev };
}

// Local keyword filter: every positive token must appear (AND), `-x`
// tokens exclude. Case-insensitive over title/description/channel.
function filterPlaylistItems(items, keyword) {
  const tokens = String(keyword || "")
    .split(/\s+/)
    .filter(Boolean);
  const pos = [];
  const neg = [];
  for (const t of tokens) {
    if (t.startsWith("-") && t.length > 1) neg.push(t.slice(1).toLowerCase());
    else pos.push(t.toLowerCase());
  }
  if (pos.length === 0 && neg.length === 0) return items;
  return items.filter((it) => {
    const sn = (it && it.snippet) || {};
    const hay = [sn.title, sn.description, sn.channelTitle].join(" ").toLowerCase();
    for (const n of neg) {
      if (n && hay.includes(n)) return false;
    }
    for (const p of pos) {
      if (p && !hay.includes(p)) return false;
    }
    return true;
  });
}

/* ---------- Shorts detection (T-0013) ----------
 * Two-stage check, cached for one day:
 *  1. HEAD https://www.youtube.com/shorts/<videoId>
 *       - 200            -> Short
 *       - 3xx to /watch  -> regular video
 *       - anything else  -> ambiguous; fall through to the API
 *  2. API fallback: a channel's auto-generated Shorts playlist is
 *     UUSH + channelId.slice(2); playlistItems.list with videoId returns an
 *     item only for Shorts. A 404 means the channel has no Shorts playlist.
 * Ref: https://stackoverflow.com/a/78703474 (user note %TEMP%/yt-shorts.md).
 *
 * Best-effort and scoped: failed checks never fail the search. HEAD checks
 * cover at most 40 videos/response. If HEAD is unavailable (first canary
 * fails), up to 40 API probes replace it; when HEAD works but a few videos
 * are ambiguous, at most 6 API fallbacks run, keeping search + probes inside
 * the free-plan subrequest budget. Positive and negative results are cached
 * for one day.
 */
const SHORTS_MAX_VIDEOS = 40;
const SHORTS_MAX_API_FALLBACK = 6;
const SHORTS_MAX_API_ONLY = 40;
const SHORTS_MAX_CHANNELS = 6;
const SHORTS_CACHE_TTL_S = 86400;
const SHORTS_CACHE_PATH = "/__shorts/";
const SHORTS_PLAYLIST_RE = /^UU(?:SH|PS|MS)/;

function shortsPlaylistId(channelId) {
  const id = String(channelId || "").trim();
  if (!/^UC[\w-]{10,}$/.test(id)) return null;
  return "UUSH" + id.slice(2);
}

function isShortsPlaylistId(playlistId) {
  return SHORTS_PLAYLIST_RE.test(String(playlistId || ""));
}

// A known Shorts playlist (UUSH/UUPS/UUMS) is already entirely Shorts.
function markShortsPlaylist(items) {
  for (const it of items || []) {
    if (it && it.id && it.id.kind === "youtube#video" && it.id.videoId) {
      it.shorts = true;
    }
  }
}

function shortsHeadUrl(videoId) {
  return YT_WEB_SHORTS_BASE + encodeURIComponent(videoId);
}

// 200 = Short; redirect to /watch = regular video. A redirect anywhere else
// (consent/canonical) or a non-200/3xx response is ambiguous -> API fallback.
async function checkShortByHead(videoId, fetchImpl) {
  const impl = fetchImpl || fetch;
  const init = { method: "HEAD", redirect: "manual" };
  try {
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
      init.signal = AbortSignal.timeout(4000);
    }
  } catch {
    /* older runtime: no timeout signal */
  }
  try {
    const res = await impl(shortsHeadUrl(videoId), init);
    if (res.status === 200) return { known: true, short: true };
    if (res.status >= 300 && res.status < 400) {
      const loc = String(res.headers.get("location") || "");
      if (/\/watch(?:\?|$)/.test(loc)) return { known: true, short: false };
    }
    return { known: false, short: false };
  } catch {
    return { known: false, short: false };
  }
}

function shortCacheKey(cacheBase, videoId) {
  if (!cacheBase) return null;
  try {
    return new Request(new URL(SHORTS_CACHE_PATH + encodeURIComponent(videoId), cacheBase).toString());
  } catch {
    return null;
  }
}

async function shortCacheGet(cacheBase, videoId) {
  const store = cacheStore();
  const key = shortCacheKey(cacheBase, videoId);
  if (!store || !key) return null;
  try {
    const hit = await store.match(key);
    if (!hit) return null;
    const body = await hit.json();
    return body && typeof body.short === "boolean" ? body.short : null;
  } catch {
    return null;
  }
}

async function shortCachePut(cacheBase, videoId, isShort) {
  const store = cacheStore();
  const key = shortCacheKey(cacheBase, videoId);
  if (!store || !key) return;
  try {
    await store.put(
      key,
      new Response(JSON.stringify({ short: !!isShort }), {
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=" + SHORTS_CACHE_TTL_S,
        },
      })
    );
  } catch {
    /* best-effort cache */
  }
}

async function markShorts(env, items, fetchImpl, data, cacheBase) {
  const videos = (items || []).filter(
    (it) => it && it.id && it.id.kind === "youtube#video" && it.id.videoId
  );
  if (videos.length === 0) return;

  // De-duplicate while keeping response order; cap at 40 videos.
  const targets = [];
  const seen = new Set();
  for (const it of videos) {
    const vid = it.id.videoId;
    if (seen.has(vid)) continue;
    if (targets.length >= SHORTS_MAX_VIDEOS) break;
    seen.add(vid);
    targets.push(it);
  }
  let limited = new Set(videos.map((it) => it.id.videoId)).size > targets.length;

  // videoId -> boolean; false/unknown stays unset in the JSON.
  const resolved = new Map();

  // 1. One-day result cache (HEAD and API results share it).
  await Promise.all(
    targets.map(async (it) => {
      const hit = await shortCacheGet(cacheBase, it.id.videoId);
      if (hit !== null) resolved.set(it.id.videoId, hit);
    })
  );

  // 2. HEAD checks. The first unresolved video is a canary: if HEAD is
  // blocked/unavailable, skip the rest and use the API for this response.
  let unresolved = targets.filter((it) => !resolved.has(it.id.videoId));
  let headUsable = true;
  if (unresolved.length > 0) {
    const first = unresolved[0];
    const firstRes = await checkShortByHead(first.id.videoId, fetchImpl);
    if (!firstRes.known) {
      headUsable = false;
    } else {
      resolved.set(first.id.videoId, firstRes.short);
      await shortCachePut(cacheBase, first.id.videoId, firstRes.short);
      const rest = unresolved.slice(1);
      const results = await Promise.all(
        rest.map(async (it) => ({ it, res: await checkShortByHead(it.id.videoId, fetchImpl) }))
      );
      await Promise.all(
        results.map(async ({ it, res }) => {
          if (!res.known) return;
          resolved.set(it.id.videoId, res.short);
          await shortCachePut(cacheBase, it.id.videoId, res.short);
        })
      );
      unresolved = unresolved.filter((it) => !resolved.has(it.id.videoId));
    }
  }

  // 3. API fallback for unresolved videos (bounded subrequest budget).
  const maxFallback = headUsable ? SHORTS_MAX_API_FALLBACK : SHORTS_MAX_API_ONLY;
  let apiTargets = unresolved;
  if (apiTargets.length > maxFallback) {
    apiTargets = apiTargets.slice(0, maxFallback);
    limited = true;
  }

  // Group by owner channel so one 404 (no Shorts playlist) skips the rest.
  const groups = new Map();
  for (const it of apiTargets) {
    const pl = shortsPlaylistId(it.snippet && it.snippet.channelId);
    if (!pl) continue;
    if (!groups.has(pl)) {
      if (groups.size >= SHORTS_MAX_CHANNELS) {
        limited = true;
        continue;
      }
      groups.set(pl, []);
    }
    groups.get(pl).push(it);
  }

  const probe = async (it, pl) => {
    const r = await fetchYT(
      env,
      "/playlistItems",
      {
        part: "id",
        playlistId: pl,
        videoId: it.id.videoId,
        maxResults: 1,
        fields: "items/id",
      },
      fetchImpl,
      { stopOn404: true }
    );
    if (r.notFound) return "missing";
    if (r.ok) {
      const isShort = !!(r.data && Array.isArray(r.data.items) && r.data.items.length > 0);
      resolved.set(it.id.videoId, isShort);
      await shortCachePut(cacheBase, it.id.videoId, isShort);
      return "ok";
    }
    return "error";
  };

  await Promise.all(
    [...groups.entries()].map(async ([pl, vids]) => {
      const first = await probe(vids[0], pl);
      if (first === "missing") {
        // No Shorts playlist: this channel's videos are not Shorts.
        await Promise.all(
          vids.map((it) => {
            resolved.set(it.id.videoId, false);
            return shortCachePut(cacheBase, it.id.videoId, false);
          })
        );
        return;
      }
      await Promise.all(vids.slice(1).map((it) => probe(it, pl)));
    })
  );

  // Apply positives to every item (including duplicates beyond the target cap).
  for (const it of videos) {
    if (resolved.get(it.id.videoId) === true) it.shorts = true;
  }

  if (limited && data) data.shortsDetectionLimited = true;
}

// Attach duration/viewCount via videos.list. Sets data.enrichmentError on
// failure instead of failing the whole response.
async function enrichItems(env, items, fetchImpl, data) {
  const videoIds = [
    ...new Set(
      (items || [])
        .filter((it) => it && it.id && it.id.kind === "youtube#video" && it.id.videoId)
        .map((it) => it.id.videoId)
    ),
  ].slice(0, 50);
  if (videoIds.length === 0) return;
  const er = await fetchYT(
    env,
    "/videos",
    { part: "snippet,contentDetails,statistics", id: videoIds.join(",") },
    fetchImpl
  );
  if (er.ok) {
    const byId = new Map();
    for (const v of (er.data && er.data.items) || []) {
      if (v && v.id) {
        byId.set(v.id, {
          duration: v.contentDetails && v.contentDetails.duration,
          viewCount: v.statistics && v.statistics.viewCount,
          likeCount: v.statistics && v.statistics.likeCount,
        });
      }
    }
    for (const it of items) {
      if (it && it.id && it.id.videoId && byId.has(it.id.videoId)) {
        it.enrichment = byId.get(it.id.videoId);
      }
    }
  } else {
    data.enrichmentError = "Enrichment failed";
  }
}

/* ---------- API handlers ---------- */

// Client cache preference for search results (?cacheTtl= seconds,
// clamped 60s..1h, default 30 min). Channel lookups use a fixed 7-day TTL and
// categories a fixed 1-month TTL.
function requestCacheTtl(requestUrl) {
  return clampTtl(requestUrl.searchParams.get("cacheTtl"), CACHE_TTL_S, 60, 3600);
}

async function handleSearch(requestUrl, env, fetchImpl) {
  const sp = requestUrl.searchParams;
  // q preserves literal "+"; only a real space/%20 separates words.
  const rawQ = queryParamLiteral(requestUrl, "q") || "";
  if (rawQ.length > MAX_Q_LEN) {
    return json({ error: "Query too long (max 500 chars)" }, 400);
  }
  let maxResults = parseInt(sp.get("maxResults") || String(DEFAULT_MAX_RESULTS), 10);
  if (Number.isNaN(maxResults)) maxResults = DEFAULT_MAX_RESULTS;
  maxResults = Math.min(50, Math.max(1, maxResults));
  const enrich = sp.get("enrich") === "true" || sp.get("enrich") === "1";

  const ops = parseQueryOperators(rawQ);

  // Playlist scoping (T-0010): search.list has no playlistId param, so the
  // playlistItems.list workaround runs here with local keyword filtering.
  // Placed before channel resolution to avoid pointless channels.list quota.
  if (ops.playlist) {
    if (!/^[A-Za-z0-9_-]{10,}$/.test(ops.playlist)) {
      return json({ error: "Invalid playlist id" }, 400);
    }
    const pr = await fetchPlaylistItems(env, ops.playlist, sp.get("pageToken") || null, fetchImpl);
    if (pr.error) return pr.error;
    const data = {
      items: filterPlaylistItems(pr.items, ops.cleanQ).slice(0, maxResults),
      pageInfo: { totalResults: pr.items.length, resultsPerPage: maxResults },
      playlistScope: ops.playlist,
    };
    if (pr.prevPageToken) data.prevPageToken = pr.prevPageToken;
    if (pr.nextPageToken) data.nextPageToken = pr.nextPageToken;
    if (enrich) await enrichItems(env, data.items, fetchImpl, data);
    // T-0013: a Shorts playlist is entirely Shorts; any other scoped
    // playlist is checked per video (HEAD first, UUSH API fallback).
    if (isShortsPlaylistId(ops.playlist)) markShortsPlaylist(data.items);
    else await markShorts(env, data.items, fetchImpl, data, requestUrl.origin);
    return json(data);
  }

  // Channel scoping: explicit channel: wins (saves quota); else resolve
  // handle:/user: via channels.list; else fall back to ?channelId=.
  let channelId = ops.channel || null;
  if (!channelId && (ops.handle || ops.username)) {
    const handleVal = ops.handle ? ops.handle.replace(/^@/, "").trim() : null;
    if (handleVal && handleVal.length > 100) {
      return json({ error: "Handle too long" }, 400);
    }
    if (ops.username && ops.username.length > 100) {
      return json({ error: "Username too long" }, 400);
    }
    const r = await resolveHandleToChannelId(env, handleVal, ops.username, fetchImpl);
    if (r.error) return r.error;
    if (r.notFound) {
      const who = handleVal ? `handle:${handleVal}` : `user:${ops.username}`;
      return json({ error: `Channel not found for ${who}` }, 404);
    }
    channelId = r.channelId;
  }
  if (!channelId) channelId = sp.get("channelId") || null;

  const publishedAfter = ops.publishedAfter || sp.get("publishedAfter") || null;
  const publishedBefore = ops.publishedBefore || sp.get("publishedBefore") || null;

  if (!ops.cleanQ && !channelId) {
    return json({ error: "Missing q (or channel scoping operator)" }, 400);
  }

  const ytParams = { part: "snippet", maxResults };
  if (ops.cleanQ) ytParams.q = ops.cleanQ;
  if (channelId) ytParams.channelId = channelId;
  if (publishedAfter) ytParams.publishedAfter = publishedAfter;
  if (publishedBefore) ytParams.publishedBefore = publishedBefore;
  for (const k of ALLOWED_SEARCH_PARAMS) {
    if (k === "maxResults") continue;
    const v = sp.get(k);
    if (v !== null && v !== "") ytParams[k] = v;
  }

  const r = await fetchYT(env, "/search", ytParams, fetchImpl);
  if (!r.ok) return r.error;
  const data = r.data;

  if (enrich) await enrichItems(env, data.items, fetchImpl, data);
  // T-0013: Shorts detection only for channel-scoped searches.
  if (channelId) await markShorts(env, data.items, fetchImpl, data, requestUrl.origin);
  return json(data);
}

// Live video-category list for the Category filter.
// Ref: https://developers.google.com/youtube/v3/docs/videoCategories/list
// Slimmed to [{id, title}] (assignable only); cached server-side 1 month.
async function handleCategories(requestUrl, env, fetchImpl) {
  const sp = requestUrl.searchParams;
  let region = (sp.get("regionCode") || "US").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(region)) region = "US";
  const r = await fetchYT(env, "/videoCategories", { part: "snippet", regionCode: region }, fetchImpl);
  if (!r.ok) return r.error;
  const items = [];
  for (const it of (r.data && r.data.items) || []) {
    const sn = (it && it.snippet) || {};
    if (!it || !it.id || !sn.title) continue;
    if (sn.assignable === false) continue;
    items.push({ id: String(it.id), title: String(sn.title) });
  }
  return json({ regionCode: region, items });
}

// Resolve one typed ref through channels.list. Returns the full response data
// plus its first item (some callers only need the item).
async function fetchChannelByRef(env, ref, fetchImpl) {
  const ytParams = { part: "snippet,statistics" };
  if (ref.kind === "id") ytParams.id = ref.value;
  else if (ref.kind === "handle") ytParams.forHandle = String(ref.value).replace(/^@/, "");
  else if (ref.kind === "username") ytParams.forUsername = ref.value;
  else return { error: json({ error: "Unsupported channel reference" }, 400) };

  const r = await fetchYT(env, "/channels", ytParams, fetchImpl);
  if (!r.ok) return { error: r.error };
  const data = r.data || {};
  const item = (data.items || [])[0] || null;
  return item ? { item, data } : { notFound: true };
}

// /c/<custom> has no Data API lookup. Fetch the public channel page (fixed
// host, encoded path, no cookies/API key) and read its canonical channel id.
async function resolveCustomChannelId(custom, fetchImpl) {
  const slug = String(custom || "").trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(slug)) return { notFound: true };
  const impl = fetchImpl || fetch;
  const headers = {
    accept: "text/html,application/xhtml+xml",
    "user-agent": "Mozilla/5.0 (compatible; yt-adv-search/1.0)",
  };
  let current = YT_WEB_CUSTOM_BASE + encodeURIComponent(slug);
  let html = "";
  for (let hop = 0; hop < 3; hop++) {
    let res = null;
    try {
      res = await impl(current, { method: "GET", headers, redirect: "manual" });
    } catch {
      return { notFound: true };
    }
    if (!res) return { notFound: true };
    if (res.status >= 300 && res.status < 400) {
      let next = null;
      try {
        next = new URL(String(res.headers.get("location") || ""), current);
      } catch {
        return { notFound: true };
      }
      // YouTube may redirect /c/<name> to /@handle; never follow off-host.
      if (next.hostname !== YT_WEB_HOST) return { notFound: true };
      current = next.toString();
      continue;
    }
    if (!res.ok) return { notFound: true };
    try {
      html = await res.text();
    } catch {
      return { notFound: true };
    }
    break;
  }
  if (!html) return { notFound: true };
  if (html.length > 3000000) html = html.slice(0, 3000000);
  const m =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']https:\/\/www\.youtube\.com\/channel\/(UC[\w-]+)["']/i) ||
    html.match(/<link[^>]+href=["']https:\/\/www\.youtube\.com\/channel\/(UC[\w-]+)["'][^>]+rel=["']canonical["']/i) ||
    html.match(/"externalId":"(UC[\w-]+)"/);
  if (!m) return { notFound: true };
  return { channelId: m[1] };
}

// Bare names are ambiguous: check handle + legacy username + custom URL and
// return every distinct channel, with the matching forms attached to each
// item. Explicit URLs/kinds stay single-form lookups.
async function handleChannelMulti(env, base, fetchImpl) {
  const [h, u, c] = await Promise.all([
    fetchChannelByRef(env, { kind: "handle", value: base }, fetchImpl),
    fetchChannelByRef(env, { kind: "username", value: base }, fetchImpl),
    resolveCustomChannelId(base, fetchImpl),
  ]);

  const items = [];
  const byId = new Map();
  const add = (type, item) => {
    if (!item || !item.id) return;
    if (!byId.has(item.id)) {
      const copy = { ...item, matchedBy: [] };
      byId.set(item.id, copy);
      items.push(copy);
    }
    byId.get(item.id).matchedBy.push({ type, value: base });
  };

  if (h.item) add("handle", h.item);
  if (u.item) add("username", u.item);
  let detailError = null;
  if (c.channelId) {
    const known = byId.get(c.channelId);
    if (known) {
      add("custom", known);
    } else {
      const d = await fetchChannelByRef(env, { kind: "id", value: c.channelId }, fetchImpl);
      if (d.item) add("custom", d.item);
      else if (d.error) detailError = d.error;
    }
  }

  if (items.length === 0) {
    return h.error || u.error || detailError || json({ error: "Channel not found" }, 404);
  }
  return json({
    kind: "youtube#channelListResponse",
    items,
    lookup: { mode: "multi", checked: ["handle", "username", "custom"] },
    pageInfo: { totalResults: items.length, resultsPerPage: items.length },
  });
}

async function handleChannel(requestUrl, env, fetchImpl) {
  const sp = requestUrl.searchParams;
  const id = (sp.get("id") || "").trim();
  const handle = (sp.get("handle") || "").trim();
  const username = (sp.get("username") || "").trim();
  const urlInput = (sp.get("url") || "").trim();
  if (urlInput.length > MAX_URL_LEN) {
    return json({ error: "URL too long" }, 400);
  }

  // Precedence: id > handle > username > url.
  let ref = null;
  if (id) ref = { kind: "id", value: id };
  else if (handle) ref = { kind: "handle", value: handle.replace(/^@/, "") };
  else if (username) ref = { kind: "username", value: username };
  else if (urlInput) ref = parseChannelRef(urlInput);
  else {
    return json({ error: "Missing id, handle, username, or url" }, 400);
  }
  if (!ref || !ref.value) {
    return json({ error: "Could not parse channel URL/input" }, 400);
  }
  if (ref.value.length > 200) {
    return json({ error: "Channel reference too long" }, 400);
  }

  // A bare name/URL is ambiguous: the Tools auto mode checks every form.
  // An explicit /@handle, /user/..., /c/..., or /channel/... stays exact.
  if (urlInput && !ref.explicit && ref.kind !== "id") {
    return handleChannelMulti(env, ref.value, fetchImpl);
  }

  const matchType = ref.kind;
  const matchValue = ref.value;
  if (ref.kind === "custom") {
    const custom = await resolveCustomChannelId(ref.value, fetchImpl);
    if (!custom.channelId) return json({ error: "Channel not found" }, 404);
    ref = { kind: "id", value: custom.channelId, explicit: true };
  }

  const r = await fetchChannelByRef(env, ref, fetchImpl);
  if (r.error) return r.error;
  if (!r.item) return json({ error: "Channel not found" }, 404);
  const data = r.data || { items: [r.item] };
  if (data.items && data.items[0]) {
    data.items[0].matchedBy = [{ type: matchType, value: matchValue }];
  }
  data.lookup = { mode: "single" };
  return json(data);
}

/* ---------- entry ---------- */

async function handleFetch(request, env, fetchImpl) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // T-0013: API requests must come from this Worker's own pages (or
  // localhost during development). Static pages stay public.
  if (pathname.startsWith("/api/") && !apiOriginAllowed(request, url)) {
    return json({ error: "Forbidden origin" }, 403);
  }

  if (pathname === "/api/search" || pathname === "/api/search/") {
    if (method !== "GET" && method !== "HEAD") {
      return json({ error: "Method not allowed" }, 405);
    }
    // T-0010: GET search results are cached; ?fresh=1 bypasses.
    if (method === "GET") {
      return cachedApi(request, url, () => handleSearch(url, env, fetchImpl), requestCacheTtl(url));
    }
    return handleSearch(url, env, fetchImpl);
  }
  if (pathname === "/api/channel" || pathname === "/api/channel/") {
    if (method !== "GET" && method !== "HEAD") {
      return json({ error: "Method not allowed" }, 405);
    }
    // GET channel lookups are cached 7 days; the Tools Refresh button sends
    // ?fresh=1, which bypasses the read and rewrites the entry with new data.
    if (method === "GET") {
      return cachedApi(request, url, () => handleChannel(url, env, fetchImpl), CHANNEL_TTL_S, {
        writeOnBypass: true,
      });
    }
    return handleChannel(url, env, fetchImpl);
  }
  if (pathname === "/api/categories" || pathname === "/api/categories/") {
    if (method !== "GET" && method !== "HEAD") {
      return json({ error: "Method not allowed" }, 405);
    }
    if (method === "GET") {
      return cachedApi(request, url, () => handleCategories(url, env, fetchImpl), CAT_TTL_S, {
        writeOnBypass: true,
      });
    }
    return handleCategories(url, env, fetchImpl);
  }

  if (method !== "GET" && method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  const staticRes = await serveStatic(pathname, env);
  if (staticRes) return staticRes;
  return new Response("Not found", { status: 404 });
}

const worker = {
  async fetch(request, env) {
    return handleFetch(request, env, undefined);
  },
};

export default worker;
// Named exports for node-based verification (wrangler ignores these).
// Functions only — workerd rejects non-function exports.
export {
  parseQueryOperators,
  normalizeDateValue,
  parseChannelRef,
  getKeys,
  buildYTUrl,
  handleFetch,
  isQuotaErrorPayload,
  nextMidnightUtcMs,
  filterPlaylistItems,
  fetchPlaylistItems,
  enrichItems,
  apiOriginAllowed,
  shortsPlaylistId,
  isShortsPlaylistId,
  markShorts,
  checkShortByHead,
  shortCacheGet,
  shortCachePut,
  resetQuotaExclusions,
  quotaExclusionCount,
  isKeyQuotaExcluded,
  clampTtl,
};
