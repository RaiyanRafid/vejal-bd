# vejal-bd — Anonymous Public Accountability Ledger: Design

Date: 2026-11-21 · Status: draft for approval · Scope: planning only, no code yet

## 1. Intent

A Bangla-first public website where anyone in Bangladesh can report everyday wrongdoing — starting with **ঘুষ (bribery)** and **ভেজাল (adulteration of food/medicine/goods)** — without fear. Reports are moderated, then published to a searchable public ledger. One report is an allegation; many reports reveal a pattern. The site exists to make those patterns visible (by place, office/shop/brand, product, amount, outcome).

Same *genre* as ghush.site (anonymous, moderated, pattern-focused ledger), broader (multiple issue types), with its own original design and branding.

**Core promise: genuine anonymity.** The site stores nothing that could identify a reporter or user. If anyone (including authorities) asks for user data, the truthful answer is "we don't have it." The privacy policy states exactly what is and isn't stored — no hidden logging.

## 2. Goals, non-goals, anti-goals

**Goals**
- Anyone can file a report in under ~2 minutes with no account and no identifying data.
- Multiple issue types on one platform; adding one later (e.g. price gouging/সিন্ডিকেট) needs no core rework.
- Public pages show individual reports and aggregate patterns.
- Optional pseudonymous accounts for voting (real/fake), commenting and tracking.
- Community "সত্যি / ভুয়া" voting that ranks reports, resistant to brigading.
- Public, transparent moderation: rules, stats, bans page, transparency report.
- Secure `/admin` for moderation, image verification, bans, spam.

**Non-goals (v1)**
- Not a government complaint channel; no forwarding to authorities.
- No mobile app, no public API, no monetisation.
- No phone numbers, no Google/social login, no device location.
- English UI not required for v1 (strings structured so it can be added).

**Anti-goals (failure even if it "works")**
- Any stored data that can identify a person: raw IPs, image EXIF/GPS, plaintext emails, phone numbers, real names, analytics fingerprints.
- Secret logging that contradicts the public privacy policy.
- Naming private individuals anywhere public (reports, comments, images).
- A single unverified report presented as established fact.
- Any "created by" / maker attribution on the site.

## 3. Constraints

- **Stack:** Next.js 16 (App Router, `src/`, `cacheComponents` already on in `next.config.ts`), React 19, TypeScript, Tailwind 4 — the existing scaffold. Read `node_modules/next/dist/docs/` before writing code (APIs differ from older Next).
- **Database:** self-managed PostgreSQL (not Supabase/Firebase).
- **Hosting:** owner's own datacenter VPS **in the USA**, exposed only via **Cloudflare Tunnel (`cloudflared`)**, no open inbound ports. Cloudflare terminates TLS and sees visitor IPs; configure Cloudflare to the minimum logging available and disclose Cloudflare's role in the privacy policy. Origin reads `CF-Connecting-IP` only transiently for rate limiting.
- **No creator attribution** anywhere: footer, meta/OG tags, about page, sitemap, error pages.
- **Language:** Bangla UI, Bangla numerals for display, BDT (৳) with lakh/crore formatting.

## 4. Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (picked)** | Single Next.js full-stack app + self-managed PostgreSQL + self-hosted object storage | Full control over data and anonymity; portable |
| B | Next.js + Supabase | Fastest, but vendor dependency; anonymity rules in RLS are easy to get wrong |
| C | Separate API backend + Next.js frontend | Only pays off with mobile app/public API; doubles ops |

Owner picked **A**.

## 5. Decisions made by the owner

1. **Issue types:** ঘুষ and ভেজাল at launch; extensible.
2. **Naming policy:** reports may name an **organisation, office, shop or brand**; **never a private individual**. Every report shows "একটি রিপোর্ট একটি অভিযোগ মাত্র, দোষ প্রমাণ নয়।"
3. **Full anonymity, no user data retained** (owner rejected secret logging).
4. **Reporting needs no account.**
5. **Accounts (optional):** username + email + password. Email must be verified at signup. No first/last name, no phone, no Google login.
6. **Credentials are hashed:** password, username and email are never stored in plaintext.
7. **System-assigned pseudonym:** every account gets a random unique public name (e.g. "নীল-বক-৪২৭"). Only this name appears publicly — on comments, votes, bans. The login username is never shown publicly.
8. **No device location.** Reporter picks division/district manually.
9. **"সত্যি / ভুয়া" voting** replaces plain upvotes: more "real" → ranked higher in feeds; more "fake" → pushed to the bottom.
10. **Bans:** admins can ban a pseudonymous account temporarily or permanently (e.g. for targeting an individual).
11. **Public bans page** listing banned pseudonyms.
12. **Transparency:** process and moderation are public; user data is not (there is none).
13. **PostgreSQL**, full Next.js, self-hosted in the USA behind `cloudflared`.

## 6. Product shape

