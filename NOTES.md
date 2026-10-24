# Cleopatra Transfers — Project Notes

_Last updated: 2026-10-24_

## Stack
- Next.js 15.1.4 (App Router), React 19, TypeScript, Tailwind
- Supabase (Postgres, Auth, Storage, RLS), Resend, next-intl (en/ar/ru/de), zod, framer-motion
- `npx` is blocked on this machine — typecheck with `node node_modules\typescript\bin\tsc --noEmit`, build with `node node_modules\next\dist\bin\next build`

## Done

### Public site
- i18n on all customer-facing pages (en/ar/ru/de); locale files complete and key-aligned
- Currency switcher (USD/EGP/EUR, localStorage, safe hydration)
- WhatsApp number is admin-editable (settings → Contact & WhatsApp tab); consumed via `usePublicSettings()` in Header, Footer, HomeClient, FloatingWhatsApp, contact page, TripFileBuilder
- Terms & Privacy pages render admin-uploaded documents per locale (fallback to `en`)
- Captcha: Cloudflare Turnstile (no-op until keys set) on booking, trip-request and contact forms
- Rate limiting: DB sliding window via `public_request_log` (5/10min bookings-trips, 10/15min contact)
- Bucket bug fixed: payment screenshots use `payment-screenshots` bucket in wizard AND BookingsManager
- Notification provider logs every email/whatsapp send to `notification_log` via `log_notification` RPC

### Admin panel (now tabbed)
- **Direct Bookings / Trip Requests** — original managers
- **Pricing Matrix** — fixed: blanked cells now delete rows; added "Clear prices"
- **Routes / Locations / Cities / Places / Cars** — full CRUD: edit, delete, image upload (public `site-images` bucket) for cars/cities/places, activity-logged
- **Contact & WhatsApp** — edit whatsapp_number, contact_email, contact_phone
- **Documents** — terms & privacy per locale, paste or upload `.txt`/`.md`
- **Settings** — generic key/value
- **Admins** — manage admin users
- **Logs** — notification_log + activity_log tables with clear-log
- Shared helper: `src/lib/admin-activity.ts` (`uploadSiteImage`, `logActivity`)

### Verification
- `tsc --noEmit` clean
- `next build` passes (17 routes). One benign warning: `resend` optional peer `@react-email/render` missing — plain-HTML emails still work; fix with `npm i @react-email/render` if desired.
- Google Fonts fetch can flake at build time (network); retry the build if that error appears.

## TODO / user actions

1. ~~Migration 007~~ **APPLIED** (2026-10-24) via Supabase Management API and verified
   (table, bucket, 2 RPCs, 3 storage policies, 5 settings rows).
   Note: direct postgres (`DATABASE_URL`) is unreachable from some networks (DB host is
   IPv6-only / unroutable). Use the dashboard SQL Editor or the Management API instead.
2. **Turnstile keys**: create a Cloudflare Turnstile site, then fill
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` in `.env.local`.
   Until set, captcha is a no-op (forms work, no challenge).
3. (Optional) `npm i @react-email/render` to silence the resend build warning.
4. (Optional) Seed the site: add cars/cities/places/routes with images via admin panel,
   set WhatsApp number, and upload terms/privacy documents.

## Key files
- `src/lib/api-protection.ts` — Turnstile verify + rate limit
- `src/lib/site-documents.ts` — server-side terms/privacy reader
- `src/lib/admin-activity.ts` — admin upload + activity log helpers
- `src/components/admin/*Manager.tsx` — admin sections
- `src/app/admin/page.tsx` — tabbed admin shell
- `supabase/migrations/007_site_settings.sql` — pending migration
