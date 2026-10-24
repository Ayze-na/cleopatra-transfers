# Cleopatra Transfers - Website Requirements

> Handover document for OpenCode. Build exactly what is described here. Anything marked **[ASSUMPTION]** is a sensible default chosen where the owner did not specify; implement it, but keep it easy to change. Anything under **Open Items** (section 17) needs owner input and must be a configurable setting or placeholder, never hard-coded.

---

## 1. Project Overview

**Cleopatra Transfers** is a website for tourists visiting Egypt who want to reserve a car with a driver. It covers four cities only: **Hurghada, Aswan, Luxor and Marsa Alam**.

The site has two main services:

1. **Direct Ride** - a fixed-price transfer from point A to point B (airport to hotel and vice versa, or between the four cities, or to a nearby site such as Aswan to Abu Simbel Temple). The client picks date and time. The admin controls routes, cars and prices.
2. **Trip File** - a custom multi-city, multi-place trip. The client ticks the exact places they want inside each city, chooses a start date and number of days, fills the booking form, and is redirected to WhatsApp where the admin confirms and quotes a custom price.

There are **no client accounts or logins**. Clients only fill forms. Admins log into a protected admin panel.

---

## 2. Goals and Scope

### In scope
- Public website (responsive: phone, tablet, desktop) in 4 languages.
- Animated pharaonic hero intro, then the home page.
- Direct Ride booking flow with admin approval.
- Trip File request flow with WhatsApp redirect.
- Admin panel to manage routes, cars, prices, cities, places, bookings, trip requests and settings.
- Email and WhatsApp notifications.
- Manual bank-transfer payment with payment screenshot upload, or cash.

### Out of scope (do not build)
- Client accounts, login, booking history for clients.
- Client-side cancellation or editing of bookings (client contacts the admin instead).
- Online card payment gateway.
- Native mobile app.
- Driver app, live tracking, reviews and ratings.

---

## 3. Technology Stack

| Area | Requirement |
|---|---|
| Framework | **Next.js** (App Router) with **React** and **TypeScript** |
| Styling | Tailwind CSS (custom theme from section 4) |
| Animation | **Framer Motion** (the "Framer" library) for the hero and page animations |
| Backend / DB | **Supabase**: PostgreSQL, Auth (admins only), Storage, Row Level Security, Edge Functions or Next.js server routes for privileged actions |
| i18n | `next-intl` (or equivalent) with locale-prefixed URLs: `/en`, `/ar`, `/ru`, `/de` |
| Hosting | **[ASSUMPTION]** Vercel for the site + Supabase cloud |
| Email | **[ASSUMPTION]** Resend or SMTP, behind a small notification service interface so the provider can be swapped |
| WhatsApp automation | WhatsApp Business Cloud API (Meta) behind the same notification service interface. See Open Items. |
| Spam protection | **[ASSUMPTION]** Cloudflare Turnstile (or hCaptcha) on public forms |

Reason for Next.js: server rendering for good **SEO and Google ranking**, which the owner explicitly wants.

---

## 4. Branding and Design

### 4.1 Theme
Ancient Egyptian / pharaonic, luxurious, dark-first. The mood is a night sky over the pyramids with gold details.

### 4.2 Color palette

| Role | Name | Hex |
|---|---|---|
| Primary accent | Gold | `#C9A24B` |
| Highlight | Light gold | `#E6C875` |
| Shade | Dark gold | `#A8812F` |
| Main background | Black / deep navy | `#0A0E1A` |
| Secondary background | Space blue (use sparingly) | `#16264A` |
| Text / light surfaces | Ivory white | `#F5F1E6` |

Rules: black and white are the base, gold is the accent, space blue is used only in small amounts (cards, sky gradients, section backgrounds). Do not introduce other brand colors. Error, success and warning states may use muted standard colors that fit the dark theme.

### 4.3 Logo
- Files will be supplied by the owner: `cleopatra-transfers-logo.png` and `cleopatra-transfers-logo.svg` (2048 x 2048 px).
- Place them in a `public/brand/` folder.
- Design: winged golden sun disc with a pyramid and a road, name "CLEOPATRA" inside a cartouche, "TRANSFERS" below.
- Use the SVG in the header and hero. Generate favicon, Apple touch icon and social share image (Open Graph, 1200 x 630) from it.
- Header may use a compact logo (emblem + name); the hero uses the full logo.

