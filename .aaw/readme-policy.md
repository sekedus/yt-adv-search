# Root README Policy

The root `README.md` is the project's **human-facing orientation document**. It is not a task diary, implementation log, or agent memory dump.

## Readability Rules

Write for a beginner who has not read the chat or source code.

- Use clear headings that tell readers what each section answers.
- Keep each paragraph focused on one main idea.
- Prefer one to three short sentences per paragraph. Use more only when the sentences form one simple explanation.
- If a sentence explains several independent behaviors, split it into separate sentences, bullets, or a small subsection.
- Prefer familiar words. Explain unavoidable technical terms the first time they appear.
- Use lists for steps, options, features, limitations, and groups of related facts.
- Put detailed implementation notes in linked documentation, not in the main README.
- Keep line wrapping natural; do not hard-wrap every line to an arbitrary pixel or character count. The goal is comfortable scanning, not a fixed physical width.
- Do not remove important behavior, prerequisites, limitations, or security facts merely to shorten the text.

When editing an existing dense paragraph, preserve every distinct fact. Split the information by topic and verify that the revised version still conveys the same behavior and constraints.

## Purpose

A new human should be able to understand, without reading chat history:

- what the project is;
- what problem it solves;
- current important capabilities and scope;
- how to run or use it;
- important prerequisites and constraints;
- where deeper documentation lives.

## Keep History Elsewhere

`README.md` is not the release changelog. Use `CHANGELOG.md` for meaningful release-facing changes when the project maintains one.

Do not copy task-by-task history, implementation notes, every test result, or the full architecture map into the README.

## Bootstrap / Existing Project

Preserve an existing project README. For an empty/new project, create a concise human-facing README from the project's real state rather than copying the AAW template README.

The AAW source repository's own README is a human-friendly introduction to the workflow template. It may include short instructions for agents that maintain the template, but it is not an application README and must not be copied verbatim into a target project.

## Task Completion Review

Ask internally:

> Did this task materially change what a new human needs to know about the project?

Only update the README when the answer is yes. After implementation and verification, the task still enters `AWAITING_USER_REVIEW` even if no README update is needed.
