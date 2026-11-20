# vejal-bd Phase 1 — Anonymous Reporting, Admin & Public Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 1 of the spec: anyone can file an anonymous ঘুষ/ভেজাল report, admins moderate it in `/admin`, and approved reports appear in a public Bangla ledger with basic stats and transparency/privacy pages.

**Architecture:** One Next.js 16 App Router app (existing scaffold) with Server Actions and route handlers, Drizzle ORM over self-managed PostgreSQL, MinIO for images, all run with Docker Compose on a USA VPS behind `cloudflared`. Pure logic (crypto, validation, formatting, ranking-free stats) lives in `src/lib/**` and is unit-tested; DB-touching functions are integration-tested against a real Postgres.

**Tech Stack:** Next.js 16.4.6, React 19.3, TypeScript 5, Tailwind 4, PostgreSQL 16, Drizzle ORM + drizzle-kit, Zod, `argon2`, `sharp`, MinIO (`@aws-sdk/client-s3`), `altcha` + `altcha-lib`, `otplib`, shadcn/ui (Radix, vaul, sonner), Motion (`LazyMotion` + `m`), lucide-react, react-hook-form, Recharts (via shadcn `chart`, `/stats` only), Vitest, Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-11-20-vejal-bd-platform-design.md`

## Global Constraints

- Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (Next 16 differs from older versions; `cacheComponents: true` is on — dynamic data needs `<Suspense>` or `"use cache"` per the docs; check the docs for the current name of middleware/proxy).
- **Never store or log:** raw IP, plaintext email/username, phone, real names, request bodies, image EXIF. No `console.log` of request data.
- **No third-party scripts or CDN assets** at runtime. Fonts via `next/font` (self-hosted at build).
- **No creator attribution** anywhere (footer, `metadata`, OG tags, about page, error pages).
- UI language Bangla; `<html lang="bn">`; display numbers with Bangla digits; money as ৳ with lakh/crore.
- Tracking code format: `VJ-XXXX-XXXX` (Crockford base32, no I/L/O/U).
- Stats never render a breakdown cell with fewer than **3** reports.
- Public fields: issue type, division, district, entity, category, incident month, amount/outcome or ভেজাল fields, redacted description, approved images. **Upazila and area text are admin-only.**
- Every public report shows badge `অযাচাইকৃত অভিযোগ` and the note `একটি রিপোর্ট একটি অভিযোগ মাত্র, দোষ প্রমাণ নয়।`
- Description field warning copy: `কারো ব্যক্তিগত নাম লিখবেন না`.
- Rate-limit rows deleted after **30 days**; IP hash salt rotates **daily** and old salts are deleted.
- Admin and moderator accounts require TOTP 2FA. Every admin route **and** server action checks role itself.
- Secrets only from env: `PASSWORD_PEPPER_V1`, `HMAC_USERNAME_KEY_V1`, `HMAC_EMAIL_KEY_V1`, `HMAC_TRACKING_KEY_V1`, `TOTP_ENC_KEY`, `ALTCHA_HMAC_KEY`, `DATABASE_URL`, `TEST_DATABASE_URL`, `S3_*`.
- **Mobile-first and fast:** design at 360px width first; pages are Server Components unless they need interactivity; mobile Lighthouse budgets from Task 2 (LCP ≤ 2.5 s, script ≤ 175 KB gzip; `/stats` ≤ 285 KB) must pass. Recharts never loads outside `/stats`. UI built only from Task 2's shadcn components; original design (not a copy of ghush.site).
- Commit after every task with conventional-commit messages ending in the attribution line.

## Review Focus

1. **Amounts typed in Bangla digits or with commas** (`৫,০০০`, `5,000`) — should parse to `5000`, not fail validation. → test in Task 5.
2. **Phone photos that are HEIC, rotated, or >10 MB** — HEIC/oversize get a clear Bangla error; rotation is applied before metadata is stripped so images aren't sideways. → test in Task 7.
3. **Tracking code typed lowercase, with spaces, or without dashes** (`vj 7k2p9qx4`) — still finds the report. → test in Task 4.
4. **Double-tap submit / network retry** — exactly one report is created. → test in Task 8.
5. **Description containing a phone number or email** — still accepted, but flagged in the admin queue so the moderator redacts it. → test in Task 8.

---

## File Structure

```
docker-compose.dev.yml          # postgres + minio for dev/test
docker-compose.prod.yml         # app + postgres + minio + cloudflared
Dockerfile                      # Next standalone build
drizzle.config.ts
vitest.config.ts
.env.example
scripts/create-admin.ts         # CLI: create admin/moderator with TOTP
scripts/cleanup.ts              # cron: delete rate-limit rows >30d, old salts
scripts/backup.sh               # encrypted pg_dump + minio mirror
src/lib/env.ts                  # zod-validated env
src/lib/db/schema.ts            # all Drizzle tables
src/lib/db/client.ts
src/lib/db/seed.ts              # issue types + locations
src/lib/crypto/hmac.ts          # keyed hashes with key versions
src/lib/crypto/password.ts      # argon2id + pepper
src/lib/crypto/tracking.ts      # tracking code gen/normalise/hash
src/lib/crypto/ip.ts            # daily-salted IP hash
src/lib/format/bn.ts            # Bangla digits, ৳, lakh/crore, parse
src/lib/locations/bd.json       # division → district → upazila
src/lib/reports/fields.ts       # per-issue-type option lists + zod schemas
src/lib/reports/submit.ts       # createReport()
src/lib/reports/flags.ts        # contact-pattern detection
src/lib/reports/queries.ts      # public list/detail queries
src/lib/reports/stats.ts        # aggregates with <3 suppression
src/lib/entities.ts             # upsert/search/merge
src/lib/images.ts               # sharp pipeline + S3 put/get
src/lib/ratelimit.ts
src/lib/captcha.ts              # altcha challenge/verify
src/lib/auth/session.ts         # DB sessions, cookies
src/lib/auth/admin.ts           # login, TOTP, requireRole()
src/lib/audit.ts
src/components/ui/*             # shadcn components (generated)
src/components/motion.tsx       # LazyMotion provider, m, presets
src/components/charts/*         # BarList, Sparkline (server), InteractiveChart (Recharts, /stats only)
src/components/shell/*          # Header, BottomNav, StickyCta, ThemeToggle
lighthouserc.json               # mobile performance budgets
src/app/layout.tsx              # modify: lang bn, fonts, no attribution
src/app/page.tsx                # replace: home
src/app/report/...              # submission flow
src/app/track/page.tsx
src/app/reports/page.tsx, reports/[id]/page.tsx
src/app/stats/page.tsx
src/app/(info)/how-it-works|faq|privacy|transparency|disclaimer/page.tsx
src/app/images/[key]/route.ts   # serves approved images only
src/app/admin/...               # login, queue, report review, entities, transparency
tests/**                        # mirrors src/lib
```

---

### Task 1: Tooling, env and dev infrastructure

**Files:**
- Create: `docker-compose.dev.yml`, `vitest.config.ts`, `.env.example`, `src/lib/env.ts`, `tests/lib/env.test.ts`
- Modify: `package.json` (scripts + deps), `.gitignore` (keep `.env*` ignored but un-ignore `.env.example`)

**Interfaces:**
- Produces: `env` — typed object of all Global Constraints secrets; `parseEnv(raw: Record<string,string|undefined>): Env` throws listing missing keys.

- [ ] **Step 1: Install deps** — `npm i drizzle-orm pg zod argon2 sharp @aws-sdk/client-s3 altcha altcha-lib otplib` and `npm i -D drizzle-kit vitest @types/pg tsx`. Add scripts: `test`, `test:int` (`vitest run tests/int`), `db:generate`, `db:migrate`, `db:seed`.
- [ ] **Step 2: `docker-compose.dev.yml`** — `minio/minio` only, with bucket `vejal-images`, credentials from `.env` `S3_ACCESS_KEY`/`S3_SECRET_KEY`, port bound to `127.0.0.1`. The dev database is the team's remote PostgreSQL **16** (`DATABASE_URL` in `.env`, already set up); integration tests use schema `test` in the same database via `TEST_DATABASE_URL` (`search_path=test`, schema already created). `.env` and `.env.example` already exist — keep `parseEnv` keys in sync with `.env.example`.
- [ ] **Step 3: Write failing test** `tests/lib/env.test.ts`:

```ts
it("throws naming every missing secret", () => {
  expect(() => parseEnv({ DATABASE_URL: "postgres://x" }))
    .toThrow(/PASSWORD_PEPPER_V1[\s\S]*HMAC_EMAIL_KEY_V1/);
});
it("rejects secrets shorter than 32 bytes", () => {
  expect(() => parseEnv({ ...validEnv, PASSWORD_PEPPER_V1: "short" })).toThrow();
});
```

- [ ] **Step 4: Run** `npm test -- env` → FAIL (module missing).
- [ ] **Step 5: Implement `parseEnv` / `env` in `src/lib/env.ts`** with Zod; secrets `z.string().min(32)`; `.env.example` lists every key with placeholder values.
- [ ] **Step 6: Run** `npm test -- env` → PASS.
- [ ] **Step 7: Commit** `chore: add tooling, env validation, dev compose`.

### Task 2: Design system, mobile shell and chart primitives

**Files:**
- Create: `components.json` (shadcn), `src/components/ui/*` (generated), `src/components/motion.tsx`, `src/components/charts/BarList.tsx`, `src/components/charts/Sparkline.tsx`, `src/components/charts/InteractiveChart.tsx`, `src/components/shell/{Header,BottomNav,StickyCta,ThemeToggle}.tsx`, `src/app/dev/ui/page.tsx` (component gallery; calls `notFound()` when `NODE_ENV === "production"`), `lighthouserc.json`, `tests/lib/charts.test.tsx`
- Modify: `src/app/globals.css` (theme tokens), `src/app/layout.tsx` (fonts, `lang="bn"`, shell), `package.json`

**Interfaces:**
- Produces:
  - shadcn components in `src/components/ui/`: `button`, `card`, `badge`, `input`, `textarea`, `select`, `drawer` (vaul), `sheet`, `tabs`, `toggle-group`, `progress`, `form`, `skeleton`, `sonner`, `chart` (Recharts wrapper). Later tasks build UI only from these.
  - `<MotionProvider>` (wraps app in `LazyMotion features={domAnimation} strict`) and re-exported `m` from `src/components/motion.tsx`; presets `fadeUp`, `stagger(children: number)`. **Never import `motion` directly** — always `m` (keeps Motion at ~5 KB).
  - `<BarList rows={{ label: string; value: number | null; display?: string }[]} max?: number />` — **Server Component**, pure HTML/CSS bars, 0 KB client JS; `value: null` renders `<৩` and an empty bar.
  - `<Sparkline points={number[]} />` — Server Component, inline SVG `polyline`, 0 KB JS.
  - `<InteractiveChart type="bar"|"line"|"area" data={...} config={ChartConfig} />` — client component built on shadcn `chart` (Recharts); **only ever imported via `next/dynamic` from `/stats`** with a `<Skeleton>` fallback.
  - Theme tokens on `:root` / `.dark` (shadcn CSS variables): neutral base, **one** accent, radius `0.75rem`; dark mode via class + `prefers-color-scheme` default.

- [ ] **Step 1: Install** — `npx shadcn@latest init` (Tailwind 4, CSS variables, `src/components/ui`), then `npx shadcn@latest add button card badge input textarea select drawer sheet tabs toggle-group progress form skeleton sonner chart`; `npm i motion lucide-react react-hook-form @hookform/resolvers`; `npm i -D @lhci/cli @testing-library/react jsdom`.
- [ ] **Step 2: Fonts and layout** — `next/font/google` with `Hind_Siliguri` (subsets `["bengali","latin"]`, weights 400/500/600, `display: "swap"`, variable `--font-bn`) as primary sans and `Geist_Mono` for codes/numbers; remove `body { font-family: Arial }` from `globals.css`; `<html lang="bn">`; wrap in `<MotionProvider>` and `<Toaster />`.
- [ ] **Step 3: Mobile shell** — `Header` (logo text, theme toggle), `BottomNav` visible below `md` (হোম / রিপোর্ট / পরিসংখ্যান / ট্র্যাক), `StickyCta` (`রিপোর্ট করুন`, fixed bottom above `BottomNav`, hidden on `/report/*`), top nav from `md` up. Content max width `42rem` on reading pages; 16px side gutter; respects `env(safe-area-inset-bottom)`.
- [ ] **Step 4: Interaction rules** (apply in every later UI task; listed here once): tap targets ≥ 44×44px; amount inputs `inputmode="numeric"`; pickers with > 8 options open in `Drawer` on mobile; image input `accept="image/jpeg,image/png,image/webp"` with `capture` omitted (lets user choose camera or gallery); all Motion animations ≤ 250 ms and disabled under `prefers-reduced-motion` (`MotionConfig reducedMotion="user"`).
- [ ] **Step 5: Write failing test** `tests/lib/charts.test.tsx`:

```tsx
it("BarList renders suppressed rows as <৩ and scales widths to max", () => {
  render(<BarList rows={[{ label: "ঢাকা", value: 100 }, { label: "সিলেট", value: 50 }, { label: "বান্দরবান", value: null }]} />);
  expect(screen.getByText("<৩")).toBeTruthy();
  expect(screen.getByTestId("bar-সিলেট").style.width).toBe("50%");
});
it("Sparkline renders one polyline with N points", () => {
  const { container } = render(<Sparkline points={[1, 4, 2]} />);
  expect(container.querySelector("polyline")!.getAttribute("points")!.split(" ")).toHaveLength(3);
});
```

- [ ] **Step 6: Run** `npm test -- charts` → FAIL. **Step 7: Implement** `BarList`, `Sparkline`, `InteractiveChart`, motion helpers, shell, `/dev/ui` gallery showing every component in light and dark.
- [ ] **Step 8: Run** `npm test -- charts` → PASS.
- [ ] **Step 9: Performance budget** — `lighthouserc.json` with mobile preset asserting: `largest-contentful-paint` ≤ 2500 ms, `total-blocking-time` ≤ 200 ms, `cumulative-layout-shift` ≤ 0.1, `resource-summary:script:size` ≤ 175 KB (gzip) for `/`, `/reports`, `/report`; `/stats` script budget ≤ 285 KB. Add script `npm run perf` (`next build && lhci autorun`). Run it now against `/dev/ui` and `/` → passes.
- [ ] **Step 10: Commit** `feat(ui): shadcn design system, mobile shell, motion, chart primitives, perf budget`.

### Task 3: Database schema, migrations and seed

**Files:**
- Create: `drizzle.config.ts`, `src/lib/db/schema.ts`, `src/lib/db/client.ts`, `src/lib/db/seed.ts`, `src/lib/locations/bd.json`, `tests/int/helpers.ts`, `tests/int/schema.test.ts`

**Interfaces:**
- Produces tables (Drizzle names): `issueTypes`, `divisions`, `districts`, `upazilas`, `entities`, `reports`, `reportImages`, `users`, `sessions`, `rateLimits`, `ipSalts`, `adminAuditLog`, `transparencyRequests`. Columns exactly as spec §7, with these Phase-1 specifics:
  - `reports`: `id uuid`, `publicId text unique` (8-char base32), `issueType text fk`, `status enum('pending','approved','rejected','hidden') default 'pending'`, `rejectReason enum('spam','personal_name','implausible','duplicate','other')?`, `division`, `district`, `upazila?`, `areaText?`, `entityId?`, `incidentMonth date` (day=1), `description text`, `details jsonb`, `category text`, `amountBdt bigint?`, `outcome text?`, `trackingHash text unique`, `idempotencyKey uuid unique`, `flags text[] default '{}'`, `userId uuid?`, `realWeight/fakeWeight real default 0`, `rankScore real default 0`, `createdAt`, `reviewedAt?`, `reviewedBy?`. Indexes on `(status, createdAt)`, `(status, division)`, `(status, issueType, category)`.
  - `users`: `id`, `pseudonym unique`, `usernameHmac unique`, `emailHmac unique?`, `keyVersion int`, `passwordHash`, `role enum('user','moderator','admin')`, `totpSecretEnc text?`, `mustChangePassword bool default false`, `createdAt`.
  - `ipSalts`: `day date pk`, `salt bytea`.
- Exported types from `schema.ts`: `Status`, `RejectReason`, `EntityKind`, `Role`, `User` (= `typeof users.$inferSelect`), `Report`.
- `ipBlocks` table: `ipHash text pk`, `until timestamptz` (≤ end of current UTC day, since salts rotate daily).
- `siteSettings` table: `key text pk`, `value jsonb`, `updatedAt`, `updatedBy?` (used by Task 12).
- `categories` table: `id`, `issueType fk`, `field enum('category','adulteration_type','detection','service')`, `slug`, `labelBn`, `enabled bool default true`, `sort int`; unique `(issueType, field, slug)`. Seeded from `ISSUE_FIELDS` defaults (Task 5) by Task 12.
- `db` from `client.ts`; `seed()` inserts issue types `ghush` (`ঘুষ`), `vejal` (`ভেজাল`) and the 8 divisions / 64 districts / upazilas from `bd.json` (idempotent).
- Test helper `resetDb(): Promise<void>` truncates all tables on `TEST_DATABASE_URL` and reseeds. A Vitest `globalSetup` runs migrations against `TEST_DATABASE_URL` with Drizzle's `migrationsSchema: "test"` so the test migration journal never touches the dev `drizzle` schema; it refuses to run if `TEST_DATABASE_URL` lacks `search_path=test`.

- [ ] **Step 1: Write failing integration test** `tests/int/schema.test.ts`:

```ts
it("seeds 8 divisions and 64 districts", async () => {
  await resetDb();
  expect(await db.$count(divisions)).toBe(8);
  expect(await db.$count(districts)).toBe(64);
});
it("users table has no plaintext identity columns", () => {
  const cols = Object.keys(getTableColumns(users));
  expect(cols).not.toEqual(expect.arrayContaining(["email","username","phone","name"]));
});
```

- [ ] **Step 2: Run** `npm run test:int -- schema` → FAIL.
- [ ] **Step 3: Implement schema, client, `bd.json`** (division/district names in Bangla with English slug), seed; `npm run db:generate` to create the first migration.
- [ ] **Step 4: Run** `docker compose -f docker-compose.dev.yml up -d && npm run db:migrate && npm run test:int -- schema` → PASS.
- [ ] **Step 5: Commit** `feat(db): schema, migrations, location seed`.

### Task 4: Crypto primitives

**Files:**
- Create: `src/lib/crypto/{hmac,password,tracking,ip}.ts`, `tests/lib/crypto.test.ts`, `tests/int/ip.test.ts`

**Interfaces:**
- `hmac(purpose: "username"|"email"|"tracking", value: string, version?: number): string` — hex HMAC-SHA256 with `HMAC_<PURPOSE>_KEY_V<version>`; default current version. `normaliseIdentity(v: string): string` = trim + NFKC + lowercase.
- `hashPassword(pw: string): Promise<string>` / `verifyPassword(hash: string, pw: string): Promise<boolean>` — argon2id (`memoryCost 19456, timeCost 2`) with `secret: PASSWORD_PEPPER_V1`.
- `newTrackingCode(): string` → `VJ-XXXX-XXXX`; `normaliseTrackingCode(input: string): string | null`; `trackingHash(code: string): string` = `hmac("tracking", normalised)`.
- `ipHash(ip: string, now?: Date): Promise<string>` — HMAC with today's random salt from `ipSalts` (created on first use of the day); `deleteOldSalts(now?: Date)` deletes every salt whose day < today.

- [ ] **Step 1: Write failing tests:**

```ts
it("tracking code normalises sloppy input", () => {
  const c = "VJ-7K2P-9QX4";
  for (const s of ["vj 7k2p9qx4", "vj-7k2p-9qx4", " VJ7K2P9QX4 "])
    expect(normaliseTrackingCode(s)).toBe(c);
  expect(normaliseTrackingCode("VJ-7K2P")).toBeNull();
});
it("generated codes match format", () => {
  expect(newTrackingCode()).toMatch(/^VJ-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
});
it("password verify fails without pepper match", async () => {
  const h = await hashPassword("correct horse");
  expect(h.startsWith("$argon2id$")).toBe(true);
  expect(await verifyPassword(h, "correct horse")).toBe(true);
  expect(await verifyPassword(h, "wrong")).toBe(false);
});
it("hmac is deterministic and purpose-separated", () => {
  expect(hmac("email","a@b.c")).toBe(hmac("email","a@b.c"));
  expect(hmac("email","a@b.c")).not.toBe(hmac("username","a@b.c"));
});
// tests/int/ip.test.ts
it("ip hash changes across days and old salts are deleted", async () => {
  const d1 = new Date("2026-12-01T10:00Z"), d2 = new Date("2026-12-02T10:00Z");
  const a = await ipHash("1.2.3.4", d1);
  expect(await ipHash("1.2.3.4", d1)).toBe(a);
  expect(await ipHash("1.2.3.4", d2)).not.toBe(a);
  await deleteOldSalts(d2);
  expect(await db.$count(ipSalts)).toBe(1);
});
```

- [ ] **Step 2: Run** `npm test -- crypto && npm run test:int -- ip` → FAIL.
- [ ] **Step 3: Implement** the four modules (Crockford alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`; `crypto.randomInt` for codes; salt = 32 random bytes).
- [ ] **Step 4: Run** same commands → PASS.
- [ ] **Step 5: Commit** `feat(crypto): hmac, argon2id+pepper, tracking codes, daily ip salt`.

### Task 5: Bangla formatting and per-issue field definitions

**Files:**
- Create: `src/lib/format/bn.ts`, `src/lib/reports/fields.ts`, `tests/lib/format.test.ts`, `tests/lib/fields.test.ts`

**Interfaces:**
- `toBnDigits(n: number|string): string`; `formatTaka(n: number): string` (e.g. `5000 → "৳৫,০০০"`, `288000 → "৳২.৮৮ লাখ"`, `6085800000 → "৳৬০৮.৫৮ কোটি"`; lakh ≥ 1,00,000, crore ≥ 1,00,00,000, 2 decimals trimmed); `parseAmount(input: string): number | null` accepts Bangla/ASCII digits, commas, spaces, leading ৳.
- `ISSUE_FIELDS: Record<"ghush"|"vejal", { categories: {slug:string,label:string}[], schema: ZodType }>` — ghush categories = office types (land, passport, brta, traffic_police, police, hospital, city_corp, sub_registry, education, tax, customs, accounts, other); vejal categories = product types (milk, fish, meat, fruit_veg, oil, rice_flour, spices, sweets, medicine, baby_food, other). Field lists exactly as spec §6.2.
- `reportInputSchema: ZodType<ReportInput>` — common fields + discriminated union on `issueType`; description 20–3000 chars; up to **5** images; amounts 1 – 1,000,000,000.
- `type ReportInput`.

- [ ] **Step 1: Write failing tests:**

```ts
it("parses Bangla and comma amounts", () => {
  expect(parseAmount("৫,০০০")).toBe(5000);
  expect(parseAmount("৳ 5,000")).toBe(5000);
  expect(parseAmount("abc")).toBeNull();
});
it("formats lakh and crore", () => {
  expect(formatTaka(5000)).toBe("৳৫,০০০");
  expect(formatTaka(288000)).toBe("৳২.৮৮ লাখ");
  expect(formatTaka(6085800000)).toBe("৳৬০৮.৫৮ কোটি");
});
it("ghush requires amountDemanded and outcome; vejal requires adulterationType", () => {
  expect(reportInputSchema.safeParse(ghushBase).success).toBe(true);
  expect(reportInputSchema.safeParse({ ...ghushBase, outcome: undefined }).success).toBe(false);
  expect(reportInputSchema.safeParse({ ...vejalBase, adulterationType: undefined }).success).toBe(false);
});
```

- [ ] **Step 2: Run** `npm test -- format fields` → FAIL.
- [ ] **Step 3: Implement** both modules (amount fields use `z.preprocess(parseAmount, …)`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: bangla formatting and report field schemas`.

### Task 6: Rate limiting and proof-of-work captcha

**Files:**
- Create: `src/lib/ratelimit.ts`, `src/lib/captcha.ts`, `src/app/api/captcha/route.ts`, `src/components/Captcha.tsx`, `scripts/cleanup.ts`, `tests/int/ratelimit.test.ts`, `tests/lib/captcha.test.ts`

**Interfaces:**
- `checkRateLimit(key: string, action: "report"|"track"|"admin_login"|"upload", now?: Date): Promise<{ ok: boolean; retryAfterSec: number }>` — limits: report 5/hour, track 20/hour, admin_login 5/15min, upload 30/hour. Key is an `ipHash`. Returns `ok: false` if the key has an active `ipBlocks` row.
- `getClientIp(headers: Headers): string` — reads `cf-connecting-ip`, falls back to `x-forwarded-for` first entry; value used transiently only.
- `createChallenge(): Promise<Challenge>`; `verifyCaptcha(payload: string): Promise<boolean>` (altcha-lib, `maxNumber` 100_000, expiry 10 min, payload single-use via in-DB replay table or `rateLimits` row).
- `<Captcha onVerified={(payload: string) => void} />` client component using the `altcha` widget bundled from npm.
- `cleanup(now?: Date)` — deletes `rateLimits` older than 30 days and calls `deleteOldSalts`.

- [ ] **Step 1: Write failing tests:**

```ts
it("allows 5 reports per hour then blocks", async () => {
  for (let i = 0; i < 5; i++) expect((await checkRateLimit("k","report")).ok).toBe(true);
  const r = await checkRateLimit("k","report");
  expect(r.ok).toBe(false); expect(r.retryAfterSec).toBeGreaterThan(0);
});
it("cleanup removes rows older than 30 days", async () => { /* insert row dated 31d ago, run cleanup, expect 0 */ });
it("captcha payload cannot be replayed", async () => {
  const p = await solvedPayload(); // helper solves a createChallenge()
  expect(await verifyCaptcha(p)).toBe(true);
  expect(await verifyCaptcha(p)).toBe(false);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** modules, route (`GET /api/captcha` returns challenge, `Cache-Control: no-store`), widget, cleanup script.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: rate limits, self-hosted PoW captcha, cleanup job`.

### Task 7: Image pipeline

**Files:**
- Create: `src/lib/images.ts`, `src/app/images/[key]/route.ts`, `tests/lib/images.test.ts`, `tests/fixtures/{gps.jpg,rotated.jpg,photo.heic,big.jpg}`

**Interfaces:**
- `processImage(buf: Buffer): Promise<{ data: Buffer; width: number; height: number }>` — reject > **10 MB** input and non-JPEG/PNG/WebP (HEIC rejected with code `unsupported`); `sharp(buf).rotate()` (apply EXIF orientation) → resize to max 2000px → `webp({ quality: 80 })` with no `withMetadata()`. Throws `ImageError` with `code: "too_large"|"unsupported"|"corrupt"`.
- `putImage(data: Buffer): Promise<string>` — random key, S3 put to `vejal-images` (dev: the team's remote MinIO from `.env`, bucket already created and private; S3 client must use `forcePathStyle: true`); `getImage(key: string): Promise<Buffer|null>`.
- `GET /images/[key]` — serves only if a `reportImages` row with that key has `status='approved'` **and** its report is approved; else 404. Admin variant handled in Task 10.

- [ ] **Step 1: Write failing tests:**

```ts
it("strips all metadata including GPS", async () => {
  const out = await processImage(read("gps.jpg"));
  const meta = await sharp(out.data).metadata();
  expect(meta.exif).toBeUndefined(); expect(meta.icc).toBeUndefined();
  expect(meta.format).toBe("webp");
});
it("applies orientation before stripping", async () => {
  const out = await processImage(read("rotated.jpg")); // 100x200 stored with orientation=6
  expect([out.width, out.height]).toEqual([200, 100]);
});
it("rejects HEIC and oversize with codes", async () => {
  await expect(processImage(read("photo.heic"))).rejects.toMatchObject({ code: "unsupported" });
  await expect(processImage(read("big.jpg"))).rejects.toMatchObject({ code: "too_large" });
});
```

- [ ] **Step 2: Run** `npm test -- images` → FAIL.
- [ ] **Step 3: Implement.** Error messages for the UI live next to codes: `too_large` → `ছবিটি ১০ MB-এর বেশি`, `unsupported` → `শুধু JPG, PNG বা WebP ছবি দিন`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: metadata-stripping image pipeline and gated image route`.

### Task 8: Report submission

**Files:**
- Create: `src/lib/entities.ts`, `src/lib/reports/flags.ts`, `src/lib/reports/submit.ts`, `src/app/report/page.tsx`, `src/app/report/ReportForm.tsx`, `src/app/report/actions.ts`, `src/app/report/done/page.tsx`, `src/app/api/entities/route.ts`, `tests/int/submit.test.ts`, `tests/lib/flags.test.ts`

**Interfaces:**
- Consumes: `reportInputSchema`, `processImage`, `putImage`, `newTrackingCode`, `trackingHash`, `checkRateLimit`, `ipHash`, `getClientIp`, `verifyCaptcha`.
- `detectContactInfo(text: string): string[]` → flags subset of `["phone","email"]` (BD phone: `(\+?88)?01[3-9]\d{8}` with Bangla or ASCII digits).
- `upsertEntityByName(name: string, kind: EntityKind): Promise<string>` (case/space-insensitive match on normalised name, slug from transliteration-free `nanoid`); `searchEntities(q: string, limit = 8)` — **approved-report entities only**.
- `createReport(input: ReportInput, images: Buffer[], idempotencyKey: string): Promise<{ trackingCode: string | null; publicId: string }>` — single transaction; on duplicate `idempotencyKey` returns the existing `publicId` with `trackingCode: null`.
- `submitReport(formData: FormData)` server action: rate limit → captcha → validate → `createReport` → redirect to `/report/done` passing the code via a short-lived httpOnly cookie (never in URL).
- Form (Task 2 `form` + react-hook-form with `zodResolver(reportInputSchema)`): 3 steps (issue & place → details → description & photos) with a `Progress` bar and `m` slide transition between steps, division→district pickers from `bd.json` (in a `Drawer` on mobile), Bangla field errors, image thumbnails with remove button, `sonner` toast on failure, client-generated `idempotencyKey` (`crypto.randomUUID()`) kept across retries, warning copy under description, submit disabled while pending. `/report/done` shows the code once with a copy button and the advice to save it.
- `GET /api/entities?q=` autocomplete.

- [ ] **Step 1: Write failing tests:**

```ts
it("creates a pending report and returns a tracking code", async () => {
  const r = await createReport(ghushInput, [], randomUUID());
  expect(r.trackingCode).toMatch(/^VJ-/);
  const row = await db.query.reports.findFirst({ where: eq(reports.publicId, r.publicId) });
  expect(row!.status).toBe("pending");
  expect(row!.trackingHash).toBe(trackingHash(r.trackingCode!));
});
it("same idempotency key creates exactly one report", async () => {
  const k = randomUUID();
  await Promise.all([createReport(ghushInput, [], k), createReport(ghushInput, [], k)]);
  expect(await db.$count(reports)).toBe(1);
});
it("flags phone/email in description but still accepts", async () => {
  const r = await createReport({ ...ghushInput, description: ghushInput.description + " ০১৭১২৩৪৫৬৭৮" }, [], randomUUID());
  const row = await db.query.reports.findFirst({ where: eq(reports.publicId, r.publicId) });
  expect(row!.flags).toContain("phone");
});
it("autocomplete never returns entities with only pending reports", async () => { /* … */ });
```

- [ ] **Step 2: Run** `npm run test:int -- submit && npm test -- flags` → FAIL.
- [ ] **Step 3: Implement** lib functions, then the action and form UI.
- [ ] **Step 4: Run** tests → PASS; then `npm run dev`, submit one report with a GPS photo by hand, confirm the stored object in MinIO has no EXIF (`exiftool`).
- [ ] **Step 5: Commit** `feat: anonymous report submission with tracking code`.

### Task 9: Track page

**Files:**
- Create: `src/app/track/page.tsx`, `src/app/track/actions.ts`, `src/lib/reports/track.ts`, `tests/int/track.test.ts`

**Interfaces:**
- `lookupByTrackingCode(input: string): Promise<{ status: Status; rejectReason?: RejectReason; publicId?: string } | null>` — normalises, hashes, looks up; `publicId` only when approved.
- Action rate-limited (`track`); identical "not found" response for invalid and unknown codes. Bangla labels for each status and reject reason.

- [ ] **Step 1: Failing test:** created report found via `"vj 7k2p 9qx4"`-style sloppy input of its real code; unknown code → `null`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: report status tracking`.

### Task 10: Admin authentication

**Files:**
- Create: `src/lib/auth/session.ts`, `src/lib/auth/admin.ts`, `src/lib/audit.ts`, `scripts/create-admin.ts`, `src/app/admin/login/page.tsx`, `src/app/admin/login/actions.ts`, `src/app/admin/layout.tsx`, `tests/int/admin-auth.test.ts`
- Modify: `src/app/images/[key]/route.ts` (moderators may view pending images)

**Interfaces:**
- `createSession(userId: string): Promise<string>` (token = 32 random bytes; DB stores SHA-256 of token; cookie `vj_s`, httpOnly, Secure, SameSite=Strict, admin TTL **8h**); `getSession(): Promise<{ user: User } | null>`; `destroySession()`.
- `adminLogin(username: string, password: string, totp: string): Promise<"ok"|"invalid">` — looks up `usernameHmac`, verifies password, then TOTP (`otplib`, window 1) using decrypted `totpSecretEnc` (AES-256-GCM with `TOTP_ENC_KEY`); same `"invalid"` for every failure; rate-limited `admin_login`.
- `requireRole(min: "moderator"|"admin"): Promise<User>` — throws/redirects; **call at the top of every admin page and every admin server action**.
- `audit(actorId: string, action: string, target: string, meta?: object): Promise<void>`.
- `scripts/create-admin.ts --username <u> --role admin|moderator` prompts for password, prints TOTP otpauth URI once, assigns a random pseudonym.

- [ ] **Step 1: Failing tests:** login succeeds only with correct password **and** current TOTP; wrong TOTP → `"invalid"`; `requireRole("admin")` rejects a moderator; 6th login attempt in 15 min is blocked; session token in DB is not equal to the cookie value.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(admin): password + TOTP login, sessions, role guard, audit log`.

### Task 11: Admin moderation

**Files:**
- Create: `src/lib/reports/moderation.ts`, `src/lib/cdn.ts`, `src/app/admin/queue/page.tsx`, `src/app/admin/reports/page.tsx` (all reports, filter by status), `src/app/admin/reports/[id]/page.tsx`, `src/app/admin/reports/[id]/actions.ts`, `src/app/admin/entities/page.tsx`, `src/app/admin/entities/actions.ts`, `src/app/admin/transparency/page.tsx`, `tests/int/moderation.test.ts`

**Interfaces:**
- `approveReport(id: string, actor: User, edits?: { description?: string }): Promise<void>` — saves redacted description, sets `approved`, `reviewedAt/By`, increments `entities.approvedReportCount`, audits.
- `rejectReport(id: string, actor: User, reason: RejectReason): Promise<void>`.
- `setImageStatus(imageId: string, actor: User, status: "approved"|"rejected"): Promise<void>` — rejected images deleted from S3 and purged from CDN.
- `hideReport(id: string, actor: User, note: string)` / `unhideReport(id: string, actor: User)` — moderator+; `hidden` ↔ `approved`; hide purges the report's image URLs from CDN.
- `editApprovedReport(id: string, actor: User, edits: { description: string }): Promise<void>` — moderator+; redaction after publication; audit stores that a change happened, not the old text.
- `deleteReport(id: string, actor: User, confirmPublicId: string): Promise<void>` — **admin only**; `confirmPublicId` must equal the report's `publicId` (typed confirmation); deletes row, images from S3, CDN cache; decrements entity count; audit row keeps only `publicId`, actor, time.
- `purgeCdn(paths: string[]): Promise<void>` in `src/lib/cdn.ts` — Cloudflare API `purge_cache` by URL using `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_PURGE_TOKEN`; **no-op when unset** (dev). Failures are logged (path only) and retried once; never block the moderation action.
- `mergeEntities(fromId: string, intoId: string, actor: User): Promise<void>` — repoints reports, sets `mergedInto`, recomputes counts.
- `recordTransparencyRequest(actor: User, input: { receivedAt: Date; requesterType: "government"|"legal"|"company"|"other"; summary: string; outcome: "no_data_held"|"refused"|"content_removed"|"other" }): Promise<void>`.
- `blockIpHash(ipHash: string, actor: User): Promise<void>` — inserts `ipBlocks` until end of current UTC day; admin page lists today's top rate-limited hashes (hash prefix + hit count only).
- Queue page: pending reports oldest first; flagged reports (`flags` non-empty) badged; shows upazila/area text; actions call `requireRole("moderator")`; entity merge and transparency entry require `admin`.

- [ ] **Step 1: Failing tests:** approve with edited description persists edit and status; reject sets reason visible to `lookupByTrackingCode`; merge moves reports and counts; moderator calling `mergeEntities` path is refused; hide sets status `hidden` and its images 404 at `/images/[key]`, unhide restores both; `deleteReport` by a moderator is refused and with a wrong `confirmPublicId` throws; after delete the report row and its S3 objects are gone and the audit row has no description text; `purgeCdn` is called with the image paths on hide/delete (mocked); a blocked ipHash gets `ok: false` from `checkRateLimit` until midnight UTC; every action writes one `adminAuditLog` row.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** lib, then pages.
- [ ] **Step 4: Run** → PASS; manually approve the Task 8 report and confirm its image now loads at `/images/[key]`.
- [ ] **Step 5: Commit** `feat(admin): moderation queue, hide/delete, redaction, images, entities, transparency log, CDN purge`.

### Task 12: Admin console — overview, team, settings, audit

**Files:**
- Create: `src/lib/settings.ts`, `src/lib/categories.ts`, `src/lib/team.ts`, `src/app/admin/page.tsx` (overview), `src/app/admin/team/{page,actions}.tsx`, `src/app/admin/settings/{page,actions}.tsx`, `src/app/admin/audit/page.tsx`, `src/app/admin/blocks/page.tsx`, `src/components/admin/{AdminNav,Shortcuts}.tsx`, `tests/int/settings.test.ts`, `tests/int/team.test.ts`
- Modify: `src/lib/ratelimit.ts`, `src/lib/captcha.ts` (read limits/difficulty from settings), `src/lib/reports/fields.ts` + `src/app/report/actions.ts` (validate category slugs against enabled `categories`), `src/app/layout.tsx` (site notice banner), `src/lib/db/seed.ts` (seed categories)

**Interfaces:**
- `getSettings(): Promise<SiteSettings>` (cached 60 s, `"use cache"` with tag `settings`) / `updateSettings(actor: User, patch: Partial<SiteSettings>): Promise<void>` (admin only; revalidates tag; audits changed keys).
- `type SiteSettings = { submissionsPaused: boolean; noticeBn: string | null; captchaMaxNumber: number; rateLimits: Record<"report"|"track"|"upload", { max: number; windowSec: number }>; issueTypesEnabled: Record<string, boolean> }` — defaults equal Task 6 values and both issue types enabled.
- When `submissionsPaused` (or the issue type is disabled): `/report` shows `noticeBn` and the submit action rejects with code `paused` — checked server-side, not just hidden in UI.
- `listCategories(issueType, field)`, `upsertCategory(actor, input)`, `setCategoryEnabled(actor, id, enabled)` — admin only; disabled slugs stay valid on existing reports but can't be chosen for new ones.
- `listTeam()`, `inviteModerator(actor, username, role): Promise<{ otpauthUri: string; tempPassword: string }>` (shown once; user must change password on first login), `setRole(actor, userId, role)`, `removeMember(actor, userId)`, `resetTotp(actor, userId): Promise<{ otpauthUri: string }>` — admin only; an admin cannot remove or demote themselves or the last admin; removing a member destroys their sessions.
- Overview (`/admin`): pending count, flagged count, approved/rejected today and this week, oldest pending age, submissions-paused state.
- Audit (`/admin/audit`): admin only; paginated, filter by actor/action.
- `<Shortcuts>` on queue/review pages: `A` approve, `R` reject menu, `H` hide, `J`/`K` next/previous; ignored while typing in inputs.
- Mobile: `AdminNav` collapses into a `Drawer`; review page usable at 360px.

- [ ] **Step 1: Failing tests:** paused settings make `submitReport` reject with `paused`; disabled issue type rejected server-side; updated rate limit is honoured by `checkRateLimit` after cache revalidation; disabled category rejected for new reports but existing report still renders its label; moderator calling `updateSettings`/`inviteModerator` refused; last admin cannot be demoted or removed; removed member's session no longer passes `requireRole`; every change writes an audit row.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** lib, then pages.
- [ ] **Step 4: Run** → PASS; manually toggle "submissions paused" and confirm `/report` shows the notice within 60 s.
- [ ] **Step 5: Commit** `feat(admin): overview, team management, site settings, emergency pause, audit viewer, shortcuts`.

### Task 13: Public ledger, report detail and home

**Files:**
- Create: `src/lib/reports/queries.ts`, `src/app/reports/page.tsx`, `src/app/reports/[id]/page.tsx`, `src/components/ReportCard.tsx`, `src/components/Disclaimer.tsx`, `tests/int/queries.test.ts`
- Modify: `src/app/page.tsx` (replace template), `src/app/layout.tsx` (Bangla `metadata` title/description with no creator name, footer links to info pages)
- Delete: unused `public/{file,globe,next,vercel,window}.svg`

**Interfaces:**
- `listPublicReports(filters: { issueType?; division?; district?; category?; outcome?; sort: "latest"|"amount"; page: number }): Promise<{ items: PublicReport[]; total: number }>` — page size 20; only `approved`.
- `getPublicReport(publicId: string): Promise<PublicReport | null>`.
- `type PublicReport` — **only** the public fields from Global Constraints (no `upazila`, `areaText`, `trackingHash`, `flags`, `userId`, `reviewedBy`).
- Consumes: Task 2 `ui/*`, `BarList`, `m`/`stagger`, `StickyCta`.
- Home: counters (approved total, ghush total amount, per-issue counts), 6 latest (cards fade in with `stagger`), top divisions as `<BarList>` (server-rendered, no chart library), CTA `রিপোর্ট করুন`.
- Ledger: filters as query params, opened in a `Drawer` on mobile; card/table toggle (`ToggleGroup`); `Skeleton` while streaming; detail shows `অযাচাইকৃত অভিযোগ` badge + `<Disclaimer />`.

- [ ] **Step 1: Failing tests:** pending/rejected never listed; `Object.keys(PublicReport)` contains none of the admin-only keys; filter by district works; page 2 returns next 20.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS; `npm run build` succeeds (no `cacheComponents` errors); `grep -ri "create next app\|vercel" src/` returns nothing; `npm run perf` passes for `/` and `/reports`; `grep -r "recharts\|InteractiveChart" .next/static` finds it only in the `/stats` chunk.
- [ ] **Step 5: Commit** `feat: public ledger, report detail, home`.

### Task 14: Stats page

**Files:**
- Create: `src/lib/reports/stats.ts`, `src/app/stats/page.tsx`, `tests/int/stats.test.ts`

**Interfaces:**
- `getStats(issueType: "ghush"|"vejal"): Promise<Stats>` — `byDivision`, `byCategory`, `byOutcome` (ghush), `byAdulterationType` (vejal), `amountBuckets` (ghush: ≤1,000 / 1,001–5,000 / 5,001–10,000 / >10,000), `monthly` (last 12 months), `median`, `mean`, `max`. Every bucket list passes through `suppressSmall(rows, 3)` which replaces counts <3 with `null` (rendered as `<৩`).
- Page: per-issue `Tabs`; division/category/outcome/amount buckets as server-rendered `<BarList>` (visible instantly); the **monthly trend** and amount distribution as `<InteractiveChart>` loaded with `next/dynamic` (tooltips on tap/hover), `Skeleton` fallback; median-vs-mean explainer copy. Suppressed values passed to Recharts as `null` and shown as `<৩` in tooltips.

- [ ] **Step 1: Failing tests:** a district with 2 approved reports returns `null`; median of [1000, 5000, 1e8] is 5000; pending reports excluded.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `npm run perf` passes the `/stats` budget.
- [ ] **Step 5: Commit** `feat: stats with small-cell suppression`.

### Task 15: Information pages

**Files:**
- Create: `src/app/(info)/how-it-works/page.tsx`, `faq/page.tsx`, `privacy/page.tsx`, `transparency/page.tsx`, `disclaimer/page.tsx`, `src/lib/transparency.ts`, `tests/int/transparency.test.ts`

**Interfaces:**
- `getTransparency(): Promise<{ monthly: { month: string; received: number; approved: number; rejected: number }[]; requests: TransparencyRequestPublic[] }>` — requests show date, requester type, outcome (not internal summary).
- Privacy page states, truthfully per spec §8: no account needed to report; no IPs stored (daily-salted hash for rate limiting, deleted in 30 days); photo metadata removed and originals never kept; no analytics or third-party scripts; Cloudflare carries traffic and can see IPs; no contact info collected. Builder drafts Bangla copy; owner reviews before launch.
- Transparency page: moderation rules, monthly table, requests table.

- [ ] **Step 1: Failing test:** `getTransparency()` counts match seeded reports by month and omits `summary`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: privacy, transparency and info pages`.

### Task 16: Production deployment

**Files:**
- Create: `Dockerfile`, `docker-compose.prod.yml`, `scripts/backup.sh`, `docs/deploy.md`
- Modify: `next.config.ts` (`output: "standalone"`, security headers: CSP `default-src 'self'` plus what the altcha worker needs, `Referrer-Policy: no-referrer`, `Permissions-Policy: geolocation=(), camera=(), microphone=()`)

**Interfaces:**
- Compose services: `app` (Next standalone, runs migrations on start), `postgres`, `minio`, `cloudflared` (token from env), `cron` (runs `scripts/cleanup.ts` daily, `backup.sh` nightly). No service publishes ports to the host except via `cloudflared`. App and proxy logging configured to exclude IPs and bodies.
- **Cloudflare Access** application protecting `/admin*` (free Zero Trust plan, email one-time-PIN, allow-list of team emails) — in front of, not instead of, password + TOTP. App additionally rejects `/admin` requests lacking the `Cf-Access-Jwt-Assertion` header when `CF_ACCESS_REQUIRED=true` (prod).
- Approved images served with `Cache-Control: public, max-age=31536000, immutable`; `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_PURGE_TOKEN` (token scoped to Cache Purge only) set in prod.
- `backup.sh`: `pg_dump | age -r $BACKUP_AGE_PUBKEY` + MinIO mirror encrypted the same way, keep 14 days.
- `docs/deploy.md`: VPS setup, Cloudflare tunnel creation, set Cloudflare logging to minimum, configure Cloudflare Access for `/admin*`, create the purge-only API token, create first admin with `scripts/create-admin.ts`, restore from backup.

- [ ] **Step 1: Run** `docker compose -f docker-compose.prod.yml up --build` locally with a test tunnel token disabled (`cloudflared` commented) → app reachable on the internal network, migrations applied.
- [ ] **Step 2: Verify** `curl -I` shows the CSP/Referrer/Permissions headers; an approved image returns the immutable `Cache-Control`; with `CF_ACCESS_REQUIRED=true`, `curl /admin` without the Access header returns 403; `docker compose logs app` after submitting a report contains no IP address or description text.
- [ ] **Step 3: Verify** `scripts/backup.sh` produces an encrypted file and a restore into a fresh Postgres reproduces the report count.
- [ ] **Step 4: Commit** `chore: production compose, cloudflared, backups, deploy guide`.

---

## Later plans (not in this plan)

- **Video uploads:** deferred (anonymity, moderation load, CPU/storage). If added: ≤60 s / 50 MB, ffmpeg re-encode with metadata stripped, optional audio removal, admin-only by default, served from R2 or a paid video CDN (Cloudflare's free CDN is not for video).
- **Phase 2:** admin user & comment management (search by pseudonym, activity history, ban/unban, bulk-hide a user's comments, delete account); public signup (username/email/password, email verification via SES, HMAC storage, reset flow), pseudonyms, সত্যি/ভুয়া voting with weight ramp + Wilson ranking, comments, bans + `/bans`, linking reports to accounts.
- **Phase 3:** entity pages (≥3 approved reports), richer stats.
