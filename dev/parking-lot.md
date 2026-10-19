# Parking Lot

The parking lot is an **active deferred queue**, not an archive.

Add only ideas that are clearly related to the project but intentionally outside the current scope.

Do not add unrelated brainstorming, speculative distractions, or implementation notes that belong in the current task.

```text
discover
  -> park
  -> later review
  -> promote to task/milestone OR reject/drop
  -> remove the parking-lot entry
```

When an entry is promoted, the new task or milestone may reference the old `PL-xxxx` ID, but the resolved parking-lot item should be deleted. Git history preserves the historical record.

## PL-0001

Date: 2026-10-19

Idea:
Validate the `relevanceLanguage` setting client-side (ISO 639-1 shape: 2–3 letters, or the documented `zh-Hans`/`zh-Hant`) so a free-typed value cannot 400 the API (`invalidRelevanceLanguage`). Also consider preserving the documented case for `zh-Hans`/`zh-Hant` (settings lowercases the value today).

Triggered By:
Doc audit during T-0012 closeout (user request): param chain compared against the official search.list reference.

Action:
DEFER

Reason:
Input hardening, not a functional defect; settings help already documents ISO 639-1.

Revisit When:
Next settings/validation pass, or a user reports an API error from the Language field.

## PL-0002

Date: 2026-10-19

Idea:
Range-check the Advanced Location/Radius inputs (lat −90..90, lon −180..180, radius ≤ 1000 km). Only the format is checked today, so e.g. `999,999` or `2000km` reaches the API and can 400 (`invalidLocation`; docs cap radius at 1000 km). The pair is already only sent when both parts pass the format check.

Triggered By:
Doc audit during T-0012 closeout (search.list `location`/`locationRadius` rules).

Action:
DEFER

Reason:
Edge-case input guard; the worker relays upstream errors cleanly.

Revisit When:
Next Advanced-panel pass, or a user hits an invalidLocation error.

## PL-0003

Date: 2026-10-19

Idea:
Pass `hl` (from the Language setting) to the worker's `videoCategories.list` call so Category dropdown titles are localized; the endpoint defaults to en_US today. Would add a lang dimension to the server + client cache keys.

Triggered By:
Doc audit during T-0012 closeout (videoCategories.list optional `hl`).

Action:
DEFER

Reason:
Cosmetic/localization nicety; touches caching.

Revisit When:
Next categories or i18n pass.

## PL-0004

Date: 2026-10-19

Idea:
Guard exclude-only queries: with an empty keyword and only exclude words, `q` becomes a bare `-word` NOT token; search.list defines NOT as an operator to combine with positive terms, so behavior with no positive term is undefined/odd.

Triggered By:
Doc audit during T-0012 closeout (search.list `q` Boolean NOT operator semantics).

Action:
DEFER

Reason:
Behavior is inherited from the long-standing exclude-words feature; needs a UX decision (block, or auto-add a positive term).

Revisit When:
Next search-form review, or a user report about empty/odd results with only exclusions.

