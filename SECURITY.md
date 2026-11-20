# Security and privacy

This project protects people who report wrongdoing, often about powerful offices or businesses. A privacy bug here can put someone in real danger. Treat every change that touches data with that in mind.

## Guarantees (do not break these)

1. No raw IP address is stored or logged by the app, the reverse proxy or any script.
2. No image is stored with metadata. The original upload is never kept.
3. No plaintext email, username, phone number or real name is stored.
4. No third-party scripts, analytics or runtime CDN assets.
5. Upazila and area text are never exposed on public pages or in public APIs.
6. Every admin page **and** every admin server action checks the role itself.
7. Secrets come only from the environment and are never committed.
8. The public privacy policy matches what the code actually does.

A change that weakens any of these needs explicit approval from the project owner, and the privacy policy must be updated in the same change.

## Reporting a vulnerability

Do not open a public issue. Contact the maintainers privately through the security contact listed on the live site. Include steps to reproduce. We aim to respond within 7 days.

## Operational notes

- Admin and moderator accounts require TOTP 2FA.
- Backups are encrypted (`age`) and kept for 14 days.
- Rate-limit records are deleted after 30 days. IP salts are deleted daily.
- Cloudflare can see visitor IPs. Keep its logging at the minimum available setting.
