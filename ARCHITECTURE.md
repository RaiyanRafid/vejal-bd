# Architecture

Full detail: [design spec §6–§8](docs/superpowers/specs/2026-11-20-vejal-bd-platform-design.md) and the [Phase 1 plan](docs/superpowers/plans/2026-11-21-phase-1-anonymous-ledger.md).

## System

```
Visitor ──HTTPS──▶ Cloudflare ──Tunnel (cloudflared)──▶ VPS (USA, Docker Compose)
                                                         ├─ app       Next.js 16 standalone
                                                         ├─ postgres  PostgreSQL 16
                                                         ├─ minio     image storage (S3 API)
                                                         └─ cron      cleanup + encrypted backups
```

- There are **no open inbound ports**. All traffic arrives through `cloudflared`.
- Cloudflare terminates TLS and can see visitor IPs. Its logging is set to the minimum, and the privacy policy says so.
- Everything runs as **one Next.js app**: Server Components for pages, Server Actions for writes, and a few route handlers (`/api/captcha`, `/api/entities`, `/images/[key]`).

## Code layout

```
src/app/            routes: public pages, /report, /track, /admin, (info) pages
src/components/     ui/ (shadcn), shell/, charts/, motion.tsx
src/lib/            domain logic, unit-testable, no React
  db/               Drizzle schema, client, seed
  crypto/           hmac, password (argon2id+pepper), tracking codes, daily IP hash
  reports/          field schemas, submit, queries, stats, moderation, flags
  auth/             sessions, admin login + TOTP, requireRole
  images.ts         sharp pipeline: rotate → resize → WebP, strip all metadata
  ratelimit.ts, captcha.ts, entities.ts, audit.ts, format/bn.ts
tests/lib           unit tests      tests/int   integration tests (real Postgres)
scripts/            create-admin, cleanup, backup
```

## Report lifecycle

```
submit (no account)
  → rate limit (daily-salted IP hash) → proof-of-work captcha (ALTCHA)
  → Zod validation → images re-encoded, metadata stripped → MinIO
  → reports row: status=pending, trackingHash, flags (phone/email found?)
  → tracking code shown once
admin queue → redact → approve / reject (reason visible via tracking code)
  → approved images become servable → public ledger + stats
```

## Privacy model

| Data | How it is stored |
|---|---|
| Visitor IP | Never stored. `HMAC(ip, today's random salt)` is used only for rate limiting. Salts older than today are deleted, and rows are deleted after 30 days. |
| Photos | Rotated, resized and re-encoded to WebP with **all** metadata removed. The original upload is never kept. Photos are private until approved. |
| Upazila / area text | Admin-only. Public pages show only division and district. |
| Tracking code | Only `HMAC(code)` is stored. |
| Password | argon2id with its own per-password salt, plus a pepper kept in the environment. |
| Username / email | `HMAC-SHA256` with a separate secret key for each. Plaintext is never stored. Each hash records a key version so keys can be rotated. |
| Stats | Any cell with fewer than 3 reports is hidden. |
| Sessions | DB-backed. Only the SHA-256 of the token is stored. httpOnly, Secure, SameSite=Strict cookie. |

Secrets live only in environment variables, never in the database or the repo.

## Data model (main tables)

`issue_types`, `divisions`/`districts`/`upazilas`, `entities`, `reports` (type-specific fields in `details` JSONB, stats columns indexed), `report_images`, `users` (no plaintext identity), `sessions`, `rate_limits`, `ip_salts`, `ip_blocks`, `admin_audit_log`, `transparency_requests`. Phase 2 adds `votes`, `comments`, `bans` and `email_tokens`.

## Frontend performance

Pages are Server Components by default. Charts on the home page and ledger are server-rendered HTML/SVG with no client JS. Recharts loads only on `/stats` through `next/dynamic`. Motion is loaded through `LazyMotion` (~5 KB). Lighthouse CI enforces the mobile budgets listed in [DESIGN.md](DESIGN.md).
