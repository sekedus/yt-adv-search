# Commit Policy

This project uses three independent commit checkpoints:

- `initial` — after Adaptive Agent Workflow bootstrap in an empty/new project.
- `planning` — after a standalone planning-only transaction creates or materially updates a task, or a genuine milestone and its planned child tasks.
- `task` — only after a task has met all acceptance and verification gates, including HDT when required.

## Defaults

```yaml
initial: ask
planning: ask
task: ask
```

The default is to ask the user before creating a commit.

## Allowed Values

Each checkpoint may use:

- `ask` — offer the commit and wait for the user.
- `auto` — create the commit automatically when all checkpoint-specific safety checks pass.

## Configuration Examples

```yaml
# Ask for all checkpoint types.
initial: ask
planning: ask
task: ask

# Bootstrap and planning auto-commit; completed tasks still ask.
initial: auto
planning: auto
task: ask

# Keep bootstrap/planning asks, automatically commit completed tasks.
initial: ask
planning: ask
task: auto
```

## Planning Checkpoint

For a standalone planning-only request, apply this checkpoint after creating/materially updating a task record or a genuine milestone with planned child tasks:

1. update the task or milestone, `.aaw/roadmap.md`, and `.aaw/now.md` as applicable;
2. inspect related parking-lot candidates only when planning a genuine milestone; never promote them unless the user selected them;
3. inspect Git status/diff and confirm the checkpoint contains only the planning changes;
4. if `planning: ask`, offer a planning commit; if `planning: auto`, commit only when the scope is unambiguous and safe;
5. stop after the planning checkpoint. Planning never authorizes implementation by itself.

If the same user request explicitly authorizes implementing a named task as well, do not pause for a separate planning checkpoint; keep the plan and implementation in the same bounded transaction and apply the task checkpoint at the end. Do not create an empty or duplicate commit.

Use one concise message appropriate to the planning record:

```text
chore: plan T-0001 <task-name>
```

or:

```text
chore: plan M-0001 <milestone-name>
```

## Auto-Commit Safety Rules

An `auto` policy does not bypass verification or state integrity.

Before an automatic commit, the agent must:

1. complete the checks appropriate to that checkpoint (for `task`, all applicable automated verification and required HDT; for `planning`, planning/state consistency checks);
2. synchronize affected project state;
3. review README impact when applicable;
4. pass the state-integrity check;
5. inspect Git status and diff;
6. ensure the commit contains only changes belonging to the current checkpoint.

If unrelated user changes are present or the intended commit scope cannot be determined safely:

- do not auto-commit;
- preserve the working tree;
- explain the conflict;
- ask the user whether to proceed manually.

Automatic commits never imply automatic `git push`.

If required HDT is pending, failed, or declined, do not apply the normal completed-task commit policy. Keep the task active and unverified at that gate. The user may explicitly request a partial checkpoint commit; if so, commit only the requested scoped changes and leave the task status incomplete.

## Commit Messages

Initial bootstrap:

```text
chore: initialize adaptive agent workflow
```

Planning checkpoint:

```text
chore: plan T-xxxx <task-name>
chore: plan M-xxxx <milestone-name>
```

Completed task:

```text
feat: <task outcome>
```

Use an appropriate conventional-commit type when the task clearly fits another category, such as `fix:` or `refactor:`.

## Changing the Policy

The user may change the policy using natural language, for example:

- `keep asking before commits`
- `automatically commit the initial setup`
- `auto-commit after planning tasks/milestones`
- `auto-commit after every completed task`

After changing the policy, update this file and `.aaw/now.md` when the change affects the current checkpoint.
