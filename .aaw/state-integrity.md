# State Integrity

This document defines how the workflow keeps project state synchronized across durable artifacts.

## Control-Plane Layers

| Artifact | Question answered |
|---|---|
| `.aaw/manifest.yml` | Which AAW release is installed? |
| `.aaw/migration.yml` | Is an AAW migration currently active? |
| `AGENTS.md` | What workflow rules does the agent follow? |
| `.github/copilot-instructions.md` | What thin Copilot adapter is active? |

Only `.aaw/manifest.yml` and an active `.aaw/migration.yml` are control-plane metadata. The other `.aaw/` files are durable project workflow state—tasks, roadmap, milestones, verification, and policies—and must be preserved during migration.

## Durable Project Layers

| Artifact | Question answered |
|---|---|
| `README.md` | How should a new human understand the project? |
| `CONTEXT.md` | What does the project's domain language mean? |
| `ARCHITECTURE-MAP.md` | How is the codebase organized, and where are important flows/contracts/tests? |
| `.aaw/project.md` | What is the project? |
| `.aaw/constraints.md` | What boundaries constrain implementation? |
| `.aaw/roadmap.md` | Where is the product going? |
| `.aaw/tasks/` | What bounded work must be done? |
| `.aaw/verification.md` | What concrete evidence proves work is tested/verified? |
| `.aaw/now.md` | What is happening right now? |
| `docs/adr/` | Why was a durable technical decision made? |
| Git | What actually changed in the worktree/history? |

## Bootstrap State

A newly installed workflow starts at:

```text
DISCOVERY_PENDING
```

No product task is created until a real project objective is known.

## Task State Transaction

When a task is created:

```text
new task file
+ roadmap entry
+ now.md current-task pointer
```

When a task is completed:

```text
applicable verification evidence is valid for the current implementation
+ HDT PASS if required (otherwise explicit NOT_REQUIRED rationale)
+ task metadata status = COMPLETE
+ task moved to .aaw/tasks/done/
+ linked milestone reconciled
+ roadmap and now.md reconciled
+ affected documentation reviewed
+ state-integrity check
```

A task cancellation is a separate state transition, not completion:

```text
reason provided? --no--> ask the user; do not guess or move the file yet
      |
     yes
      -> set task metadata status = CANCELLED and record reason
      -> move task to .aaw/tasks/cancelled/
      -> strike through the task entry in its milestone; do not delete it
      -> strike through an exit criterion only if this task was its sole required work
      -> reconcile milestone, roadmap, and now.md
      -> state-integrity check
```

Do not automatically revert implementation changes just because a task is cancelled. Cancellation changes the work decision; code rollback requires a separate, clear instruction.

Milestone status rules:

- `COMPLETE`: every non-cancelled task is `COMPLETE` and every remaining, non-struck exit criterion is satisfied.
- `CANCELLED`: the milestone has at least one task and all its tasks are `CANCELLED`.
- Otherwise, keep an appropriate non-terminal status such as `PLANNED`, `IN_PROGRESS`, or `BLOCKED`.
- Preserve struck-through task and criterion entries as decision history. Do not remove them.

Whenever a linked task changes status—including `AWAITING_HDT`, `AWAITING_USER_REVIEW`, `COMPLETE`, `BLOCKED`, or `CANCELLED`—inspect and reconcile its milestone. Do not update only `now.md` and the roadmap while leaving the milestone stale.

For a task with `HDT: REQUIRED`, `AWAITING_HDT` is an active, non-complete state. Keep its task file in `.aaw/tasks/` and keep it pointed to by `.aaw/now.md` until a PASS report is recorded. Never move it to `done/` before then. Do not ask the user to rerun automated checks already executed successfully by the agent.

Triage a multi-item request before creating records. Related small items with one coherent acceptance/verification boundary belong in one task, with no milestone. A genuine multi-task milestone is planning-only unless implementation is explicitly authorized: create the milestone and planned child records, update roadmap/now, and stop without starting any task. Do not create or complete a milestone for a single task.

When codebase structure changes:

```text
source change
+ ARCHITECTURE-MAP.md update
+ relevant verification/test evidence
```

When a task is committed:

```text
Git commit
+ now.md commit checkpoint
+ state-integrity verification
```

## Integrity Checks

At minimum verify:

