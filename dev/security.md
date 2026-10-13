# Project Security Profile

This file maps the project's actual attack surface to the security workflows that should be used.
It is intentionally project-specific. Do not copy an entire security catalog into the project.

## 1. Project Security Classification

Mark only what applies:

- [x] Public web application (static search/tools/settings pages)
- [x] REST API (`GET /api/search`, `GET /api/channel` on Worker)
- [ ] GraphQL API
- [ ] Authentication / authorization / sessions
- [ ] OAuth 2.0 / OpenID Connect / SSO
- [ ] JWT
- [ ] Payments / financial data
- [ ] File upload / file processing
- [x] User-generated content / rich text / HTML (query text + API snippet titles rendered)
- [ ] Sensitive or regulated data
- [x] Secrets / API keys (`YOUTUBE_API_KEYS` server-only)
- [ ] Database exposed to untrusted input
- [x] Server-side network access / SSRF-sensitive features (proxy to googleapis — fixed host only)
- [x] Cloud infrastructure (Cloudflare Worker)
- [ ] Containers
- [ ] Kubernetes
- [ ] CI/CD or software supply chain
- [ ] Mobile application
- [ ] Desktop / endpoint application
- [ ] Network infrastructure
- [ ] LLM / AI application
- [ ] RAG / vector database
- [ ] MCP / agent tooling
- [ ] Cryptography / key management
- [ ] Other: ...

## 2. Primary Attack Surface

- Untrusted users: search query text, operator prefixes, tools input (URL/handle/username), settings values.
- Public endpoints: `GET /`, `/tools`, `/settings` (static); `GET /api/search?...`, `GET /api/channel?...` (proxy).
- Authentication boundary: none in v1 (no login).
- Authorization boundary: none in v1; quota abuse limited by rate/error handling, not per-user auth.
- Sensitive data: `YOUTUBE_API_KEYS` — must never appear in responses, logs, or client JS.
- External services: `https://www.googleapis.com/youtube/v3/search`, `/channels`, `/videos` only.
- Files / parsing: query/operator parsing (`channel:`, `handle:`, `before:`/`after:`); URL parsing for resolver.
- Network egress: Worker → googleapis only; no open proxy.
- Deployment/infrastructure: Cloudflare Worker secrets (prod) + local `.env` (never committed).

## 3. Security Skill Routing

Selected for this surface only:

- Web/API: input validation + output encoding (XSS via video titles/descriptions), query allow-listing for `search.list` params, fixed-host egress.
- Secrets: server-only handling, no key reflection in errors, key-index status only (no values).
- Abuse: basic per-IP throttling consideration at Worker edge; quota-exhaustion messaging without oracle details.

Do not invoke full pen-test, OAuth/JWT, mobile, container, or AI-security workflows for v1.

## 4. Selection Rule

```text
Public web + Worker REST proxy + server secrets
    -> trust boundaries (browser | worker | googleapis)
    -> attack surface (query input, resolver input, key handling, fixed egress)
    -> security domain (web app + API + secrets)
    -> primary assessment: targeted review (XSS/validation/egress/secrets)
    -> targeted tests + evidence
```

## 5. Security Gate Levels

- T-0001 (proxy/rotation): Level 1 — Security-Relevant → targeted secrets/egress/validation review + abuse tests.
- T-0002/T-0003/T-0004 (pages): Level 0/1 — normal verification + XSS/output-encoding check on rendered snippets.

## 6. Evidence

Record per task:

```text
Security level:
Attack surface:
Skills/workflows used:
Tools/tests executed:
Findings:
Remaining uncertainty:
```