### 4.4 Typography **[ASSUMPTION]**
- Headings (Latin): **Cinzel Decorative** (monumental, carved look).
- Body (Latin): a clean readable font such as Inter or Poppins.
- Arabic: **Cairo** or Noto Naskh Arabic (pick the one that looks best with gold on dark).
- Russian and German use the Latin/Cyrillic-capable fonts; verify Cyrillic glyph coverage for the heading font and fall back gracefully.

### 4.5 Visual elements
- Subtle Egyptian ornament: thin gold borders, cartouche-style frames around key titles, winged-sun divider between sections, hieroglyph-inspired section icons (simple, tasteful, not cartoonish).
- Buttons: gold fill with dark text for primary, gold outline for secondary.
- Cards: dark navy surfaces with a thin gold border, soft gold glow on hover.
- All animations must respect `prefers-reduced-motion`.

---

## 5. Languages and RTL

- Client-facing languages: **English, Arabic, Russian, German**.
- Arabic must be fully **RTL** (layout mirrored, correct icons, date and number formatting).
- A language switcher is always visible in the header. Default language: detect from browser, fallback English. Remember the choice (cookie).
- **Static UI text** (buttons, labels, errors, emails): translation files for all 4 languages. Provide complete translations; flag Russian and German as machine-assisted so the owner can review.
- **Admin-entered content** (route names, location names, car names/descriptions, city names/descriptions, place names/descriptions):
  - Admin types **English and Arabic**.
  - **Russian and German are auto-translated** from the English text on save, using a translation API (**[ASSUMPTION]** DeepL or Google Cloud Translation).
  - The admin must be able to **review and manually override** the auto-translated Russian and German text.
  - Store translations in the database (do not translate on every page load).
- Admin panel language: English (Arabic optional later).
- Emails and WhatsApp messages to the client are sent in the language the client used on the site.

---

## 6. User Roles

| Role | Access |
|---|---|
| **Client (public)** | No account. Browses, fills booking forms, uploads passport photo and payment screenshot. |
| **Admin** | Logs in to the admin panel. **Several admin accounts, all with identical full permissions.** |

Admin accounts: created and disabled by existing admins from the panel (email + password through Supabase Auth). No public admin sign-up. Include password reset by email.

---

## 7. Public Website - Pages and Structure

Pages: **Home, Direct Rides, Trip Files, About, Contact**, plus legal pages **Privacy Policy** and **Terms** (required because passport images are collected; content provided by owner or placeholder text).

Header: logo, navigation (Home, Direct Rides, Trip Files, About, Contact), language switcher, WhatsApp button.
Footer: logo, links, the four cities served, contact details, legal links.
Floating WhatsApp button on all pages (opens chat with admin number from settings).

### 7.1 Hero intro (first thing the visitor sees)
A full-screen, **cinematic pharaonic intro with smooth Framer Motion animation**, which then transitions into the home screen.

Requirements:
- Full-screen dark sky (black to space blue gradient) with slowly twinkling stars.
- Layered parallax silhouettes: pyramids, dunes, palm/obelisk, optional Nile line.
- The winged sun disc emblem animates in: the sun rises, wings spread, gold light sweeps across.
- The brand name "CLEOPATRA TRANSFERS" appears letter by letter or with a gold shimmer inside the cartouche, followed by a short tagline (translated in all 4 languages).
- Gold dust or light particles drifting gently.
- A clear **"Enter" button and "Skip" option**; the intro also auto-continues after about 5 to 6 seconds (or on scroll or click).
- The transition into the home screen is smooth (fade/slide, no abrupt jump).
- Plays **once per browser session** (remember with session storage); returning to Home in the same session goes straight to the home content.
- Must not hurt SEO or performance: the real home page content is present in the HTML (server rendered) and the intro is an overlay on top. Keep the intro lightweight (optimized assets, lazy loading, good mobile performance, target Lighthouse performance 80+ on mobile).
- Fully accessible: reduced-motion users get a simple fade instead of heavy animation.

### 7.2 Home page (after the intro)
Sections in order:
1. Top banner with headline, short text and two large buttons: **Book a Direct Ride** and **Plan a Trip File**.
2. **Two service cards** explaining Direct Ride and Trip File, each linking to its page.
3. **Destinations**: the four cities (Hurghada, Aswan, Luxor, Marsa Alam) as cards with images (content from admin cities).
4. **How it works**: 3 to 4 simple steps for each service.
5. **Why choose us**: short trust points (private cars, drivers, fixed prices, support on WhatsApp). Text editable by developer; no fake statistics or fake reviews.
6. **Call to action** with WhatsApp contact.

