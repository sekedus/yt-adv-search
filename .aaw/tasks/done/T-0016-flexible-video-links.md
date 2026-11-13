---
id: T-0016
type: feature # feature | fix | chore | research
status: COMPLETE # PLANNED | IN_PROGRESS | AWAITING_USER_DECISION | AWAITING_HDT | AWAITING_USER_REVIEW | BLOCKED | COMPLETE | CANCELLED
milestone: null # standalone task; no milestone
size: MEDIUM # SMALL | MEDIUM | LARGE
created: "2026-11-12"
updated: "2026-11-13"
hdt_requirement: REQUIRED # UNDECIDED | NOT_REQUIRED | REQUIRED
hdt_status: PASS # NOT_STARTED | AWAITING_USER | PASS | FAIL | DECLINED | NOT_APPLICABLE
cancellation_reason: null # Required text when status is CANCELLED; otherwise null
---

# T-0016 — Flexible video links (default target, anonymz toggle, Invidious source)

## Objective

Let the user choose which URL a video card opens by default:

- YouTube web (`/watch?v=` or `/shorts/`);
- YouTube embed (`/embed/`);
- Invidious.

The other two formats stay available as card action buttons. YouTube web/embed
links can optionally be wrapped with `https://anonymz.github.io/?` (default off).
When the default is Invidious, the user chooses the source: auto (most healthy
public instance from `api.invidious.io`) or manual (`redirect.invidious.io`),
default auto.

## Size / Scope

MEDIUM — `public/settings.html`, `public/index.html`, plus docs/state. No Worker
change, no quota change, no new server-side storage.

### In Scope

- `public/settings.html`:
  - New **Video links** fieldset:
    - Default link radio: YouTube web (default), YouTube embed, Invidious.
    - Anonymz checkbox: wrap YouTube web and embed URLs with
      `https://anonymz.github.io/?`; default off.
    - Invidious source radio: Auto (most healthy public instance) / Manual
      (`redirect.invidious.io`); default auto. This row is shown only while the
      default link is Invidious.
  - Persisted keys: `ytas.videoLink` (`web` default), `ytas.anonymz` (`0`
    default), `ytas.invidiousMode` (`auto` default).
  - Save validates/sanitizes the values; Reset restores all three defaults and
    the hidden/shown state; the unsaved-changes guard watches the new controls.
  - The unsaved-changes guard compares the current controls with the saved
    baseline, so changing a value and changing it back is clean. The header
    theme toggle (which saves immediately), Save, and Reset update the baseline.
  - Invidious source follows the saved default link: choosing Invidious from a
    saved web/embed default selects Auto; a saved Invidious default keeps its
    saved/selected source when the user switches to web/embed and back.
    Returning to a saved web/embed default restores the saved source so a
    temporary detour stays clean.
- `public/index.html`:
  - The card thumbnail and title open the configured default:
    - web → `https://youtube.com/watch?v=<id>` (or `/shorts/<id>`);
    - embed → `https://youtube.com/embed/<id>`;
    - invidious → `<source>/watch?v=<id>`.
  - Card actions show the two non-default formats for videos:
    - default web → **Embed** + **Invidious**;
    - default embed → **Web** + **Invidious**;
    - default invidious → **Web** + **Embed**.
  - Anonymz wraps YouTube web and embed URLs, both as the default link and as
    action buttons; it never wraps Invidious. Default off. Embed/Web/Invidious
    external links use `rel="noopener noreferrer"`.
  - Invidious auto: fetch
    `https://api.invidious.io/instances.json?sort_by=type,health`, keep HTTPS
    entries that are not marked down, pick the highest uptime (list order as
    fallback), validate the URL as a plain HTTPS origin, and use
    `https://redirect.invidious.io` if the fetch or parse fails or no healthy
    instance exists. Rendered card links update when the instance resolves.
  - Invidious manual: always `https://redirect.invidious.io`.
  - Channel and playlist cards keep their current primary links; their
    Invidious action uses the selected Invidious source.
  - Existing search, pagination, Shorts badge/link, filter, and settings
    behavior is unchanged.
- Docs: `README.md` settings/results text; `ARCHITECTURE-MAP.md` search UI +
  settings domains; task/roadmap/now records.

### Out of Scope

- A user-entered custom Invidious instance URL. "Manual" means
  `https://redirect.invidious.io/watch?v=`, exactly as requested.
- Changing the Tools page Invidious link or adding video links there.
- A Worker endpoint / server-side proxy for the Invidious instance list (the
  public endpoint allows CORS; no key, no quota, no storage).
- Persisting the auto-selected instance in storage (fetched per page load).
- Changing search parameters, result cache, pagination, or API contracts.

## Acceptance Criteria

- [x] Settings: default video link is YouTube web; the three options persist
      after reload; Reset restores web/off/auto.
- [x] Settings: the Invidious source row (Auto/Manual) is visible only when the
      default is Invidious; Auto is the default; Manual uses
      `redirect.invidious.io`.
