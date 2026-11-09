# AAW Installation Procedure

**Purpose:** install Adaptive Agent Workflow into a project that does not already have AAW. This is an agent-facing procedure. For an existing AAW installation, use [`aaw-migration.md`](aaw-migration.md) instead.

Installation is workflow maintenance, not product development. Do not create or execute a product task just because AAW is being installed.

## 1. Confirm source and target

1. Identify the version the user requested. If they ask for a specific version, use that version. If they ask for the current/latest version, inspect the canonical GitHub repository and its version metadata rather than assuming a tag or branch is current.
2. Inspect the fetched template's `.aaw/manifest.yml`. Its `AAW_VERSION` identifies that source copy; `AAW_SCHEMA` identifies the workflow-state layout.
3. Inspect the target repository's root, `git status`, relevant diffs, existing `AGENTS.md` or harness instructions, README, `.aaw/`, and project-specific documentation.
4. Determine whether AAW is already installed. Check `.aaw/manifest.yml` first, then inspect concrete legacy workflow markers if the manifest is missing. If an installation exists or the state is uncertain, stop this procedure and use or resolve the migration path. Do not overwrite an existing workflow as if the project were empty.
5. Decide whether the target is a genuinely empty/new project or an existing project with code, docs, instructions, or state.

If the requested source version is unavailable or the target's existing state cannot be safely classified, stop and report the specific blocker rather than guessing.

## 2. Protect existing project content

Before copying or merging anything, identify collisions and classify the contents. A matching filename does not prove that the file is disposable or entirely AAW-owned.

Always preserve or carefully merge:

- the target project's existing root `README.md`;
- existing `AGENTS.md` instructions and harness-specific instructions;
- project code, configuration, tests, and user changes;
- `CONTEXT.md` and `ARCHITECTURE-MAP.md`, which must describe the actual project;
- `.aaw/` state and records if any are present;
- `docs/`, especially project decisions in `docs/adr/`;
- the target project's `LICENSE` and `CHANGELOG.md`;
- unrelated files that happen to be located in or near workflow folders.

Do not copy the template repository's root README, LICENSE, or CHANGELOG wholesale into the target project. The README must describe the target project; the license must match the target project's licensing; and the changelog must describe that project's changes.

## 3. Install and reconcile workflow files

1. Add the target version's AAW core files, including `.aaw/` policies/templates/state structure. Prepare a merged root `AGENTS.md`, but write it only after the other referenced files have been installed and checked. Merge with existing project instructions; do not blindly replace them.
2. Prepare `.github/copilot-instructions.md` only when it is useful for the target harness. Write or update it after `AGENTS.md` is ready, and keep it as a thin adapter that points to `AGENTS.md`; do not duplicate the workflow there.
3. Install the AAW maintenance procedures under `docs/workflow/` where practical, including `aaw-installation.md` and `aaw-migration.md`, so future maintenance has a clear procedure. Merge with any existing workflow documentation rather than deleting project-specific docs.
4. Keep `wiki/` only if the user wants the human guide inside the target project. The core workflow must work without it.
5. Do not install third-party skills or global personal preferences as if they were included in this template. If the user asks to install skills, follow `.aaw/skill-dependencies.md` and resolve each skill's dependency closure.
6. Reconcile `.aaw/project.md`, `.aaw/constraints.md`, `.aaw/quality.md`, `.aaw/security.md`, `.aaw/roadmap.md`, `.aaw/now.md`, `.aaw/verification.md`, `.aaw/parking-lot.md`, and any existing task/milestone records with the real project. Preserve valid user-provided information. Do not invent product goals, requirements, tasks, or verification claims.
7. Initialize or reconcile `ARCHITECTURE-MAP.md` from the actual codebase. Do not leave template placeholders once codebase discovery starts.
8. Validate the non-control-plane files, then write the prepared root `AGENTS.md` and any harness adapter so they do not point to missing or unverified files. Set `.aaw/manifest.yml` to the source version only after the core files and state have been reconciled and validated. Keep `AAW_SCHEMA` consistent with that source version; for 0.8.x, it is `2`.

## 4. Project-specific bootstrap

### Empty or new project

- Create a new user-facing root `README.md` based on facts that are known about the project. A concise placeholder is better than invented product details.
- Initialize the workflow phase to `DISCOVERY_PENDING`.
- Keep the current task and product task list empty. Do not create `T-0001` merely for installation.
- Initialize the project state and codebase map without pretending that product discovery is already complete.

### Existing project

- Preserve the existing root README and update it only when the integration materially changes how a human should understand or use the project.
- Inspect existing project code, instructions, workflow data, task records, roadmap, and Git changes before reconciling state.
- Do not reset or normalize historical records solely to make them look like newly generated templates.

## 5. Verify the installation

At minimum, verify all of the following:

- required core AAW files exist and references point to the correct locations;
- root `AGENTS.md` contains the canonical workflow rules;
- any harness adapter is thin and does not contradict `AGENTS.md`;
- `.aaw/manifest.yml` accurately records the installed version and schema;
- `.aaw/` state describes the real project and existing task/milestone records remain intact;
- `ARCHITECTURE-MAP.md` and `.aaw/verification.md` are project-specific and truthful;
- a new project is in `DISCOVERY_PENDING` with no invented product task;
- the target README, license, changelog, ADRs, user changes, and unrelated files were not overwritten;
- state-integrity checks pass, or every remaining issue is reported explicitly.

Only claim success for checks actually performed. If something cannot be verified, name the limitation and leave the state explicit.

## 6. Initial commit and stop condition

After a new/empty-project bootstrap has passed validation, read `.aaw/commit-policy.md`. By default, ask the user whether to create an `Initial commit`; if `initial: auto` is configured, commit only after verifying that the commit includes installation changes and no unrelated user changes.

Report what was installed, the version, checks performed, conflicts or caveats, and the Git diff/checkpoint status. Then stop. Do not interpret the same installation request as authorization to begin product discovery, create a task, or implement application features.
