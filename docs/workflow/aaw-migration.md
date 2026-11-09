# AAW Migration

**Applies to existing Adaptive Agent Workflow installations.** Use this procedure for upgrades, downgrades, migrations, and repairs. For a project that does not already have AAW, use [`aaw-installation.md`](aaw-installation.md) instead.

This is an agent-facing control-plane procedure, not product-development work. A migration must preserve project state, be resumable, and stop after verification.

## Principle

```text
product source, project knowledge, and user changes = protected
AAW-owned workflow rules and state                  = reconcile, not blindly replace
```

The user can express the request naturally, for example `update AAW to v0.8.2` or `upgrade this project to AAW 0.8.2`. The agent must establish the requested target version and use the matching source files. Do not claim a target is current without checking the canonical source repository when the user requested the latest version.

## Version source of truth

Read `.aaw/manifest.yml` when present. `AAW_VERSION` is the installed version authority. `AAW_SCHEMA` identifies the state layout and is not a substitute for the release version.

For the 0.8.x template, the manifest shape is:

```yaml
AAW_ID: adaptive-agent-workflow
AAW_SOURCE: https://github.com/sekedus/adaptive-agent-workflow
AAW_VERSION: 0.8.2
AAW_SCHEMA: 2
```

For older installations without a manifest, inspect concrete workflow markers and repository history to establish the source version. If the exact source version cannot be established safely, stop before modifying workflow files; do not guess.

Use the target release's `CHANGELOG.md`, workflow instructions, and manifest to identify changes between the installed and target versions. Apply the required changes for every intervening version. Do not assume every release is only a metadata bump.

## Migration lock and freeze

Before changing workflow files, create or reconcile `.aaw/migration.yml`:

```yaml
mode: MIGRATION
status: ACTIVE
from: 0.8.1
to: 0.8.2
```

If a new session finds an active lock, reconcile actual files and continue that migration before product work. While the lock is active, do not create, modify, complete, or reprioritize product tasks; do not execute application work; and preserve unrelated user changes.

Migration is not a product task and must not create a `T-*` entry solely for the migration.

## Migration procedure

### 1. Inspect before editing

Check `git status`, relevant diffs, `.aaw/manifest.yml`, root `AGENTS.md`, harness adapters, `.aaw/now.md`, the current task and roadmap, task/milestone/bug records, and the contents of workflow-related directories. Identify project-specific files that share names with template files. Do not assume the working tree is clean.

If the user requests a downgrade, verify that the target release can represent current state safely. Never discard fields, statuses, evidence, or files that the older workflow cannot represent; stop and report the incompatibility rather than silently losing data.

### 2. Create the lock and freeze product work

Create `.aaw/migration.yml` with `status: ACTIVE`, recording the exact source and target versions. Reconcile an existing active lock instead of replacing it. Do not create a product task or milestone for the migration.

### 3. Apply layout migration only when required

For a source version earlier than 0.8.0 migrating to 0.8.x, apply the historical state-layout transition described in the **0.8.0 layout migration** section below. Move only known AAW-owned files from the old `dev/` layout into `.aaw/`.

For a source version of 0.8.0 or later, `.aaw/` is already the state root. Do not replay the `dev/` relocation or reset state. Merge the target release's workflow rules and files into the existing installation while preserving meaningful local edits and project-specific content.

For any other source/target transition, inspect the target release's compatibility instructions and make only the layout changes it explicitly requires.

### 4. Reconcile target release files and references

1. Compare existing workflow-owned files with the target source. Apply target rules deliberately; do not wholesale overwrite local state or project instructions.
2. Preserve task IDs, frontmatter, current statuses, cancellation reasons, HDT evidence, milestone history/strikethroughs, and active-task meaning unless a documented migration explicitly requires a compatible transformation.
3. Reconcile `.aaw/project.md`, `.aaw/constraints.md`, `.aaw/quality.md`, `.aaw/security.md`, `.aaw/roadmap.md`, `.aaw/now.md`, `.aaw/verification.md`, `.aaw/parking-lot.md`, and existing task/milestone records with actual project facts. Never invent missing facts.
4. Prepare a merged `AGENTS.md` as the canonical project workflow instruction source and prepare thin harness adapters if needed. Preserve project-specific instructions, but do not write the updated control-plane files yet; apply them in the finalization step after the other target files have been verified.
5. Preserve the target project's `README.md`, `LICENSE`, `CHANGELOG.md`, `CONTEXT.md`, `ARCHITECTURE-MAP.md`, and `docs/adr/`. Update them only when required to describe real project state or when the user explicitly authorizes a relevant change. Do not copy the template README, LICENSE, or CHANGELOG over project files.
6. Keep `wiki/` only if the user wants it in the target project; it is not a runtime dependency.
7. Update only AAW-owned references that are demonstrably stale. Avoid blind repository-wide path or version replacements that could alter application content or history.
8. Read the release change log and apply all required lifecycle or policy clarifications from the target version. For example, the 0.8.1 lifecycle requires `AWAITING_USER_REVIEW` after verification even when HDT is `NOT_REQUIRED`.