### 6.1 Public pages
- **Home:** counters (approved reports, total reported bribery amount, reports per issue type), ranked recent reports, top divisions, CTA "রিপোর্ট করুন".
- **Ledger (`/reports`):** filter by issue type, division/district, category (office type / product type), outcome; sort by ranked (default, real/fake score), latest, highest amount. Card and table views; paginated.
- **Report detail (`/reports/[id]`):** public fields, approved images, real/fake tallies, comments, "অযাচাইকৃত অভিযোগ" badge, disclaimer.
- **Entity page (`/entities/[slug]`):** office/shop/brand with its approved reports and stats — only once it has ≥3 approved reports.
- **Stats (`/stats`):** per issue type — amount buckets, outcomes, by division, by category, over time; median vs average explained; no cell with <3 reports.
- **Bans (`/bans`):** pseudonym, reason category, start date, duration/permanent. Nothing else.
- **Transparency (`/transparency`):** moderation rules; monthly counts of reports received/approved/rejected, comments hidden, bans; what data the site stores (and doesn't); number of data/takedown requests received and how answered.
- **How it works / FAQ / safety notes / privacy policy / disclaimer.**
- **Track (`/track`):** enter tracking code → status.

### 6.2 Report submission (no account needed)
Multi-step, mobile-first. Common fields:
- issue type; division → district (dropdowns, no GPS); upazila + area/landmark (optional, **admin-only**)
- named entity (office/shop/brand) — free text with autocomplete against existing entities
- incident month; description (warning: "কারো ব্যক্তিগত নাম লিখবেন না")
- up to N images (optional; metadata stripped server-side)

Type-specific fields (stored in `details` JSONB, validated per type):
- **ঘুষ:** office type, service sought, amount demanded (৳), amount paid (৳, optional), outcome (paid / refused / pending).
- **ভেজাল:** product category, product/brand name, adulteration type (formalin, artificial colour, dilution/mixing, expired/relabelled, fake product, other), price paid (optional), how detected (look/smell, test kit, lab report, got sick, other), health impact (none / mild / hospitalised).

On submit: show a **tracking code** once (e.g. `VJ-7K2P-9QX4`); store only its hash. Status `pending`. A logged-in user may optionally link the report to their account; default **not linked**.

No optional contact field — the site does not collect reporter contact info.

### 6.3 Accounts
- **Sign up:** username + email + password + proof-of-work captcha. A verification link is sent to the email; account is inactive until verified.
- **Storage:**
  - password → **argon2id** (per-password random salt, built in) with a server-side **pepper** (secret key kept in environment/secret store, never in the DB). No bcrypt layering.
  - username → **HMAC-SHA256** with a secret key (deterministic, so login can look it up). Case-normalised before hashing.
  - email → **HMAC-SHA256** with a separate secret key, normalised (trim, lowercase). The plaintext email exists only in memory long enough to send the verification mail, then is discarded.
  - Each hash records a key version so secrets can be rotated.
- **Login:** username (or email) + password.
- **Password reset:** user types their email; server HMACs it, and if it matches an account, sends a reset link to the address the user just typed. Plaintext still never stored. Response is identical whether or not the email exists.
- **Pseudonym:** on signup, generate a unique random Bangla name (adjective-animal-number style). Shown publicly everywhere; the user sees it in their header.
- **Email sending:** a transactional mail service (designer's call: Amazon SES, matching the USA location). The provider sees the address at send time; the signup form says "চাইলে আলাদা নতুন একটি ইমেইল ব্যবহার করুন।"
- Logged-in users can vote real/fake, comment, and see reports they linked.

### 6.4 "সত্যি / ভুয়া" voting & ranking
- Login required; one vote per account per report; changeable.
- **Vote weight** ramps with account age (e.g. 0.2 on day one → 1.0 at 7 days) — blunts new-account brigading.
- **Ranking score:** Wilson lower bound on weighted "real" share, blended with recency; reports with few votes stay near neutral.
- Reports with a strongly "fake" score are pushed down and **auto-queued for admin review** — never auto-deleted.
- Report card shows tallies; wording makes clear this is community opinion, not verification.

### 6.5 Comments
- Logged-in only, shown under the pseudonym. Rate-limited.
- Auto-held for moderation if they match phone/email/personal-name-like patterns; otherwise visible immediately; admins can hide.

### 6.6 Bans
- Admin/moderator can ban a pseudonym: temporary (chosen duration) or permanent, with a reason category (targeting an individual, spam, abuse, doxxing, other) and an internal note.
- Banned accounts can't vote, comment or link reports; existing content stays unless separately hidden.
- Ban evasion via new accounts can't be fully prevented on an anonymous site; mitigated by email verification, proof-of-work, and vote-weight ramp.
- Every ban appears on `/bans` and in the admin audit log.

### 6.7 Admin (`/admin`)
- Moderation queue: pending reports + fake-flagged reports; redact tool (edit description to remove personal names, reject individual images).
- Approve / reject (rejection reason category visible via tracking code).
- Image verification: view stripped image, approve/reject each; only approved images go public.
- Entity management: merge duplicates, rename, hide.
- Comment moderation; ban management; rate-limit hits; short IP-hash blocks.
- Transparency data entry (data/takedown requests received).
- Audit log of every admin action, with an admin-only viewer.
- Hide/unhide any report (moderator+); edit/redact after publication; **permanent delete is admin-only** with typed confirmation, and removes images and CDN cache. Hide is the default; delete is for legal reasons or leaked personal data.
- Overview dashboard; team management in the browser (add/remove moderators, change role, reset 2FA; the last admin can't be removed).
- Site settings: enable/disable issue types, edit category lists, captcha difficulty and rate limits, and an **emergency switch** that pauses new reports and shows a notice.
- Keyboard shortcuts for fast moderation; usable on a phone.
- `/admin` sits behind **Cloudflare Access** (free Zero Trust, email PIN for the team) in addition to password + TOTP.
- Approved images are cached by Cloudflare's CDN; hide/delete/reject purges them. No separate CDN. Video uploads are deferred.
- Admins deliberately **cannot** see who submitted a report or any user's real email/IP, because none is stored.
- Roles: `admin`, `moderator`. Admin and moderator accounts require TOTP 2FA.

## 7. Data model (sketch)

- `issue_types` (slug, name_bn, enabled) — seeded ghush, vejal.
- `reports` — id, public short id, issue_type, status (`pending | approved | rejected | hidden`), division, district, upazila?, area_text?, entity_id?, incident_month, description, details JSONB, amount_bdt?, outcome?, category, tracking_code_hash, user_id? (only if linked), real_weight, fake_weight, rank_score, created_at, reviewed_at, reviewed_by.
- `report_images` — report_id, storage key, status, width/height.
- `entities` — id, slug, name, kind (`office | shop | brand | other`), approved_report_count, merged_into?.
- `users` — id, pseudonym (unique), username_hmac (unique), email_hmac (unique), key_version, password_hash, role (`user | moderator | admin`), email_verified_at, totp_secret? (encrypted, admins), created_at. **No plaintext username/email, no name, no phone.**
- `sessions`, `email_tokens` (verify/reset; token hashed, short expiry).
- `votes` — (user_id, report_id) unique, value (`real | fake`), weight_at_vote.
- `comments` — report_id, user_id, body, status (`visible | held | hidden`).
- `bans` — user_id, reason_category, note (internal), starts_at, ends_at? (null = permanent), created_by.
- `rate_limits` — key (salted IP hash or user id), action, window, count; auto-deleted.
- `admin_audit_log`, `transparency_requests` (date, requester type, what asked, outcome).
- Locations: static division/district/upazila dataset.

Auth is custom (no Auth.js) because of the hashed-username/email scheme; sessions are DB-backed, httpOnly cookies.

## 8. Privacy & security requirements

- **No raw IP storage.** Rate limiting uses `HMAC(ip, daily-rotating secret)`; rows deleted after 30 days. Reverse proxy and app logs must not record IPs, request bodies or emails. Cloudflare logging minimised.
- **Images:** re-encode server-side with `sharp`, strip all metadata, never keep the original upload. Private until approved.
- **No third-party scripts** (analytics, CDN fonts, embeds). Self-host fonts.
- **Self-hosted proof-of-work captcha** (e.g. ALTCHA) + rate limits per IP-hash and per account.
- **Secrets** (pepper, HMAC keys, TOTP encryption key) in environment/secret store, never in DB or repo; versioned for rotation.
- **Tracking codes and email tokens** stored hashed; high entropy; lookup endpoints rate-limited.
- **Admin:** role check in every admin route and server action; short sessions; TOTP 2FA; audit log.
- Server-side validation (Zod or similar) on every input; length, amount, file type/size limits.
- Encrypted backups of Postgres and object storage.
- **Privacy policy must truthfully match this section.**

## 9. Calls made by the designer (owner may override)

- **ORM:** Drizzle. **Auth:** custom (see §7).
- **Image storage:** MinIO on the same VPS. **Image processing:** `sharp`.
- **Mail:** Amazon SES. **Captcha:** ALTCHA (self-hosted PoW).
- **IP blocks** last ≤24h (salt rotates daily); persistent abuse handled by PoW difficulty and rate limits.
- **Public precision:** division + district only; upazila/area admin-only; stats suppress cells <3.
- **"Approved"** = passed moderation, not evidence-verified; "অযাচাইকৃত অভিযোগ" badge on every report.
- **Tracking code** = status check only in v1.
- **Entity page** threshold ≥3 approved reports.
- **Vote weight ramp** 0.2 → 1.0 over 7 days; Wilson-score ranking.
- **Deployment:** Docker Compose — Next.js (standalone), PostgreSQL, MinIO, `cloudflared`.
- **Volume assumption:** small launch (tens of reports/day, 1–3 moderators); plain FIFO queue + fake-flag queue is enough. Revisit if volume grows.
- **Phased launch:** Phase 1 — anonymous reporting, admin, public ledger, basic stats, transparency/privacy pages. Phase 2 — accounts, real/fake voting, comments, bans page. Phase 3 — entity pages, richer stats.

## 10. Left to the builder

- Exact lists: office types, product categories, adulteration types (builder drafts, owner reviews).
- Visual design and branding — original, not a copy of ghush.site.
- Pseudonym word lists, pagination, chart library, stats layout.
- Location dataset source.
