# Design system

Goals: **phone-first, minimal, fast, premium, easy.** The visual design is our own. It must not copy ghush.site or any other existing site.

## Stack

| Need | Choice | Rule |
|---|---|---|
| Components | shadcn/ui (Radix) in `src/components/ui/` | Build UI only from these. Add new ones with `npx shadcn@latest add`. |
| Animation | Motion via `LazyMotion` + `m` from `src/components/motion.tsx` | Never import `motion` directly. |
| Icons | lucide-react | Import named icons only. |
| Mobile sheets | vaul (shadcn `Drawer`) | Any picker with more than 8 options opens in a drawer on mobile. |
| Toasts | sonner | Short Bangla messages. |
| Forms | react-hook-form + the shared Zod schemas | Same validation on client and server. Field errors in Bangla. |
| Charts | `BarList` / `Sparkline` (server, 0 KB JS) everywhere. `InteractiveChart` (Recharts) only on `/stats` via `next/dynamic`. | Never import Recharts anywhere else. |
| Fonts | `next/font`: Hind Siliguri (bengali + latin subsets, 400/500/600) and Geist Mono for codes and numbers | Self-hosted, no Google requests at runtime. |

## Visual language

- Neutral base, **one** accent colour, generous whitespace, radius `0.75rem`.
- Theme tokens are shadcn CSS variables on `:root` and `.dark`. Dark mode follows `prefers-color-scheme`, with a manual toggle.
- Bangla text uses a comfortable line height (≈1.7 for body). Numbers use Bangla digits, and money is shown as ৳ with lakh/crore.
- Tone is calm and serious. No stock photos, no illustrations of people.

## Layout and mobile rules

- Design at **360px width first**. 16px side gutters. Reading pages max out at `42rem`.
- Below `md` there is a **bottom nav** (হোম / রিপোর্ট / পরিসংখ্যান / ট্র্যাক) and a **sticky `রিপোর্ট করুন`** button above it, hidden on `/report/*`. From `md` up, these move to a top nav.
- Leave room for `env(safe-area-inset-bottom)`.
- Tap targets are at least 44×44px.
- Amount inputs use `inputmode="numeric"`. Image inputs accept JPEG, PNG and WebP and let the user choose camera or gallery.
- The report form has 3 steps with a progress bar, and no step is longer than one screen.

## Motion

- 250 ms or less, ease-out: page fade, card stagger, form step slide, vote feedback.
- Page fade and card stagger on read-only pages use the CSS utilities `animate-fade-up` and `--i` stagger (zero JS). Motion is only for interactive client components (form steps, vote feedback), which mount `MotionProvider` themselves; it is not in the root layout.
- `MotionConfig reducedMotion="user"`: no movement for users who ask for reduced motion.
- Simple hover and press states use CSS transitions, not Motion.

## Performance budget (mobile Lighthouse, enforced by `npm run perf`)

| Metric | Budget |
|---|---|
| LCP | ≤ 2.5 s |
| Total blocking time | ≤ 200 ms |
| CLS | ≤ 0.1 |
| Script size (gzip) on `/`, `/reports`, `/report` | ≤ 175 KB |
| Script size (gzip) on `/stats` | ≤ 285 KB |

Ways we stay inside it: Server Components by default, WebP images through `next/image`, no third-party scripts, no CSS-in-JS, no UI kits, no Lottie, no analytics.

## Fixed copy

- Unverified badge: `অযাচাইকৃত অভিযোগ`
- Disclaimer: `একটি রিপোর্ট একটি অভিযোগ মাত্র, দোষ প্রমাণ নয়।`
- Description warning: `কারো ব্যক্তিগত নাম লিখবেন না`
- Main CTA: `রিপোর্ট করুন`