### 5. Historical 0.8.0 layout migration (only for pre-0.8.0 sources)

In 0.8.0, `.aaw/` became the home for AAW-managed workflow state and policy. `docs/` remained for human-facing project documentation and project-specific ADR/design material. Root `AGENTS.md` remained the canonical workflow instruction source; `ARCHITECTURE-MAP.md` remained a compact codebase navigation map; `CONTEXT.md` remained durable domain vocabulary.

For a 0.7.x project, move each known AAW-owned item from `dev/` to the corresponding path under `.aaw/`, preserving relative paths and contents. Examples:

| Legacy 0.7.x path | Target 0.8.x path |
|---|---|
| `dev/project.md` | `.aaw/project.md` |
| `dev/now.md` | `.aaw/now.md` |
| `dev/roadmap.md` | `.aaw/roadmap.md` |
| `dev/tasks/` | `.aaw/tasks/` |
| `dev/tasks/done/` | `.aaw/tasks/done/` |
| `dev/tasks/cancelled/` | `.aaw/tasks/cancelled/` |
| `dev/milestones/` | `.aaw/milestones/` |
| `dev/bug-fixes/` | `.aaw/bug-fixes/` |
| `dev/verification.md` | `.aaw/verification.md` |
| other known AAW-owned `dev/*.md` policy/state files | `.aaw/<same-basename>` |

Use `git mv` for tracked files when possible, or an equivalent content-preserving move. If both source and destination exist, compare and reconcile them; never overwrite either copy automatically. Move only known AAW-owned files. If `dev/` also contains application code or unrelated user files, leave those items in place and do not remove the directory unless it is empty after migration.

No `features/` work-record folder is part of the 0.8.x workflow. Do not delete legacy feature records automatically; preserve them as historical project data, or move them only through an explicit, safe reconciliation with the user/project.

During this structural transition:

- use `AAW_SCHEMA: 2` for the 0.8.x layout;
- preserve IDs, frontmatter, task status, cancellation reasons, HDT evidence, milestone strikethroughs, and active-task meaning;
- apply task-first triage for new work, but do not destructively normalize historical one-task milestones merely for tidiness;
- update references only when they refer to AAW's old state paths.

After the structural transition, continue applying the remaining changes required by the requested target release. Migrating a 0.7.x project to 0.8.2 must not stop at 0.8.0 semantics.

### 6. Verify the target migration

At minimum, confirm:

- target workflow files exist and references point to the correct locations;
- no required project or AAW state was lost, overwritten, or silently discarded;
- the installed `AGENTS.md` and harness adapter follow the target workflow and do not contradict each other;
- task IDs, task statuses, HDT evidence, cancellation reasons, and milestone records remain intact;
- `.aaw/now.md`, the active task, roadmap, linked milestone, and actual Git state are consistent;
- required target-version behaviors and state-integrity checks pass, or any gaps are stated explicitly;
- no unrelated product file was moved or rewritten;
- no product task was created or executed because of the migration request;
- the target manifest and release metadata agree.

Do not claim a check passed unless it was actually performed. If a relevant check cannot run, record the reason and leave it unverified.

### 7. Finalize and stop

Only after successful reconciliation and verification:

1. Update `AGENTS.md` and any harness adapters last, after target workflow files and project state have been reconciled and verified. Keep the adapter thin and aligned with `AGENTS.md`.
2. Update `.aaw/manifest.yml` to the target `AAW_VERSION` and appropriate `AAW_SCHEMA` after the control-plane instructions are ready.
3. Remove `.aaw/migration.yml` only after all migration checks pass.
4. Report source and target versions, preserved/changed files, checks run, unresolved caveats, and the Git diff/checkpoint state.
5. Stop. Do not continue into application work from the same request.

## Recovery

Never trust chat history as proof that a migration step completed. If interrupted, read `.aaw/migration.yml`, inspect actual files and Git diffs, and classify the migration as `COMPLETE`, `PARTIAL`, `UNCHANGED`, or `INCONSISTENT`. Continue only migration work. If it cannot be made safe, keep the lock active and report the exact blocker.

## Compatibility notes

- **0.7.4 → 0.8.x:** perform the one-time `dev/` to `.aaw/` state-layout migration, change `AAW_SCHEMA` from `1` to `2`, preserve historical records, then apply all target-release changes.
- **0.7.3 and earlier → 0.8.x:** establish the exact source version and reconcile its known lifecycle differences before applying the 0.8.x layout. Do not pretend missing 0.7.4 metadata or cancellation fields already exist.
- **0.8.0/0.8.1 → 0.8.2:** preserve the existing `.aaw/` layout and state, merge the 0.8.2 workflow/documentation changes, correct the task-review and README-policy inconsistencies, verify, then update control instructions and manifest according to the sequence above.
- **Any downgrade:** verify backwards compatibility of all state and metadata first. Never delete or flatten state merely to make the older template fit.
- **Existing project files:** never replace project-specific README, LICENSE, CHANGELOG, `CONTEXT.md`, `ARCHITECTURE-MAP.md`, `.aaw/project.md`, `.aaw/verification.md`, task records, or ADRs wholesale with template placeholders.
