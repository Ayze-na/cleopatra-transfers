# Cleopatra Transfers — Project Notes

_Last updated: 2026-10-25 — LIVE_

## Deployment — LIVE
- **https://cleopatra-transfers.vercel.app** — auto-deploys on `git push` to master (repo Ayze-na/cleopatra-transfers already linked in Vercel; all env vars already in the project).
- Build blockers fixed on 2026-10-25:
  1. **Corrupt `package-lock.json`** — 55 versionless stub entries (empty `{}` under `sharp/node_modules/@img/*`, `unrs-resolver`, `fsevents`, `@react-email/render`) crashed `npm install` (npm "Invalid Version" at arborist `canDedupe`, exit 1). Root amplifier: I had added `@react-email/render@^1.1.2` while `resend` pins `1.0.1` → conflicting duplicates in that subtree (it was never imported by code). Fix: removed it from `package.json`, deleted lockfile, regenerated clean (0 versionless entries; verified `npm install` exits 0 locally).
  2. **Next.js 15.1.4 → 15.5.28** — Vercel blocks vulnerable versions (`VULNERABLE_NEXTJS_VERSION` / CVE-2025-66478). `eslint-config-next` bumped to match. `tsc --noEmit` + `next build` green locally.
- Verified in production: `/en /ar /ru /de` → 200, `/admin/login` → 200.
- Note: local `npm install` works again; the old lockfile backup was deleted.

## Stack
- Next.js 15.5.28 (App Router), React 19, TypeScript, Tailwind
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
- `next build` passes (17 routes)
- Google Fonts fetch can flake at build time (network); retry the build if that error appears.

## TODO / user actions

1. ~~Migration 007~~ **APPLIED** (2026-10-24) via Supabase Management API and verified
    (table, bucket, 2 RPCs, 3 storage policies, 5 settings rows).
    Note: direct postgres (`DATABASE_URL`) is unreachable from some networks (DB host is
    IPv6-only / unroutable). Use the dashboard SQL Editor or the Management API instead.
2. **Deployment is LIVE** (2026-10-25). Going forward every `git push` auto-deploys —
    no Vercel token or manual step needed.
3. **Turnstile keys**: create a Cloudflare Turnstile site, then set
    `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` in the Vercel project env
    (dashboard) AND `.env.local`. Until set, captcha is a no-op (forms work, no challenge).
4. (Optional) Seed the site: add cars/cities/places/routes with images via admin panel,
    set WhatsApp number, and upload terms/privacy documents.
5. (Optional) Set `ADMIN_NOTIFICATION_EMAILS` + `NEXT_PUBLIC_ADMIN_WHATSAPP` in Vercel env
    if both are currently empty.

## Key files
- `src/lib/api-protection.ts` — Turnstile verify + rate limit
- `src/lib/site-documents.ts` — server-side terms/privacy reader
- `src/lib/admin-activity.ts` — admin upload + activity log helpers
- `src/components/admin/*Manager.tsx` — admin sections
- `src/app/admin/page.tsx` — tabbed admin shell
- `supabase/migrations/007_site_settings.sql` — pending migration