1. `now.md` current task exists.
2. The same task exists in the roadmap.
3. Task objective matches roadmap objective.
4. A task is not marked complete while required HDT is pending, failed, or declined. A task is not marked complete while `AWAITING_USER_REVIEW` is unanswered.
5. A task with required HDT stays active and in `.aaw/tasks/` until a PASS result is recorded.
6. Completed task is not still active.
7. Task IDs are unique.
8. Architecture map is updated when codebase shape changes.
9. Verification claims are supported by `.aaw/verification.md` and task evidence.
10. Verification evidence matches task status.
11. Commit claims match Git.
12. README reflects material project-understanding changes.
13. A completed task is not left in the active task folder; a standalone completed bug record is not left in the active bug folder.
14. A pending decision is explicit; it is never inferred from session continuity or silence. A task in `AWAITING_USER_REVIEW` is not implicitly approved by silence or a new session.
15. If a project maintains `CHANGELOG.md`, release-facing changes are recorded there when applicable.
16. If `.aaw/migration.yml` is active, no product task is being executed or created.
17. After migration completion, `.aaw/manifest.yml` reports the verified target version and `.aaw/migration.yml` is absent.
18. A `CANCELLED` task is under `.aaw/tasks/cancelled/`, has a user-provided `cancellation_reason`, and remains struck through in its linked milestone; it is not under `done/`.
19. A milestone is `COMPLETE` only when all non-cancelled tasks are `COMPLETE` and all remaining exit criteria are satisfied. If every task in a non-empty milestone is `CANCELLED`, its status is `CANCELLED`.
20. A task linked to a milestone has that milestone reconciled on every status transition.

## Recovery

When state is inconsistent, stop implementation and reconcile the artifacts before continuing.

## AAW Migration State

AAW migration is outside normal product task state. During an active migration:

```text
.aaw/migration.yml = ACTIVE
product task state  = frozen
product roadmap     = frozen
product now.md      = preserved
```

The migration lock is the durable signal that a new session must resume migration before normal work. A migration may update workflow-owned files and control-plane metadata, but it must preserve product state and unrelated user changes.

## Affected-artifact rule

After a meaningful change, identify which durable artifacts actually changed in meaning. Update only those artifacts. For example:

- small local fix -> active task + `.aaw/now.md` + affected verification evidence;
- architecture change -> task + `ARCHITECTURE-MAP.md` + ADR/verification when affected;
- user-facing feature -> task + README/CHANGELOG only when the project actually maintains them and the change is meaningful;
- workflow policy change -> the relevant AAW workflow documentation.

Unchanged artifacts should be left alone. Do not perform blanket documentation synchronization merely because the files exist.

## Reusing Verification Evidence

Verification evidence remains valid when no relevant implementation or test input has changed since the check. Do not rerun application `lint`, unit/integration tests, type-check, compile, or packaging solely because a task's metadata/status changed or its Markdown file moved to `done/` or `cancelled/`.

Before rerunning a check, compare the current diff with the inputs that check covers. Rerun only checks invalidated by changes to relevant source, tests, dependencies/lockfiles, configuration, generated inputs, or required environment. A documentation-only or metadata-only transaction may still need Markdown/link/state checks, but not unrelated application tests. A previously recorded HDT PASS remains valid unless relevant implementation or tested behavior changes after the user's test.

## Canonical Record Metadata

New task, milestone, and standalone bug-fix records use YAML frontmatter for canonical metadata. Do not duplicate status in the Markdown body. Update metadata `updated` whenever record content or status changes. For existing legacy records without frontmatter, add it when the record is created or materially updated; do not bulk rewrite all historical records just to normalize formatting.

## Git File Moves

When moving a tracked task/bug record between active and terminal folders, prefer `git mv` and preserve its content except for the required metadata/status/record updates. Git infers rename presentation from parent/child tree similarity; rename is not a special stored object type. Verify with `git status`, `git diff --summary --find-renames`, and `git diff --cached --summary --find-renames` when changes are staged. If a file is new and never existed in the parent commit, adding it directly at its final path is correct. Do not create extra commits solely to force Git to display a rename.


## Milestone cardinality

Do not create a milestone for a request that decomposes into one coherent task file. Several related small items may be grouped into that one task when they share scope, acceptance, and verification. A newly planned milestone must have multiple independently trackable child tasks and represent a genuinely broad/large coordinated outcome (usually three or more tasks; two only when dependencies/phases/shared exit criteria make a milestone useful). Task count alone is not sufficient. A task without a milestone is completed/cancelled independently; never invent a milestone just to reflect its terminal status. Existing historical one-task milestones are not destructively rewritten solely to normalize this rule.
