# AAW Migration

**Applies to Adaptive Agent Workflow 0.7.1 and later.** This version includes the structural migration from 0.7.x to 0.8.0.

This is an agent-facing procedure for upgrading, downgrading, repairing, or migrating AAW in an existing project. It is not product-development work.

## Principle

An AAW migration changes the workflow control plane and workflow-state layout while preserving product state and unrelated user changes.

```text
product source and project knowledge = protected
AAW-owned workflow state             = relocatable, not disposable
```

The user can express intent naturally, for example `update AAW to 0.8.0` or `migrate this project to AAW v0.8.0`.

## Version source of truth

Read `.aaw/manifest.yml` when present. `AAW_VERSION` is authoritative. For 0.8.0, the manifest schema is `2` because the workflow-state layout changes.

```yaml
AAW_ID: adaptive-agent-workflow
AAW_SOURCE: https://github.com/sekedus/adaptive-agent-workflow
AAW_VERSION: 0.8.0
AAW_SCHEMA: 2
```

For older installations without a manifest, use concrete repository evidence. If the exact installed version cannot be established safely, stop before modifying workflow files; do not guess.

## Migration lock and freeze

Before changing workflow files, write `.aaw/migration.yml`:

```yaml
mode: MIGRATION
status: ACTIVE
from: 0.7.4
to: 0.8.0
```

If a new session finds an active lock, reconcile actual files and continue that migration before any product work. While the lock is active, do not create, modify, complete, or reprioritize product tasks; do not execute application work; preserve product code, decisions, active task meaning, and unrelated changes.

## 0.8.0 layout

In 0.8.0, `.aaw/` is the home for AAW-managed workflow state and policy. `docs/` remains for human-facing project documentation and project-specific ADR/design material. Root `AGENTS.md` remains the canonical workflow instruction source; `ARCHITECTURE-MAP.md` remains a compact codebase navigation map; `CONTEXT.md` remains durable domain vocabulary.

```text
.aaw/
├── manifest.yml
├── project.md
├── constraints.md
├── roadmap.md
├── now.md
├── parking-lot.md
├── quality.md
├── security.md
├── verification.md
├── hdt.md
├── state-integrity.md
├── commit-policy.md
├── changelog-policy.md
├── readme-policy.md
├── skill-dependencies.md
├── milestones/
├── tasks/{done,cancelled}/
└── bug-fixes/{done,cancelled}/
```

No `features/` work-record folder is part of the 0.8.0 workflow. Do not delete legacy feature records automatically; preserve them as historical project data, or move them only through an explicit, safe reconciliation with the user/project.

## Migration procedure

### 1. Inspect

Check `git status`, relevant diffs, `.aaw/manifest.yml`, the current state files, and the contents of the legacy `dev/` directory. Preserve unrelated user changes. Do not assume the worktree is clean.

### 2. Create the lock and freeze product work

Create `.aaw/migration.yml` with `status: ACTIVE`. No product task or milestone is created or executed for the migration itself.

### 3. Relocate workflow-owned files

For a 0.7.x project, AAW-managed files historically live under `dev/`. Move each workflow-owned item to the corresponding path under `.aaw/`, preserving relative paths and file contents. Examples:

| Legacy 0.7.x path | Target 0.8.0 path |
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
| other AAW-owned `dev/*.md` policy/state files | `.aaw/<same-basename>` |

Use `git mv` for tracked files when possible, or an equivalent file move that preserves the content. If the source and target both exist, compare and reconcile the two; never overwrite one automatically. Move only known AAW-owned files/folders. If `dev/` also contains application code or unrelated user files, leave those items in place and do not remove the directory unless it is empty after migration.

Do not create a new empty task, milestone, or bug record merely to populate the new structure. Preserve IDs, frontmatter, task status, cancellation reasons, HDT evidence, milestone strikethroughs, and active-task meaning.

### 4. Update AAW path references

Update references to relocated AAW-managed files in `AGENTS.md`, harness adapters, README/template guidance, task/milestone templates, workflow documentation, and other AAW-owned docs. Only change `dev/...` references when they refer to AAW's old state layout. Do not perform a blind repository-wide replacement that could alter application paths or unrelated project documentation.

Keep project README and product documents intact apart from necessary, project-approved links to moved AAW state. Preserve `docs/adr/` and other project documentation in `docs/`.

### 5. Apply 0.8.0 workflow semantics

- Replace the legacy `dev/` state layout with `.aaw/` as the canonical state location.
- Use manifest `AAW_VERSION: 0.8.0` and `AAW_SCHEMA: 2`.
- Keep active tasks under `.aaw/tasks/`, complete tasks under `.aaw/tasks/done/`, and cancelled tasks under `.aaw/tasks/cancelled/`.
- Keep standalone bug records under `.aaw/bug-fixes/` with separate `done/` and `cancelled/` archives.
- Keep milestone summaries under `.aaw/milestones/`.
- Triage requests before creating records: related small items with one coherent acceptance/verification boundary use one task and no milestone. A milestone is for a genuinely large/broad coordinated outcome requiring multiple independently trackable tasks (usually three or more; two only when real dependencies/phases/shared exit criteria warrant it).
- Preserve the 0.7.4 rules for YAML frontmatter, cancellation reasons, milestone strikethroughs, HDT completion gates, planning checkpoints, and verification-evidence reuse.
- Do not auto-create milestones for existing single tasks, and do not mark a milestone complete merely because its sole task is complete. Resolve existing one-task milestones by preserving project history and either keep as legacy/history or reconcile with the user; do not destructively rewrite historical state just for normalization.

### 6. Update control instructions last

Only after state files are relocated and references have been reconciled, update `AGENTS.md` and `.github/copilot-instructions.md`. These must point to `.aaw/` and contain the no-single-task-milestone rule.

### 7. Verify

At minimum, confirm:

- target workflow files exist under `.aaw/`;
- no required AAW state was lost or overwritten;
- task IDs, statuses, HDT evidence, cancellation reasons, and milestone records remain intact;
- current task pointer, roadmap, linked milestone, and Git state are consistent;
- relevant AAW references no longer point to old `dev/` paths, except explicit historical/migration source-path documentation;
- no unrelated product file was moved or rewritten;
- no product task was created or executed because of the migration request;
- manifest values and release metadata agree.

### 8. Finalize and stop

Update the manifest to the target version/schema only after successful reconciliation. Remove `.aaw/migration.yml` only after verification passes. Report the migration summary, relevant caveats, and Git diff. Stop; do not continue into product work from the same request.

## Recovery

Never trust chat history as proof that a migration step completed. If interrupted, read `.aaw/migration.yml`, inspect actual files and Git diffs, classify the migration as `COMPLETE`, `PARTIAL`, `UNCHANGED`, or `INCONSISTENT`, and continue only migration work. If it cannot be made safe, keep the lock active and report the exact blocker.

## Compatibility notes

- **0.7.4 → 0.8.0:** relocate AAW-owned state files from legacy `dev/` paths to `.aaw/`, update only AAW-owned path references, change `AAW_SCHEMA` from `1` to `2`, apply no-single-task-milestone triage, preserve task/milestone/bug history, verify, then update control instructions last.
- **0.7.3 and earlier → 0.8.0:** first establish the exact source version and reconcile its known lifecycle differences before applying the 0.8.0 layout. Do not pretend missing 0.7.4 metadata or cancellation fields already exist.
- **Existing project files:** never replace project-specific `README.md`, `CONTEXT.md`, `ARCHITECTURE-MAP.md`, `.aaw/project.md`, `.aaw/verification.md`, or task records wholesale with template placeholders. Merge workflow semantics while preserving actual project facts.
