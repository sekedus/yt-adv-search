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
 * emits no logs containing key material. Egress is fixed to
 * www.googleapis.com only.
 */

"use strict";

const YT_HOST = "www.googleapis.com";
const YT_BASE = `https://${YT_HOST}/youtube/v3`;
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

async function fetchYT(env, path, params, fetchImpl) {
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
 * Successful /api/search + /api/channel responses are cached in
 * caches.default for CACHE_TTL_S. Bypass with ?fresh=1 or
 * Cache-Control: no-cache/no-store. The cache key is the request URL minus
 * `fresh` — API keys never appear in the URL (server-side only), so the key
 * carries no secret material. Served responses carry x-cache-status
 * HIT/MISS. Caching is best-effort: any cache failure falls through to
 * upstream, and runtimes without caches.default simply skip the layer. */
const CACHE_TTL_S = 300;
const CAT_TTL_S = 604800; // video categories change rarely: cache 1 week.

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
  return new Request(u.toString(), { method: "GET" });
}

function withCacheStatus(res, hit) {
  const h = new Headers(res.headers);
  h.set("x-cache-status", hit ? "HIT" : "MISS");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

async function cachedApi(request, requestUrl, handler, ttlS) {
  const ttl = clampTtl(ttlS, CACHE_TTL_S, 60, 604800);
  const store = cacheStore();
  const bypass = isFreshBypass(requestUrl, request);
  const keyReq = store && !bypass ? cacheKeyRequest(requestUrl) : null;
  if (keyReq) {
    try {
      const hit = await store.match(keyReq);
      if (hit) return withCacheStatus(hit, true);
    } catch {
      /* cache read failure: fall through to upstream */
    }
  }
  const res = await handler();
  if (res && (bypass || keyReq)) {
    if (store && keyReq && res.status === 200) {
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

// Split operator tokens out of q. Unknown `a:b` stays literal.
function parseQueryOperators(rawQ) {
  const tokens = String(rawQ || "")
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
  return {
    cleanQ: kept.join(" "),
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

// Parse tools input (full URL, @handle, UC id, username) into a typed ref.
function parseChannelRef(input) {
  const s = String(input || "").trim();
  if (!s) return null;
  if (/^UC[\w-]{10,}$/.test(s)) return { kind: "id", value: s };
  if (/^@[\w][\w.-]*$/.test(s)) return { kind: "handle", value: s.slice(1) };
  let url = null;
  try {
    if (/^[\w-]+(\.[\w-]+)+[/?#]/.test(s) || s.includes("://")) {
      url = new URL(s.includes("://") ? s : `https://${s}`);
    } else if (s.startsWith("youtube.com") || s.startsWith("www.youtube.com") || s.startsWith("youtu.be")) {
      url = new URL(`https://${s}`);
    }
  } catch {
    url = null;
  }
  if (url) {
    const host = url.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const mCh = url.pathname.match(/\/channel\/(UC[\w-]+)/);
      if (mCh) return { kind: "id", value: mCh[1] };
      const mAt = url.pathname.match(/\/@([^\s/?#]+)/);
      if (mAt) return { kind: "handle", value: mAt[1] };
      const mUser = url.pathname.match(/\/user\/([^\s/?#]+)/);
      if (mUser) return { kind: "username", value: mUser[1] };
      const mC = url.pathname.match(/\/c\/([^\s/?#]+)/);
      if (mC) return { kind: "handle", value: mC[1] };
      return null;
    }
    return null;
  }
  if (s.includes("/@")) {
    const m = s.match(/@([^\s/?#]+)/);
    if (m) return { kind: "handle", value: m[1] };
  }
  // Bare word: treat as handle (forHandle covers modern handles; legacy
  // usernames go through ?username= explicitly).
  if (/^[\w][\w.-]*$/.test(s)) return { kind: "handle", value: s.replace(/^@/, "") };
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
        const assetPath = STATIC_ROUTES.get(pathname) || pathname;
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

// Client cache preference for search/channel (?cacheTtl= seconds,
// clamped 60s..1h). The categories endpoint uses the fixed 1-week TTL.
function requestCacheTtl(requestUrl) {
  return clampTtl(requestUrl.searchParams.get("cacheTtl"), CACHE_TTL_S, 60, 3600);
}

async function handleSearch(requestUrl, env, fetchImpl) {
  const sp = requestUrl.searchParams;
  const rawQ = sp.get("q") || "";
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
  return json(data);
}

// Live video-category list for the Category filter.
// Ref: https://developers.google.com/youtube/v3/docs/videoCategories/list
// Slimmed to [{id, title}] (assignable only); cached server-side 1 week.
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

  const ytParams = { part: "snippet,statistics" };
  if (ref.kind === "id") ytParams.id = ref.value;
  else if (ref.kind === "handle") ytParams.forHandle = ref.value.replace(/^@/, "");
  else ytParams.forUsername = ref.value;

  const r = await fetchYT(env, "/channels", ytParams, fetchImpl);
  if (!r.ok) return r.error;
  const items = (r.data && r.data.items) || [];
  if (items.length === 0) {
    return json({ error: "Channel not found" }, 404);
  }
  return json(r.data);
}

/* ---------- entry ---------- */

async function handleFetch(request, env, fetchImpl) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

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
    // T-0010: GET channel lookups are cached; ?fresh=1 bypasses.
    if (method === "GET") {
      return cachedApi(request, url, () => handleChannel(url, env, fetchImpl), requestCacheTtl(url));
    }
    return handleChannel(url, env, fetchImpl);
  }
  if (pathname === "/api/categories" || pathname === "/api/categories/") {
    if (method !== "GET" && method !== "HEAD") {
      return json({ error: "Method not allowed" }, 405);
    }
    if (method === "GET") {
      return cachedApi(request, url, () => handleCategories(url, env, fetchImpl), CAT_TTL_S);
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
  resetQuotaExclusions,
  quotaExclusionCount,
  isKeyQuotaExcluded,
  clampTtl,
};
