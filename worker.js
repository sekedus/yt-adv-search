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
const YT_PATHS = new Set(["/search", "/channels", "/videos"]);

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

function cleanFail(upstreamStatus) {
  return json(
    { error: "YouTube API request failed", upstreamStatus },
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
async function fetchYT(env, path, params, fetchImpl) {
  const keys = getKeys(env);
  if (keys.length === 0) {
    return { ok: false, error: json({ error: "Server misconfigured: no API keys" }, 500) };
  }
  const impl = fetchImpl || fetch;
  let lastStatus = 502;
  for (let i = 0; i < keys.length; i++) {
    const url = buildYTUrl(path, { ...params, key: keys[i] });
    try {
      const res = await impl(url.toString());
      if (res.ok) {
        const data = await res.json();
        return { ok: true, data };
      }
      lastStatus = res.status || 502;
      try {
        await res.text();
      } catch {
        /* discard upstream body */
      }
    } catch {
      lastStatus = 502;
    }
  }
  return { ok: false, error: cleanFail(lastStatus) };
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

/* ---------- API handlers ---------- */

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

  if (enrich) {
    const items = (data && data.items) || [];
    const videoIds = [
      ...new Set(
        items
          .filter((it) => it && it.id && it.id.kind === "youtube#video" && it.id.videoId)
          .map((it) => it.id.videoId)
      ),
    ].slice(0, 50);
    if (videoIds.length > 0) {
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
  }
  return json(data);
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
    return handleSearch(url, env, fetchImpl);
  }
  if (pathname === "/api/channel" || pathname === "/api/channel/") {
    if (method !== "GET" && method !== "HEAD") {
      return json({ error: "Method not allowed" }, 405);
    }
    return handleChannel(url, env, fetchImpl);
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
export {
  parseQueryOperators,
  normalizeDateValue,
  parseChannelRef,
  getKeys,
  buildYTUrl,
  handleFetch,
};