### 7.3 About page
Company story, mission, the four cities served, trust points. Static translated content.

### 7.4 Contact page
WhatsApp button, email, phone (from settings), optional simple contact form that emails the admin (with captcha). **[ASSUMPTION]** a contact form is included; remove if not wanted.

---

## 8. Service 1 - Direct Ride (public flow)

Page: **Direct Rides**. Step-by-step booking wizard (single page, clear progress indicator, mobile friendly).

### Step 1 - Route
- Client selects **Pickup point** and **Drop-off point** from admin-defined **locations** (airports, cities, areas, sites).
- Only combinations that exist as active **routes** are selectable; selecting a pickup limits drop-off options to valid ones.
- **[ASSUMPTION]** If a location is of type "hotel area / city zone", an extra free-text field appears: **hotel name or address**, so the driver knows the exact spot. (Owner said the form asks only pickup and drop-off points; this field only refines them. Confirm in Open Items.)

### Step 2 - Date and time
- Client chooses **date and time** of the trip.
- Time zone is **Africa/Cairo**.
- Cannot select past dates; **[ASSUMPTION]** a minimum advance notice (admin setting, default 12 hours) blocks last-minute bookings.
- Show the chosen date and time clearly in the review step.

### Step 3 - Car
- Client sees the **available cars** (managed by admin): photo, name, passenger capacity, luggage capacity, short description.
- The **price for the selected route and each car** is shown in the currently selected currency.
- Cars with no price for that route are hidden.

### Step 4 - Passengers and luggage
- Number of passengers and number of luggage pieces.
- Validation: cannot exceed the chosen car's capacity (show a friendly message suggesting a larger car).

### Step 5 - Client information (booking form)
Required for every booking:
- Full name
- Phone / WhatsApp number (international format, country-code selector)
- Email
- Nationality (country list)
- **Passport photo upload** (required)
- Number of passengers and luggage (from step 4)

Passport photo rules: JPG, PNG, WebP or PDF; max 10 MB; client sees a preview; stored privately (see section 13).
Consent checkbox: agreement to Privacy Policy and Terms (required).

### Step 6 - Payment method
Client chooses:
- **Cash** (pays the driver) - no extra step.
- **Bank transfer** - the website shows the **bank account details** (from admin settings: bank name, account holder, account number / IBAN, SWIFT, instructions, amount to pay in the chosen currency). Client transfers the money and **uploads a payment screenshot** (required for this option; JPG, PNG, WebP or PDF; max 10 MB).

There is no online card payment.

### Step 7 - Review and submit
- Summary of everything: route, date/time, car, passengers, luggage, price and currency, payment method, client info.
- Submit creates the booking with status **Pending**.

### Step 8 - Confirmation page
- Shows a **booking reference** (example format `CT-D-000123`) and a clear message that the booking is **waiting for admin approval** and the client will be informed by email and WhatsApp.
- Client receives an acknowledgment email.
- Admin is notified (email + WhatsApp).

### Currency
- A currency selector in the header: **USD, EGP, EUR**.
- Prices are **set manually by the admin per currency** (no automatic conversion). Default currency: USD **[ASSUMPTION]**.
- The currency chosen at booking time is saved on the booking together with the price.

---

## 9. Service 2 - Trip File (public flow)

Page: **Trip Files**. The client builds a custom itinerary.

### Step 1 - Choose places
- The page lists the **cities** (admin-defined). Each city expands to show its **places** (admin-defined), each with **photo, name and short description**.
- Every place has its **own checkbox**. The client ticks only the places they want; selecting the whole city is **not** required (client may take two places from Luxor and one from Aswan, etc.).
- Places can be selected across **multiple cities** in the same reservation.
- Live **"My Trip File" summary** (sidebar on desktop, bottom sheet on mobile) showing selected cities and places grouped by city, with the option to remove items.
- At least **one place** must be selected to continue.

### Step 2 - Trip dates
- Client chooses a **start date** and the **number of days**.
- Cannot choose a past start date. Number of days: min 1, max **[ASSUMPTION]** 30.
- The end date is calculated and shown.

