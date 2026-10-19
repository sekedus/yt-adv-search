---
id: B-0001
type: bug
status: COMPLETE
milestone: null
size: SMALL
created: "2026-10-19"
updated: "2026-10-19"
hdt_requirement: REQUIRED
hdt_status: PASS
cancellation_reason: null
---

# B-0001 — Results-card meta renders ` · time` out of order for RTL channel names

Frontmatter is the canonical source for record metadata. Do not add a second `Status` field in the body.

## Reported Behavior

User report (2026-10-19, screenshot): for a video whose channel name is Arabic (`عمر مراد`), the card meta line renders as `2 · عمر مراد days ago` — the leading number and the separator jump in front of the channel name while `days ago` trails after it. The DOM order was already the intended one (`channel · time`).

## Expected Behavior

The meta line always shows `channel name · 2 days ago` in logical (screen) order, whatever script the channel name uses (`عمر مراد · 2 days ago`).

## Reproduction

Search results containing `snippet.channelTitle` with an RTL name (e.g. `عمر مراد`) and `snippet.publishedAt` about 2 days ago. Deterministic in Chromium; reproduced with a mocked `/api/search` response.

## Impact

Cosmetic reading-order bug in every results card with a non-Latin (RTL) channel name — the relative date can be misread as part of the channel name. No data/API impact.

## Root Cause (evidence-based)

Unicode bidi (UAX#9) neutral resolution, not DOM structure:

- Runs: RTL channel name (R) → ` · ` (neutral) → `2 days ago` starting with a digit (EN).
- N1 treats European numbers as R for adjacent neutrals, so ` · ` resolves RTL and pairs with the digit; reordering then moves `2 ·` before the name while the LTR tail `days ago` stays after it.
- Evidence: measured client rects with the un-isolated markup (legacy probe): channel `<a>` 52→108, separator 40→52 (left of the name), `<time>` fragments spanning 31→176.

## Fix

Bidi-isolate each inline run (implementation in `public/index.html` card renderer + `public/styles.css`):

- channel link: `dir="auto"`; non-link channel name rendered as `<bdi>`;
- `<time>`: `dir="auto"`;
- explicit CSS: `.card-meta a, .card-meta time, .card-meta bdi { unicode-bidi: isolate; }`.

## Verification

Automated (Playwright/Chromium against `wrangler dev`, `/api/search` mocked — no quota spent):

```text
3 mock items (Arabic name, Latin name with a digit, plain Latin), all ~2 days ago:
  all three meta lines measured in screen order (channel -> separator -> time):
    Arabic:      a 29->75,   separator 75->85,   time 85->147   (ordered)
    Latin+digit: a 345->416, separator 416->426, time 426->488  (ordered)
    plain:       a 660->704, separator 704->714, time 714->777  (ordered)
  dir="auto" + computed unicode-bidi: isolate on all three rows; the legacy probe (same strings, no isolation)
  still breaks (separator 40->52 left of the name; time fragments 31->176) — confirms root cause and fix.
  0 console errors; light + dark screenshots match the intended reading order.
```

HDT decision reason:

REQUIRED — per `dev/verification.md`, user-visible rendering changes need browser/human confirmation on real data.

HDT steps and user report:

```text
1. `npx wrangler dev`, open the local URL and search anything whose results include an Arabic (or other RTL-named) channel.
2. Each card meta line reads: channel name, then `·`, then the relative date (`عمر مراد · 2 days ago`) — the date is not
   pulled in front of the name and `days ago` does not trail after the name.
3. Latin channel names with digits still read normally (`Omar Bakr 2 · 2 days ago`).
Report: pass, or the card text you saw.
```

HDT status: PASS (2026-10-19 — user report: "all pass"; RTL channel names keep the `channel · date` order).

## Notes / Evidence

- Found during the T-0012 rev-7 review (user report with screenshot); fixed and verified in the same working tree.
- The `<time>` element keeps `white-space: nowrap`; Latin-only meta lines are visually unchanged.
- Security/regression risk: none (presentational only; no API, URL or parameter change).
- Prevention lesson: mixed-direction inline text needs per-run isolation (`dir="auto"`/`<bdi>`), not just the right DOM order; digits bind to RTL neutrals under UAX#9 N1.

## Affected Durable Artifacts

- `public/index.html` (card renderer), `public/styles.css` (card meta isolation)
- `dev/now.md`; related task: `dev/tasks/T-0012-filter-broadcast-quality-panels.md`

## Commit Checkpoint

Suggested commit message:

```text
fix: keep results card meta in screen order for RTL channel names
```

Commit status: `COMMITTED` (see `dev/now.md` Last Checkpoint)

## Handoff

COMPLETE + HDT PASS (2026-10-19, user report "all pass"); record moved to `dev/bug-fixes/done/`. The same working tree also holds the T-0012 changes; only the commit checkpoint remains (policy: ASK).