- [x] Default web: thumbnail/title use `youtube.com/watch?v=` (Shorts use
      `/shorts/`); actions are Embed and Invidious.
- [x] Default embed: thumbnail/title use `youtube.com/embed/`; actions are Web
      and Invidious.
- [x] Default Invidious: thumbnail/title use the selected Invidious `/watch?v=`
      URL; actions are Web and Embed.
- [x] Anonymz off by default. When on, YouTube web and embed URLs (default link
      and matching action) are prefixed with `https://anonymz.github.io/?`;
      Invidious URLs are never prefixed.
- [x] Auto Invidious uses the most healthy public HTTPS instance and falls back
      to `redirect.invidious.io` on fetch/parse failure; manual always uses the
      redirect service.
- [x] Channel/playlist cards keep their current primary links; Invidious actions
      follow the selected source.
- [x] No console errors at 360px and desktop width; no horizontal overflow; the
      existing search/filter/pagination/Shorts flows still work.
- [x] Changing a setting and changing it back does not trigger the
      `beforeunload` warning (for example theme Auto → Light → Auto, or video
      link Web → Embed → Web). Save and Reset also clear the warning state.
- [x] If the saved default link is web/embed, choosing Invidious selects
      Auto; switching back to the saved default restores the saved source.
      If the saved default is Invidious, a web/embed detour and return keeps the
      saved/selected source.
- [x] `README.md` and `ARCHITECTURE-MAP.md` describe the new settings and link
      behavior.

## Verification

Commands / checks and expected results:

```text
Extract every inline <script> from public/index.html, public/settings.html,
public/tools.html + node --check
# PASS: all inline scripts compile

node --check worker.js
# PASS: unchanged worker still parses

Playwright/Chromium (static pages + mocked /api/search, no quota)
# - default web card: title/thumb = watch (Shorts = /shorts/), actions Embed + Invidious
# - embed default: title/thumb = /embed/, actions Web + Invidious
# - invidious default (manual): title/thumb + Invidious action = redirect.invidious.io
# - invidious default (auto, mocked instances.json): uses the highest-uptime HTTPS instance
# - auto fetch failure: redirect.invidious.io fallback, links still work
# - anonymz off: no anonymz.github.io in any href
# - anonymz on: web/embed default + action prefixed; invidious untouched
# - settings: defaults web/off/auto; Invidious row hidden for web; shown for invidious;
#   save persists; Reset restores; unsaved guard fires; 360px no overflow
# - existing channel/playlist cards + search/pagination smoke
# - 0 console/page errors

Browser HDT (required)
```

HDT decision reason:

REQUIRED — user-visible settings and search-result links, including an external
instance-list fetch and runtime link choices. `.aaw/verification.md` marks
search/settings interaction as HDT REQUIRED.

## Pending Decision

None. The requested "manual" Invidious mode is implemented as
`https://redirect.invidious.io/watch?v=` exactly as written in the request.
Auto is the default when Invidious is the default link.

## Notes / Evidence

- User request 2026-11-12: flexible video link; choose the video URL in
  settings (default YouTube web); optional anonymz wrapper for YouTube web and
  embed (default off); show the other formats as buttons; Invidious auto uses
  `api.invidious.io/instances.json?sort_by=type,health`, manual uses
  `redirect.invidious.io/watch?v=`; auto/manual shown only when Invidious is the
  default; auto by default.
- `https://api.invidious.io/instances.json?sort_by=type,health` responds with
  `Access-Control-Allow-Origin: *` and an array of `[host, info]` pairs;
  `info.type` is `https`, `i2p`, or `onion`, and `info.monitor.uptime/down`
  carry health. Only plain HTTPS origins are accepted.
- Existing behavior before this task: cards always linked to YouTube web; the
  Embed action was always wrapped with anonymz; Invidious links always used
  `redirect.invidious.io`.

### Implementation (2026-11-12)

- `public/settings.html`: new **Video links** fieldset with the default target
  (web/embed/Invidious), anonymz checkbox, and an Invidious auto/manual row that
  is hidden unless the default is Invidious. New keys
  `ytas.videoLink` / `ytas.anonymz` / `ytas.invidiousMode` are initialized, saved,
  reset, and included in the unsaved-changes guard.
- `public/index.html`: `videoLinkFormat`, `invidiousMode`, `anonymz`,
  `safeHttpsOrigin`, `pickInvidiousBase`, `ensureInvidiousBase`, `videoUrlsFor`,
  `actionFormatsFor`, `applyCardLinks`, `refreshCardLinks`. Cards open the
  configured target and show the other formats as actions; auto instance links
  refresh when the public list resolves; `redirect.invidious.io` is the fallback.
- Docs/state: `README.md`, `ARCHITECTURE-MAP.md`, `CONTEXT.md`,
  `.aaw/project.md`, `.aaw/constraints.md`, `.aaw/security.md`,
  `.aaw/roadmap.md`, `.aaw/now.md`.
