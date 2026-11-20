<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# vejal-bd: agent guide

An anonymous, moderated public ledger of bribery (ঘুষ) and adulteration (ভেজাল) reports in Bangladesh. Start by reading [PROJECT.md](PROJECT.md).

## Sources of truth (read before changing anything)

1. [Design spec](docs/superpowers/specs/2026-11-20-vejal-bd-platform-design.md): what and why.
2. [Phase 1 plan](docs/superpowers/plans/2026-11-21-phase-1-anonymous-ledger.md): tasks, exact interfaces and tests. Work task by task and tick the checkboxes.
3. [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN.md](DESIGN.md), [SECURITY.md](SECURITY.md).

If code and spec disagree, stop and ask. Don't silently pick one.

## Non-negotiable rules

- **Privacy guarantees in [SECURITY.md](SECURITY.md) are hard limits.** Never store or log raw IPs, plaintext email or username, phone numbers, real names, request bodies or image metadata. No `console.log` of request data.
- Never add third-party scripts, analytics, trackers or runtime CDN assets.
- No creator, author or "made by" attribution anywhere in the site.
- Public queries return only `PublicReport` fields. Upazila and area text are admin-only.
- Every admin page and server action calls `requireRole()` itself.
- UI copy is Bangla. Use the fixed strings in [DESIGN.md](DESIGN.md#fixed-copy) exactly.
- Build UI from shadcn components. Import Motion only as `m` from `src/components/motion.tsx`. Recharts only on `/stats`.

## Workflow

- Test-driven: write the failing test, watch it fail, implement, watch it pass.
- Unit tests go in `tests/lib`, integration tests against real Postgres in `tests/int`.
- One commit per plan task, conventional-commit style (`feat:`, `fix:`, `chore:`).
- Don't add dependencies the plan doesn't list without asking.
- Check `npm test`, `npm run test:int`, `npm run build` and `npm run perf` before calling a task done.

## Commands (available after Phase 1, Task 1)

```bash
# Dev DB and MinIO are remote (see .env). docker-compose.dev.yml is an optional local MinIO.
npm run dev | npm test | npm run test:int | npm run build | npm run perf
npm run db:generate | npm run db:migrate | npm run db:seed
```
