# Project overview

Short version of the [design spec](docs/superpowers/specs/2026-11-20-vejal-bd-platform-design.md). If the two ever disagree, the spec wins.

## Why

People in Bangladesh run into bribery demands and adulterated food and medicine all the time, but they rarely report it. They are afraid of being identified, and a single complaint goes nowhere anyway. vejal-bd gives them a safe, anonymous place to write it down. Once many reports are in one public place, patterns show up: which offices, which products, which districts.

## Who it's for

- **Reporters:** anyone with a phone. They need no account and no identity, and a report takes under two minutes.
- **Readers:** citizens, journalists and researchers who want to see patterns.
- **Moderators:** a small trusted team (1 to 3 people at launch).

## Scope

**At launch:** ঘুষ (bribery) and ভেজাল (adulteration). The data model lets more issue types be added without reworking the core.

**Not in scope:** forwarding complaints to authorities, a mobile app, a public API, monetisation, phone numbers, social login, device location.

## Key decisions

| Decision | Choice |
|---|---|
| Naming | Organisations, offices, shops and brands may be named. Private individuals may never be named. |
| Anonymity | Full anonymity. No user data that can identify anyone is kept, and there is no secret logging. |
| Reporting | No account required. Reporters get a tracking code (`VJ-XXXX-XXXX`). |
| Accounts | Optional: username, email (verified) and password, all hashed. Each account gets a random public pseudonym. |
| Community signal | সত্যি / ভুয়া (real/fake) votes rank reports. New accounts' votes count less. |
| Moderation | `/admin` with TOTP 2FA, an audit log, temporary or permanent bans, and a public `/bans` page. |
| Transparency | Moderation rules, monthly statistics and any data requests received are published. |
| Hosting | Own VPS in the USA, reached only through a Cloudflare Tunnel. No "created by" credit anywhere on the site. |

## Phases

1. **Anonymous ledger:** reporting, admin moderation, public ledger, basic stats, privacy and transparency pages. See the [plan](docs/superpowers/plans/2026-11-21-phase-1-anonymous-ledger.md).
2. **Community:** accounts, real/fake voting, comments, bans page. Plan not written yet.
3. **Depth:** entity pages (shown once an entity has at least 3 approved reports) and richer stats. Plan not written yet.

## What success looks like

- Reporting feels safe and quick on a cheap Android phone.
- If anyone asks for user data, "we don't have it" is the truthful answer.
- The ledger shows real patterns without presenting any single report as proof.
