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

## Entry Template

```markdown
## PL-0001

Date: YYYY-MM-DD

Idea:
[Project-related idea]

Triggered By:
[What caused the idea to appear during current work]

Action:
DEFER

Reason:
[Why it is outside the current scope]

Revisit When:
[Condition for reconsideration]
```