- Follow-up (2026-11-12, user-reported during HDT): replaced the sticky
  `dirty = true` flag with a saved-state snapshot (`readFormState`,
  `sameState`, `syncDirty`, `captureSavedState`). Reverting a change now clears
  the warning. The header theme toggle updates only the saved theme baseline;
  Save/Reset capture the full state. Region/language are compared after the
  same trim/normalization used by Save.
- Follow-up 2 (2026-11-12, user request): added
  `syncInvidiousSourceForLink`. When the saved default link is web/embed, a
  change to Invidious selects Auto; returning to web/embed restores the saved
  source. When the saved default is Invidious, the source is left alone across
  a web/embed detour.

### Automated evidence (2026-11-12)

- `node --check worker.js` — PASS (worker unchanged).
- Inline `<script>` extraction + compile — **6/6 PASS** (index 2, settings 2,
  tools 2).
- Playwright/Chromium (local static server, mocked `/api/search`,
  `/api/categories`, and Invidious instance list; no YouTube quota) —
  **15/15 PASS**:
  - defaults web/off/auto; Invidious auto/manual row hidden for web, shown for
    Invidious; Save/reload/Reset persistence; unsaved-changes guard watches the
    new controls.
  - default web: watch + `/shorts/` primary links, Embed + Invidious actions,
    channel/playlist primary links unchanged, one Shorts badge.
  - default embed: `/embed/` primary, Web + Invidious actions, Shorts Web action
    uses `/shorts/`.
  - default Invidious (manual): `redirect.invidious.io/watch` primary, Web +
    Embed actions; channel/playlist still link to YouTube.
  - anonymz on: web/embed primary and matching action prefixed; Invidious never
    prefixed.
  - auto: highest-uptime healthy HTTPS instance wins (`best.example` over a
    down instance, an invalid/http entry, and a lower-uptime instance); channel
    Invidious action follows it; no `http:`/`javascript:` hrefs.
  - auto failure (non-JSON) and invalid instance data fall back to
    `redirect.invidious.io`.
  - 360px settings (row visible, no overflow) and 360px search/paging, 0
    console/page errors, every `/api/search` call carries `page`.
  - Dirty-guard follow-up: theme Auto → Light → Auto, video Web → Embed → Web,
    anonymz on → off, and region typed → cleared all return to a clean state;
    the header theme toggle is clean; Save/Reset are clean; a real change still
    triggers the warning.
  - Invidious source follow-up: saved web + manual → choosing Invidious selects
    Auto; switching back to web restores manual and is clean, and choosing
    Invidious again selects Auto. Saved Invidious + manual → web and embed
    detours and returns keep manual; an unsaved auto change is also kept while
    the saved default is Invidious. Saving web from an Invidious+Manual baseline
    keeps manual hidden; choosing Invidious afterwards selects Auto.
- Live Invidious auto smoke (real `api.invidious.io`, mocked search) — PASS:
  selected `https://yt.chocolatemoo53.com/watch?v=vid1`; 0 console/page errors.
- Screenshots reviewed at 360px and 1280px (settings and results).

### Security evidence

```text
Security level: Level 1 (targeted third-party/client review)
Attack surface: untrusted Invidious instance JSON -> card hrefs; settings values
Skills/workflows used: targeted validation + link-safety review
Tools/tests executed: Playwright invalid data (http, javascript, credentials,
  down) -> redirect fallback; href scan for http:/javascript:; rel check;
  live endpoint smoke
Findings: only plain HTTPS origins with no credentials are accepted; no instance
  JSON is injected as HTML; no keys or search terms sent to the list; external
  actions use rel="noopener noreferrer"; Worker egress unchanged
Remaining uncertainty: third-party instances can be offline or change policy
```

### HDT — PASS (2026-11-12 / 2026-11-13)

- Original settings/video-link behavior: PASS (user report "all test pass",
  2026-11-12).
- Dirty-guard revert behavior: PASS (user report "test pass", 2026-11-12).
- Invidious source Auto-reset / saved-source behavior: PASS (user report
  "pass", 2026-11-13).
- The manual check covered: Invidious+Manual saved → web saved → Invidious
  selects Auto; Invidious+Manual saved → web and back keeps Manual.

## Affected Durable Artifacts

- `public/settings.html`, `public/index.html`
- `README.md`, `ARCHITECTURE-MAP.md`, `CONTEXT.md`
- `.aaw/project.md`, `.aaw/constraints.md`, `.aaw/security.md`
- `.aaw/roadmap.md`, `.aaw/now.md`, this task record

## Commit Checkpoint

Suggested commit message:

```text
feat: configurable video links with anonymz and Invidious source
```

Commit status: `COMMITTED 2026-11-13`

## Handoff

COMPLETE 2026-11-13. Automated 15/15 Playwright + 6/6 inline scripts; all three
HDT rounds passed (original feature, dirty guard, Invidious source baseline).
Task closed and moved to `done/`; no follow-up work is pending.
