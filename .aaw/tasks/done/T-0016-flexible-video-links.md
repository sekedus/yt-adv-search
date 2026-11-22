---
id: T-0016
type: feature # feature | fix | chore | research
status: COMPLETE # PLANNED | IN_PROGRESS | AWAITING_USER_DECISION | AWAITING_HDT | AWAITING_USER_REVIEW | BLOCKED | COMPLETE | CANCELLED
milestone: null # standalone task; no milestone
size: MEDIUM # SMALL | MEDIUM | LARGE
created: "2026-11-12"
updated: "2026-11-22"
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

The other two formats stay available as card action buttons. YouTube embed
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
    - Anonymz checkbox: wrap YouTube embed URLs only with
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
  - Anonymz wraps YouTube embed URLs only, both as the default link and as the
    Embed action button; web and Invidious links are never wrapped. Default off.
    Direct YouTube embed links use `rel="noopener"` so they keep the referrer;
    anonymz-wrapped embeds and all other external card links use
    `rel="noopener noreferrer"`.
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
- [x] Anonymz off by default. When on, YouTube embed URLs (default link and
      matching Embed action) are prefixed with `https://anonymz.github.io/?`;
      web and Invidious URLs are never prefixed.
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
- [x] Direct YouTube embed links (primary link or Embed action) use
      `rel="noopener"`; anonymz-wrapped embeds and all other external card links
      keep `rel="noopener noreferrer"`.
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
# - anonymz on: embed default + Embed action prefixed; web/Invidious untouched
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
  embed (default off; later narrowed to embed-only); show the other formats as buttons; Invidious auto uses
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
- `public/index.html`: `videoLinkFormat`, `invidiousMode`, `anonymzEmbed`,
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
- Follow-up 3 (2026-11-22, user request): added `relForUrl` and applied it in
  `applyCardLinks` to the title, thumbnail, and action links. A direct
  `https://youtube.com/embed/...` link gets `rel="noopener"` (referrer kept);
  anonymz-wrapped embeds and every other external card link keep
  `rel="noopener noreferrer"`. `refreshCardLinks` applies the same rule after an
  auto Invidious instance resolves.
- Follow-up 4 (2026-11-22, user request): narrowed Anonymz to YouTube embeds
  only. `videoUrlsFor` now leaves the web URL direct and uses `anonymzEmbed`
  for the embed URL; web links are never anonymz-wrapped.

### Automated evidence (2026-11-12/22)

- `node --check worker.js` — PASS (worker unchanged).
- Inline `<script>` extraction + compile — **6/6 PASS** (index 2, settings 2,
  tools 2).
- Playwright/Chromium (local static server, mocked `/api/search`,
  `/api/categories`, and Invidious instance list; no YouTube quota) —
  **15/15 PASS** before the embed-rel follow-up, plus **8/8 PASS** in the
  focused rerun after the rel and Anonymz-scope follow-ups
  (settings/source/dirty guard, all three link formats, embed-only anonymz,
  direct-embed `rel`, auto instance, 360px, console-clean):
  - defaults web/off/auto; Invidious auto/manual row hidden for web, shown for
    Invidious; Save/reload/Reset persistence; unsaved-changes guard watches the
    new controls.
  - default web: watch + `/shorts/` primary links, Embed + Invidious actions,
    channel/playlist primary links unchanged, one Shorts badge.
  - default embed: `/embed/` primary, Web + Invidious actions, Shorts Web action
    uses `/shorts/`.
  - default Invidious (manual): `redirect.invidious.io/watch` primary, Web +
    Embed actions; channel/playlist still link to YouTube.
  - anonymz on: embed primary and Embed action prefixed; web and Invidious
    links stay direct.
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
  - Embed-rel follow-up: web default → Embed action `noopener`, Invidious
    `noopener noreferrer`; embed default → title/thumbnail `noopener`, Web and
    Invidious actions `noopener noreferrer`; Invidious default → its Embed
    action `noopener`; anonymz on → embed title/action keep
    `noopener noreferrer`, web stays direct; auto instance → same embed rule;
    0 console errors.
  - Anonymz-scope follow-up: web default with Anonymz on → title/thumbnail are
    direct `youtube.com/watch` (Shorts direct `/shorts/`), Embed action is
    anonymz-wrapped; embed default with Anonymz on → title/thumbnail are
    anonymz-wrapped, Web action stays direct; Invidious always direct.
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

### HDT — PASS (original + dirty guard, 2026-11-12)

- Original settings/video-link behavior: PASS (user report "all test pass").
- Dirty-guard revert behavior: PASS (user report "test pass").
- Embed-rel follow-up: attribute-level behavior covered by automated
  assertions; no separate human step.

### HDT — PASS (source + Anonymz scope, user report 2026-11-22: "pass, close & commit")

1. Open `/settings`, choose **Invidious → Manual**, and press **Save**.
2. Choose **YouTube web** and press **Save**. The source row is hidden; this
   stores web + manual.
3. Choose **Invidious**: **Auto** should be selected (not Manual).
4. Save **Invidious → Manual** again. Then choose **YouTube web** and switch
   back to **Invidious** without saving: **Manual** should still be selected.
5. Switch the default back to **YouTube web**, enable **Anonymz**, and press
   **Save**. The title/thumbnail should open `youtube.com/watch…` directly; the
   **Embed** button should open
   `anonymz.github.io/?https://youtube.com/embed/…`.
6. Switch the default to **YouTube embed**. The title/thumbnail should open the
   anonymz-wrapped embed; the **Web** button should open `youtube.com/watch…`
   directly.
7. PASS reported by the user on 2026-11-22.

1. Open `/settings`, choose **Invidious → Manual**, and press **Save**.
2. Choose **YouTube web** and press **Save**. The source row is hidden; this
   stores web + manual.
3. Choose **Invidious**: **Auto** should be selected (not Manual).
4. Save **Invidious → Manual** again. Then choose **YouTube web** and switch
   back to **Invidious** without saving: **Manual** should still be selected.
5. Switch the default back to **YouTube web**, enable **Anonymz**, and press
   **Save**. The title/thumbnail should open `youtube.com/watch…` directly; the
   **Embed** button should open
   `anonymz.github.io/?https://youtube.com/embed/…`.
6. Switch the default to **YouTube embed**. The title/thumbnail should open the
   anonymz-wrapped embed; the **Web** button should open `youtube.com/watch…`
   directly.
7. Report PASS, or the exact step that differs.

The rest of the settings/video-link checklist already passed the original HDT;
no need to repeat it.

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

Commit status: `COMMITTED 2026-11-22`

## Handoff

COMPLETE 2026-11-22. All HDT gates passed (original settings/video links,
dirty-guard revert behavior, Invidious source reset/preserve, embed-only
Anonymz, and direct-embed referrer). Automated checks pass; task record moved to
`.aaw/tasks/done/` and committed. No Worker change.