### Step 3 - Client information
Same booking form as Direct Ride (full name, phone/WhatsApp, email, nationality, **passport photo**, number of passengers, luggage) plus consent checkbox.

### Step 4 - Submit and WhatsApp redirect
- On submit the request is **saved in the database** (status **New**) with a reference (example `CT-T-000045`) and the admin is notified by email.
- The client is then **redirected to WhatsApp** (click-to-chat link to the admin number from settings) with a **pre-filled message** containing: booking reference, client name, start date, number of days, passengers, luggage, and the list of cities and places selected.
- The message template is editable by the admin in settings; **[ASSUMPTION]** default language of the pre-filled message is English (admin works in English/Arabic), with a clear fallback button "Open WhatsApp" if the automatic redirect is blocked.
- The confirmation page also shows the reference and a note: "The admin will confirm the details and your custom price on WhatsApp."
- **No price is shown** for trip files. The admin gives a custom price in the WhatsApp conversation.

---

## 10. Admin Panel

URL: `/admin` (not indexed by search engines, protected, English UI, responsive).

### 10.1 Authentication
- Email + password login (Supabase Auth). Session timeout and secure logout.
- Several admin accounts, all with full permissions.
- Admin management screen: add admin (email, temporary password or invite link), disable/enable admin.

### 10.2 Dashboard
- Counters: pending direct bookings, bookings awaiting payment verification, new trip requests, trips today and tomorrow.
- Quick lists of the latest pending items with direct links.

### 10.3 Direct bookings
- Table: reference, client name, route, date/time, car, price + currency, payment method, payment status, booking status, created date.
- Filters: status, date range, route, city, payment method. Search by reference, name, phone, email.
- **Booking detail**: all submitted data, **passport photo viewer**, **payment screenshot viewer** (with zoom and download), internal admin notes, history of status changes.
- Actions: **Approve**, **Reject** (with optional reason shown to client), **Mark payment verified / payment rejected**, **Cancel**, **Mark completed**, edit booking details (date/time, car, route, price) with change log.
- Approving or rejecting triggers the client notification (email + WhatsApp).
- Export to CSV.

### 10.4 Trip requests (trip files)
- Table: reference, client name, start date, days, number of places, status, created date.
- Detail view: client info, passport photo, selected cities and places (grouped), dates, notes.
- Status workflow: **New - Contacted - Confirmed - Completed / Cancelled**.
- Optional fields (**[ASSUMPTION]**): **agreed price + currency** and internal notes, so the admin can record what was agreed on WhatsApp.
- Button: **Open WhatsApp chat with client** (pre-filled opening message).
- Export to CSV.

### 10.5 Locations and routes (Direct Ride)
- **Locations** CRUD: name (EN, AR; RU, DE auto-translated and editable), type (airport, city, hotel area, site/landmark), parent city, active toggle, sort order.
- **Routes** CRUD: pickup location, drop-off location, active toggle. Future routes (for example **Aswan to Abu Simbel Temple and back**) are added here without code changes.
- Option **"Create reverse route too"** when adding a route, so "vice versa" is created automatically. Each direction keeps its own editable prices.
- Seed suggestions (editable by admin): airports of Hurghada (HRG), Luxor (LXR), Aswan (ASW), Marsa Alam (RMF); the four cities; routes airport to city and city to city; Aswan to Abu Simbel Temple.

### 10.6 Cars
- CRUD: name (EN, AR + auto-translated), photo(s), **passenger capacity**, **luggage capacity**, short description, active toggle, sort order.
- Cars can be added, edited, disabled and deleted. Cars with existing bookings are disabled rather than deleted.

### 10.7 Pricing (Direct Ride)
- **Price matrix**: for each **route x car**, the admin sets and edits a price in **USD, EGP and EUR** separately.
- Bulk-friendly UI: pick a route and see all cars with three price fields each; save at once. Show "no price set" warnings.
- Price changes apply to **new bookings only**; existing bookings keep their saved price.
- A route-car pair without a price is not shown to clients.

### 10.8 Cities and places (Trip File)
- **Cities** CRUD: name (EN, AR + auto-translated), cover photo, short description, active toggle, sort order.
- **Places** CRUD inside each city: **name, photo, short description** (EN, AR + auto-translated), active toggle, sort order, move between cities.
- Inactive places or cities disappear from the public site but remain on old requests.

