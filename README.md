# vejal-bd

**ঘুষ, ভেজাল আর অনিয়মের বেনামী পাবলিক খাতা।**
An anonymous, moderated public ledger where people in Bangladesh report bribery (ঘুষ), adulteration (ভেজাল) and other everyday wrongdoing. One report is an allegation; many reports reveal a pattern.

> Status: **planning complete, implementation not started.** The repo currently holds the Next.js scaffold plus the design and plan documents.

## Principles

- **Real anonymity.** Reporting needs no account. No raw IPs, no photo metadata, no plaintext emails, no phone numbers are stored. The privacy policy says exactly what we keep, and nothing is logged in secret.
- **Organisations, never people.** Reports may name an office, shop or brand, never a private individual.
- **Allegation, not verdict.** Every report is marked unverified (`অযাচাইকৃত অভিযোগ`).
- **Phone-first and fast.** Most visitors use mid-range Android phones on mobile data.

## Documents

| File | What it covers |
|---|---|
| [PROJECT.md](PROJECT.md) | What we're building, for whom, scope and phases |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System components, data flow, privacy model |
| [DESIGN.md](DESIGN.md) | UI/UX design system, mobile rules, performance budget |
| [SECURITY.md](SECURITY.md) | Security and privacy guarantees, reporting vulnerabilities |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents (CLAUDE.md and GEMINI.md import it) |
| [Design spec](docs/superpowers/specs/2026-11-20-vejal-bd-platform-design.md) | Full product and technical design (source of truth) |
| [Phase 1 plan](docs/superpowers/plans/2026-11-21-phase-1-anonymous-ledger.md) | Step-by-step implementation plan |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Motion · PostgreSQL 16 + Drizzle · MinIO · Docker Compose · Cloudflare Tunnel.

## Getting started

These commands work once Phase 1, Task 1 of the plan is done:

```bash
cp .env.example .env    # fill in secrets (each at least 32 bytes)
# Dev DB and MinIO are remote (see .env). docker-compose.dev.yml is an optional local MinIO.
npm install
npm run db:migrate && npm run db:seed
npm run dev             # http://localhost:3000
```

```bash
npm test                # unit tests
npm run test:int        # integration tests (needs dev Postgres)
npm run perf            # mobile Lighthouse budgets
```

Production deployment is covered in `docs/deploy.md` (written in Phase 1, Task 15).