### 10.9 Settings
- **Admin WhatsApp number** (used for the click-to-chat redirect and the floating button).
- **Admin notification emails** (one or more) and the notification WhatsApp number.
- **Bank account details** (bank name, account holder, account number / IBAN, SWIFT, payment instructions) shown to clients who choose bank transfer.
- Minimum advance notice for direct rides (hours).
- Maximum trip length (days).
- Default currency.
- WhatsApp pre-filled message template for trip files.
- Contact details (phone, email, address text) shown in the footer and contact page.
- Social links.
- Email and WhatsApp message templates for client notifications (per language).

### 10.10 Activity log
- Record who changed what and when (status changes, price edits, approvals) for accountability across several admins.

---

## 11. Booking Statuses

### Direct bookings
- **Pending** (just submitted) - **Approved** - **Completed**
- **Pending** - **Rejected**
- Any state - **Cancelled** (admin only)

### Payment status (direct bookings)
- **Cash on ride** (payment method = cash)
- **Awaiting verification** (bank transfer, screenshot uploaded)
- **Verified** / **Rejected** (admin decision on the screenshot)

### Trip requests
- **New** - **Contacted** - **Confirmed** - **Completed**
- Any state - **Cancelled** (admin only)

---

## 12. Notifications

| Event | Recipient | Channel |
|---|---|---|
| New direct booking | Admin(s) | Email + WhatsApp |
| New trip request | Admin(s) | Email (client also opens WhatsApp chat manually) |
| Booking submitted | Client | Email acknowledgment |
| Booking approved or rejected | Client | **Email + WhatsApp** (in the client's language; rejection includes the reason if provided) |
| Payment verified or rejected | Client | Email + WhatsApp |

Requirements:
- Notification sending must not block the booking submission; failures are logged and retried, and visible to admins.
- Message templates are editable in settings, per language.
- WhatsApp automation uses pre-approved message templates (Meta requirement). See Open Items.

---

## 13. Data Model (Supabase / PostgreSQL)

All text content that clients see is stored as translations for `en`, `ar`, `ru`, `de` (for example a JSON field per language).

| Table | Main fields |
|---|---|
| `admin_users` | id (linked to Supabase Auth), name, email, active, created_at |
| `locations` | id, name (translations), type, city_id (nullable), active, sort_order |
| `routes` | id, from_location_id, to_location_id, active |
| `cars` | id, name (translations), description (translations), image URLs, max_passengers, max_luggage, active, sort_order |
| `route_prices` | id, route_id, car_id, currency (USD/EGP/EUR), amount; unique on (route, car, currency) |
| `direct_bookings` | id, reference, route_id, car_id, trip_datetime, hotel_text (optional), passengers, luggage, client_name, client_phone, client_email, nationality, passport_file_path, payment_method, payment_screenshot_path, payment_status, currency, price_amount, status, reject_reason, admin_notes, language, created_at, updated_at |
| `cities` | id, name (translations), description (translations), cover_image, active, sort_order |
| `places` | id, city_id, name (translations), description (translations), image, active, sort_order |
| `trip_requests` | id, reference, start_date, days, passengers, luggage, client_name, client_phone, client_email, nationality, passport_file_path, status, agreed_price (optional), agreed_currency (optional), admin_notes, language, created_at, updated_at |
| `trip_request_places` | id, trip_request_id, place_id, snapshot of city and place names at submission time |
| `settings` | key-value store for section 10.9 items |
| `notification_log` | id, event, channel, recipient, status, error, related booking id, created_at |
| `activity_log` | id, admin_id, action, entity, entity_id, details, created_at |

Notes:
- Bookings must **store snapshots** (names, price, currency) so later edits to routes, cars, prices or places never change past bookings.
- References are sequential and human-readable (`CT-D-######` for direct, `CT-T-######` for trips).

---

## 14. Security and Privacy

Passport photos are highly sensitive. Treat them carefully:

- Store passport photos and payment screenshots in **private Supabase Storage buckets**. Never public URLs. Admins access them only through **short-lived signed URLs**.
- **Row Level Security** on every table. The public (anonymous) role can only: read active public content (cities, places, cars, routes, prices, locations, public settings) and create bookings/requests through validated server-side endpoints. The public role can never read bookings or files.
- Admin-only tables and files require an authenticated, active admin.
- Validate uploads on the server: file type, size, and basic content checks; randomize file names; no executable files.
- Server-side validation of all form data (do not trust the browser). Recalculate prices server-side from the database; never accept a price from the client.
- Rate limiting and captcha on public forms.
- HTTPS everywhere; secure headers; no sensitive data in logs.
- Clear **consent checkbox** and Privacy Policy explaining why the passport photo is collected.
- **[ASSUMPTION]** Automatic deletion of passport photos and payment screenshots a set number of days after the trip (admin setting, default 90 days), with the booking record kept.
- Admin panel: not indexed (`noindex`), brute-force protection, session expiry.

---

## 15. Non-Functional Requirements

- **SEO**: server-rendered pages, unique title and meta description per page and per language, `hreflang` tags for the 4 languages, sitemap, robots.txt, structured data (organization/local business), Open Graph images, fast loading, alt text on images.
- **Performance**: optimized images (Next.js image optimization), lazy loading, minimal JavaScript on content pages.
- **Responsive**: mobile-first (most tourists book on phones). Touch-friendly forms and date/time pickers.
- **Accessibility**: keyboard navigation, labels, contrast checks on gold-on-dark text, reduced-motion support.
- **Browser support**: current versions of Chrome, Safari, Edge, Firefox (including iOS Safari).
- **Reliability**: friendly error pages, form data not lost on validation errors, clear loading states.
- **Time zone**: all trip times are Africa/Cairo.
- **Seed data**: provide a seed script with sample cities, places, cars, locations and routes so the owner can see the site working, all editable from the admin panel.

---

## 16. Acceptance Criteria (summary)

1. Visiting the site shows the animated pharaonic hero, then the home page; the intro can be skipped and plays once per session.
2. The site works in English, Arabic (RTL), Russian and German, with a working language switcher.
3. A client can book a Direct Ride end to end (route, date/time, car, passengers, info with passport photo, cash or bank transfer with screenshot) and receives a reference number.
4. A booking appears in the admin panel as **Pending**; the admin can approve or reject it; the client receives email and WhatsApp messages.
5. The admin can add a new route (for example Aswan to Abu Simbel Temple, plus reverse), add cars, and set prices per route and car in USD, EGP and EUR; the public site reflects it immediately.
6. A client can build a Trip File by ticking individual places in multiple cities, choose start date and number of days, fill the booking form, and is redirected to WhatsApp with a pre-filled message; the request is saved and visible to the admin.
7. The admin can add cities and places (name, photo, short description) and they appear in the Trip File page.
8. English and Arabic content typed by the admin is auto-translated to Russian and German, and the admin can edit those translations.
9. Passport photos and payment screenshots are not publicly accessible.
10. Several admin accounts can log in with the same permissions.

---

## 17. Open Items (owner must provide; build as settings or placeholders)

1. **Admin WhatsApp number** and notification phone number.
2. **Admin notification email(s)** and the sender email / domain for outgoing mail.
3. **Bank account details** to display for bank transfers.
4. **WhatsApp automation method**: automatic client/admin WhatsApp messages need a **WhatsApp Business Cloud API** account with approved templates. If the owner does not have this yet, build the notification service so WhatsApp can be switched on later, and in the meantime show the admin a one-click "send on WhatsApp" button (click-to-chat link) next to each approve/reject action.
5. **Domain name** and hosting account.
6. **Contact details** for the footer (phone, email, address text) and social links.
7. **Legal texts**: Privacy Policy and Terms (placeholders until provided).
8. **Content**: city and place photos, car photos, About page text. Until supplied, use tasteful placeholders.
9. Confirm the **[ASSUMPTION]** items: hotel name free-text field, minimum advance notice (12 hours), maximum trip days (30), photo retention (90 days), default currency (USD), contact form, translation provider (DeepL or Google).

---

## 18. Suggested Build Order

1. Project setup, theme, i18n (4 languages, RTL), Supabase schema, RLS, auth, seed data.
2. Admin panel: locations, routes, cars, price matrix, cities, places, settings.
3. Public site shell: header, footer, language and currency switchers, Home, About, Contact.
4. Hero intro animation with Framer Motion.
5. Direct Ride booking flow + uploads + admin booking management + notifications.
6. Trip File flow + WhatsApp redirect + admin trip request management.
7. Translation automation, SEO (hreflang, sitemap, metadata), performance and accessibility pass.
8. Security review (RLS tests, upload validation, rate limiting) and final QA on phones.
