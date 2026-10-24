# Cleopatra Transfers - Design Specification (design.md)

> Companion to `requirements.md`. This file defines **how the website looks, moves and is laid out**: design tokens, the hero intro, every page layout, components, the admin panel look, and the full animation system. OpenCode should implement it as written. Values marked **[CHOICE]** are design decisions made for the owner; they can be tuned but should not be dropped.

---

## 0. Research Notes and Honest Limits

**Reference website (https://bake-studio-fawn.vercel.app)**: when fetched, only the page's metadata could be read. The site renders its content in the browser, so its layout, animations and copy were not visible to the research tool. What could be confirmed: title "Bake Studio - Artisan Bakery & Coffee", a dark warm browser theme color (`#211712`), and that it is a modern single-page brand site. **Nothing in this file claims to copy specific Bake Studio animations.** The owner can send screenshots or a short screen recording of any parts of that site they like (for example the scroll animations or the menu), and this file should then be updated with a section "Reference Matches".

**Pinterest**: Pinterest boards are not readable by the research tool. Web research on luxury "black and gold" website design confirmed the common patterns this design follows: dark backgrounds with restrained gold accents, generous white space, strong typography, large hero imagery, and metallic gold gradients used sparingly for depth. Egyptian palette research confirmed gold, bronze and deep dark tones as the traditional "pharaonic opulence" family. The rest of the design uses established premium-web patterns (cinematic hero, scroll reveals, shared-element transitions, sticky summary panels) adapted to the pharaonic theme.

**Design pillars**
1. **Night over the Nile**: dark, cinematic, calm. Gold is a jewel, not a paint bucket.
2. **Carved, not cartoon**: Egyptian references are elegant (cartouches, winged sun, obelisk lines, pyramid silhouettes), never kitschy clip-art.
3. **Trust first**: tourists are sending passport photos and money. The booking flow must feel clear, safe and professional.
4. **Motion with purpose**: animation guides attention and adds luxury; it never blocks booking.
5. **Mobile first**: most tourists book from their phone, often on hotel Wi-Fi.

---

## 1. Design Tokens

### 1.1 Colors

| Token | Hex / Value | Usage |
|---|---|---|
| `bg-0` | `#0A0E1A` | Page background, hero, footer |
| `bg-1` | `#0F1528` | Alternate sections, cards base |
| `bg-2` | `#16264A` (space blue) | Highlight cards, sky gradients, selected states (use sparingly) |
| `glass` | `rgba(22,38,74,0.55)` + backdrop blur 12px | Sticky header, summary panels, overlays |
| `gold-500` | `#C9A24B` | Primary accent, borders, icons, links |
| `gold-300` | `#E6C875` | Highlights, hover, headline shine |
| `gold-700` | `#A8812F` | Pressed states, shadows of gold shapes |
| `ivory` | `#F5F1E6` | Main text on dark, light surfaces |
| `ivory-70` | `rgba(245,241,230,0.70)` | Secondary text |
| `ivory-45` | `rgba(245,241,230,0.45)` | Disabled text, placeholders |
| `sky-soft` | `#8FA3C7` | Soft blue for small info accents |
| `line` | `rgba(201,162,75,0.25)` | Hairline borders, dividers |
| `line-strong` | `rgba(201,162,75,0.60)` | Focused or selected borders |
| `success` | `#5FB48C` | Approved, verified |
| `warning` | `#E0A93B` | Pending, awaiting verification |
| `danger` | `#E5645A` | Errors, rejected |

**Gold gradient (metal)**: 135 degrees, `#A8812F` 0%, `#E6C875` 45%, `#C9A24B` 70%, `#A8812F` 100%. Used for primary buttons, key headline words, and the cartouche stroke. Never use it on large background areas.

**Glow**: `0 0 24px rgba(201,162,75,0.25)` for hover and selected elements.

Rule: black and ivory carry the page, gold marks what matters, space blue appears only as depth (sky, cards, selected states). Never show more than one gold-filled button in a viewport section.

### 1.2 Typography

| Role | Font (Latin) | Notes |
|---|---|---|
| Display (hero name, H1) | **Cinzel Decorative** 700 | Only for the hero name and page H1s |
| Headings (H2 to H4) | **Cinzel** 600 | Better legibility than the decorative cut |
| Body, UI, forms | **Inter** 400 / 500 / 600 | |
| Numbers (prices) | Inter with tabular figures | Prices must align in tables |
| Arabic (all roles) | **Cairo** 400 / 600 / 700 | Headings in Arabic use Cairo 700 with slightly larger size |
| Russian | Body Inter (Cyrillic supported). Headings: **Cinzel/Cinzel Decorative do not reliably cover Cyrillic, so use Playfair Display 700** for Russian headings, same sizes | Verify glyph coverage |
| German | Same as English | Allow for longer words: avoid fixed-width buttons, allow hyphenation in headings |

**Scale (desktop / mobile, line-height)**

| Style | Desktop | Mobile | Line height |
|---|---|---|---|
| Display (hero name) | 72 px | 40 px | 1.05 |
| H1 | 56 px | 36 px | 1.1 |
| H2 | 40 px | 28 px | 1.15 |
| H3 | 28 px | 22 px | 1.25 |
| H4 | 22 px | 18 px | 1.3 |
| Body L | 19 px | 17 px | 1.65 |
| Body | 17 px | 16 px | 1.65 |
| Small | 14 px | 14 px | 1.5 |
| Overline (section label) | 12 px, uppercase, letter-spacing 0.22em, gold-500 | same | 1.2 |

Arabic: add 2 px to body size and use line-height 1.85. No letter-spacing on Arabic text (it breaks letter joining).

### 1.3 Spacing, grid, radii

- Base unit 4 px. Common steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Container max width **1240 px**, side padding 20 px (mobile), 32 px (tablet), 48 px (desktop).
- 12-column grid, 24 px gutter (16 px on mobile).
- Section vertical padding: **120 px desktop, 72 px mobile**.
- Breakpoints: 360 (base), 640, 768, 1024, 1280, 1536.
- Radii **[CHOICE]**: stone-like and sharp. Inputs and buttons 4 px, cards 6 px, images 4 px. Fully round only for the cartouche, badges and avatars.
- Borders: 1 px `line`; selected 1.5 px `line-strong`.

### 1.4 Texture and ornament

- **Grain overlay**: very subtle noise at 3 to 4 percent opacity over dark sections (adds richness, prevents flat black).
- **Section divider**: thin gold line with a small winged sun in the center (SVG, 24 px high). Used between major sections, not everywhere.
- **Border band**: a 12 px high repeating geometric pattern (stepped pyramid / key pattern) in `line` color, used on the footer top and card headers on special panels. Subtle.
- **Cartouche frame**: rounded oval outline with a bar on the end, used around the brand name, the booking reference and key page titles.
- **Obelisk and pyramid silhouettes**: used in the hero and as faint section backgrounds (opacity 4 to 8 percent).
- No hieroglyph text that could be mistaken for real writing; use decorative glyph-like icons only.

### 1.5 Imagery style

- Golden-hour and blue-hour photography of Luxor temples, Aswan Nile and felucca boats, Abu Simbel, Hurghada and Marsa Alam Red Sea coast, comfortable modern cars.
- Color grading: warm highlights, deep shadows, slightly desaturated so gold UI stands out.
- Every image on dark sections gets a gradient overlay (bottom `rgba(10,14,26,0.85)` fading to transparent) so text stays readable.
- Aspect ratios: hero full bleed; city cards 4:5; place cards 3:2; car cards 16:9; About images 3:4.
- Until real photos are supplied, use dark placeholder gradients with the emblem, not stock photos of other countries.

### 1.6 Iconography

- Outline icons, 1.5 px stroke, gold-500 on dark, rounded joins. Base set: Lucide.
- Custom icons (drawn in the same stroke style): winged sun, ankh (used for success), pyramid, route/road, car, luggage, passenger, passport, calendar, WhatsApp (official brand glyph).
- Icon sizes: 20 px in UI, 32 px in feature blocks, 48 px in "how it works".

---

## 2. Motion System (Framer Motion)

All animation uses **Framer Motion**. Use the lazy-loaded feature bundle to keep JavaScript small. Animate **transform and opacity only**; avoid animating width, height, top or left.

### 2.1 Timing tokens

| Token | Value | Use |
|---|---|---|
| `fast` | 0.2 s | Hover, press, toggles |
| `base` | 0.4 s | Fades, small movements, step changes |
| `slow` | 0.8 s | Section reveals, image reveals |
| `cinematic` | 1.2 s | Hero moments, large transitions |
| `stagger` | 0.08 s | Between siblings in lists and grids |

### 2.2 Easing

| Name | Curve | Use |
|---|---|---|
| `out` | cubic-bezier(0.22, 1, 0.36, 1) | Most entrances (fast start, soft landing) |
| `inOut` | cubic-bezier(0.76, 0, 0.24, 1) | Large transitions, panels |
| `spring-ui` | spring, stiffness 300, damping 24 | Toggles, checkboxes, badges |
| `spring-soft` | spring, stiffness 120, damping 20 | Draggable or floating elements |

### 2.3 Reusable animation patterns

| Pattern | Behavior |
|---|---|
| **Fade-up** | opacity 0 to 1, y 24 px to 0, `slow`, `out`. Triggered once when 15 percent visible. |
| **Stagger group** | Children use fade-up with `stagger` 0.08 s delay. |
| **Line mask reveal** (headings) | Each line of a heading slides up from below an overflow mask, `slow`, stagger 0.1 s. |
| **Image clip reveal** | Image uncovers with an inset clip from bottom to top while scaling 1.1 to 1, `slow`, `inOut`. |
| **Gold shimmer** | A light gold gradient sweeps once across headline words or buttons (1.2 s). Used on the hero name and primary button hover. |
| **Draw-on SVG** | Strokes draw with path length 0 to 1 over 0.9 to 1.4 s. Used for cartouche, dividers, ankh success mark, stepper lines. |
| **Card hover** | Lift y -4 px, border to `line-strong`, glow shadow, inner image scale 1.04 over 0.6 s. Desktop only. |
| **Button hover** | Primary: shine sweep across, y -1 px. Secondary: gold fill slides in from the start edge. Press: scale 0.98. |
| **Link hover** | Gold underline draws from the reading-start edge (left in LTR, right in RTL). |
| **Wizard step change** | Outgoing step fades and slides 40 px away, incoming slides in from 40 px, `base`. Direction follows forward/back and **mirrors in RTL**. |
| **Price change** | When price changes, the old value slides up and fades, the new one slides in from below (0.3 s). |
| **Error shake** | Field shakes 6 px left-right 3 times in 0.3 s, border turns `danger`, message fades in below. |
| **Skeleton loading** | Dark blocks with a slow gold shimmer (1.6 s loop). |
| **Page transition** | Content fades out 0.2 s, new page fades in with y 12 px to 0, 0.35 s. Header stays. |
| **Smooth scrolling** | Optional lightweight smooth-scroll library, disabled for reduced-motion users and on touch devices. |

### 2.4 Rules

- Scroll reveals run **once** (not every time the element re-enters).
- No animation longer than 1.4 s outside the hero.
- Never animate forms while the user is typing.
- Parallax is subtle: maximum 40 px of movement on scroll, desktop only.
- **Reduced motion** (`prefers-reduced-motion`): replace all movement with a simple 0.25 s fade; disable parallax, particles, shimmer loops, smooth scrolling, and the hero scene animation (show a static, beautiful final frame).
- **Performance budget**: no animation may drop below 50 fps on a mid-range phone. Particle effects capped (40 on desktop, 12 on mobile), paused when the tab is hidden or the hero is off-screen. Hero artwork total under about 500 KB.

---

## 3. Hero Intro (the signature moment)

The first thing visitors see. A cinematic, **night-over-the-pyramids** scene that plays once per browser session, then **becomes the home page hero** (the scene stays as the background; the overlay content changes). This is a seamless transition, not a separate splash page.

### 3.1 Scene layers (back to front)

1. **Sky**: vertical gradient from `bg-0` at the top to `bg-2` space blue near the horizon, with a faint gold glow at the horizon line.
2. **Stars**: 60 small ivory dots (30 on mobile) with slow random twinkle (opacity 0.3 to 1, 3 to 6 s each).
3. **Moon/sun disc**: a golden sun disc low behind the central pyramid.
4. **Far dunes**: soft dark-blue silhouette.
5. **Pyramids**: three pyramid silhouettes (large center, two smaller), with a faint gold rim light on the sun side.
6. **Mid dunes** and **front dunes**: darker layers with subtle gold edge light.
7. **Road**: a thin pale road winding from the bottom center toward the central pyramid (the "transfer" idea from the logo).
8. **Gold dust**: tiny gold particles drifting slowly upward (cap per section 2.4).
9. **Vignette**: dark edges to focus the center; grain overlay on top.
10. **Overlay content**: the winged sun emblem, cartouche with name, tagline, and the Enter control.

### 3.2 Storyboard (timeline)

| Time | What happens |
|---|---|
| 0.0 to 0.6 s | Black screen. A thin gold horizon line grows from the center outward. Stars fade in with random delays. |
| 0.4 to 1.6 s | Dune layers rise from 40 px below into place, staggered 0.15 s from back to front. Pyramids fade in and scale 0.96 to 1. |
| 1.4 to 2.8 s | Sun disc rises from behind the central pyramid (y +60 px to 0) with a soft glow pulse and faint rays. The horizon glow brightens. |
| 2.4 to 3.4 s | The **wings spread**: from the sun disc, three feathers per side extend outward (scaleX 0 to 1 from the disc), staggered 0.08 s, with a gold shimmer pass. |
| 3.2 to 4.4 s | The **cartouche outline draws on** (stroke draw-on, 1.1 s). Then "CLEOPATRA" appears letter by letter (stagger 0.05 s) with a gold shimmer sweeping across once. |
| 4.2 to 5.0 s | "TRANSFERS" fades in while its letter-spacing tightens from 0.5em to 0.3em. The tagline fades up beneath. |
| 4.8 s onward | The **Enter** button (gold outline, small arrow) and a **Skip** text link fade in. The road line glows gently. |
| 6.5 s | If the visitor did nothing, the intro continues automatically. |

Tagline (EN): "Your private journey through the land of the pharaohs."

### 3.3 Exit transition (intro to home hero)

Triggered by Enter, Skip, scroll, any key press, or the 6.5 s timer. Duration about 1.2 s, `inOut`.

1. The winged sun emblem **flies to the header position** and scales down (shared-element animation) and becomes the header logo.
2. The cartouche, name, tagline and Enter button fade out.
3. The scene stays but dims slightly and the sun disc settles lower so the text area is calm.
4. The **home hero content** arrives with line-mask reveals: overline, headline, supporting text, two buttons (staggered 0.1 s).
5. The header fades in (it is hidden during the intro).

### 3.4 Home hero content (after the transition)

- Overline: "Hurghada - Aswan - Luxor - Marsa Alam" (this is allowed here as text, the logo itself does not contain the cities).
- Headline (H1): "Travel Egypt like a pharaoh." (EN) with the word "pharaoh" in the gold gradient.
- Support text (one or two lines): "Private cars with professional drivers for airport transfers, city-to-city rides and custom trips."
- Buttons: primary gold **Book a Direct Ride**, secondary outline **Plan a Trip File**.
- A small "scroll" indicator at the bottom: a thin gold line with a dot moving down.
- Pointer parallax on desktop: layers move opposite the cursor by 6, 12 and 20 px according to depth.

### 3.5 Rules

- Plays **once per session**. After that, Home shows the final hero state immediately.
- **Skip is always visible** after 1 s, and keyboard accessible. Focus moves to the main content after the intro.
- The real hero text (H1, buttons) is in the page HTML from the start (SEO). The intro overlay is `aria-hidden` and becomes inert after exit.
- Do not block interaction beyond 6.5 s.
- Mobile: fewer stars and particles, simpler parallax (none), same story but 20 percent faster.
- Reduced motion: no scene animation; show a static frame, a 0.4 s fade of the name, then the home hero. No auto-timer needed (Enter button remains).
- Slow connections: show the static first frame (sky, pyramids, name) immediately; layers enhance as they load.

---

## 4. Global Components

### 4.1 Header

- Height 80 px at top (64 px after scroll). Transparent over the hero; after 80 px scroll becomes `glass` with a 1 px bottom `line` and the height shrinks (0.3 s).
- Layout (LTR): logo (emblem + "CLEOPATRA TRANSFERS" wordmark, small) on the left; navigation center: **Home, Direct Rides, Trip Files, About, Contact**; right side: language switcher, currency switcher, WhatsApp icon button, **Book now** button (goes to Direct Rides).
- RTL: everything mirrors.
- Active nav item: gold text with a small gold diamond below.
- **Language switcher**: dropdown with EN, AR, RU, DE (native names: English, العربية, Русский, Deutsch). Panel fades and slides 8 px.
- **Currency switcher**: USD, EGP, EUR, small segmented dropdown.
- **Mobile (below 1024 px)**: logo left, hamburger right. The menu opens as a **full-screen dark overlay**: links in large Cinzel, staggered fade-up, a thin gold line draws under each, language and currency switchers at the bottom, WhatsApp button last. Closing fades out in 0.25 s.

### 4.2 Footer

- Top edge: the geometric border band.
- Four columns: (1) logo + short description + social icons, (2) Pages, (3) Cities served (4 cities as plain text), (4) Contact (WhatsApp, email, phone) and legal links (Privacy, Terms).
- Bottom bar: copyright and language switcher (repeat).
- Mobile: columns stack; Pages and Cities sit in two columns.

### 4.3 Floating WhatsApp button

- Bottom corner (right in LTR, left in RTL), 56 px circle, WhatsApp green glyph on a dark navy circle with a gold ring (keeps the theme; the glyph keeps brand green). Gentle pulse ring every 6 s. Tooltip on hover: "Chat with us".
- Hidden while the hero intro plays and while the mobile menu is open. On wizard pages on mobile it sits above the sticky bottom bar.

### 4.4 Buttons

| Type | Style |
|---|---|
| Primary | Gold gradient fill, text `bg-0` 600 weight, 4 px radius, height 52 px (44 px small), padding 0 28 px. Hover: shine sweep. Disabled: 40 percent opacity, no shine. |
| Secondary | Transparent, 1.5 px `gold-500` border, gold text. Hover: gold fill slides in, text turns dark. |
| Ghost / link | Gold text with draw-on underline. |
| WhatsApp | Dark navy fill, gold border, WhatsApp glyph, ivory text. |
| Icon button | 44 px square, `line` border, hover glow. |

Loading state: the label is replaced by a small spinning sun emblem; width stays fixed.

### 4.5 Cards

- Base: `bg-1`, 1 px `line` border, 6 px radius, padding 24 px.
- Hover (desktop): per the card hover pattern.
- **Selected**: `bg-2` tint, 1.5 px `line-strong`, glow, small gold check badge top corner (spring pop).
- Feature card: icon in a thin gold ring, H4, short text.

### 4.6 Form controls

- **Input**: height 52 px, `bg-1` fill, 1 px `line` border, ivory text, placeholder `ivory-45`. Label above, 14 px, `ivory-70`.
- **Focus**: border `gold-500`, 3 px glow ring `rgba(201,162,75,0.25)`.
- **Error**: border `danger`, message below in `danger` 14 px with an icon.
- **Select / dropdown**: same as input with a chevron; list panel `bg-2` with gold hover row.
- **Date picker**: custom dark calendar popover; selected day is a gold circle; past days disabled and dimmed; today has a thin ring. Time picker: scrollable list of 15-minute steps (or hour + minute wheels on mobile), 24 h or 12 h by locale.
- **Phone input**: country-code selector with search; the number field is always left-to-right even in RTL.
- **Checkbox**: 22 px rounded square (4 px); checked state fills gold and a tick **draws on** (0.25 s). Used for places and consent.
- **Radio card** (payment method, currency): whole card is clickable; selected state per cards.
- **Stepper (number)**: minus / number / plus buttons, 44 px targets.
- **File upload dropzone**: dashed gold border (`line-strong`), icon and text "Drag a file here or tap to upload", accepted types and size below. After upload: thumbnail (or PDF icon), file name, size, **Remove** button, and an animated progress bar in gold. A small lock icon with text "Your passport photo is stored securely and only seen by our team."
- **Toasts**: slide in from the top (bottom on mobile), `glass` background, 1 px `line`, auto dismiss 5 s.

### 4.7 Badges

Pill shape, 12 px uppercase text. Status colors: pending (`warning`), approved/verified (`success`), rejected (`danger`), completed (`sky-soft`), cancelled (`ivory-45`), new (`gold-500`).

### 4.8 Modal, lightbox, bottom sheet

- Modal: centered, `bg-1`, gold hairline border, backdrop `rgba(10,14,26,0.8)` with blur; enter: fade + scale 0.97 to 1 (0.25 s).
- Image lightbox (admin and place photos): zoom and pan, close with Esc or swipe down.
- Bottom sheet (mobile): slides up from the bottom with spring-soft, drag handle, drag down to close.

### 4.9 Empty, loading, error states

- **Loading**: skeleton blocks with gold shimmer.
- **Empty**: small winged-sun illustration, one-line message, and a primary action.
- **Error (page)**: friendly message with a retry button; keep the header and footer.
- **404 page**: winged sun above a road that ends in the desert; headline "This road leads nowhere."; button "Back to home".

---

## 5. Page Layouts

Wireframes use ASCII. `[ ]` = button, `( )` = image, `===` = gold divider.

### 5.1 Home

```
[ HERO 100svh : scene + headline + 2 buttons + scroll cue ]
=== winged sun divider ===
[ 1. SERVICES (2 big cards side by side) ]
[ 2. DESTINATIONS (4 cities) ]
[ 3. HOW IT WORKS (tabs: Direct Ride | Trip File) ]
[ 4. POPULAR TRANSFERS (optional, from admin routes) ]
[ 5. WHY CHOOSE US (4 features) ]
[ 6. CALL TO ACTION BAND (WhatsApp) ]
[ FOOTER ]
```

**1. Services** (bg-0)
- Overline "Our services", H2 "Two ways to explore Egypt".
- Two large cards, 50/50 on desktop, stacked on mobile. Each card: tall image (4:5 on mobile, 3:4 on desktop) with dark overlay, an icon, H3 ("Direct Ride" / "Trip File"), 2-line description, a bullet row of 3 short points, and a button ("Book a ride" / "Build your trip").
- Direct Ride card text: "Fixed price transfers between airports, hotels and cities."
- Trip File card text: "Choose the cities and places you want. We confirm and quote on WhatsApp."
- Animation: cards fade-up with stagger; image clip reveal; hover lifts card and slowly zooms the image.

**2. Destinations** (bg-1)
- H2 "Four destinations, one trusted ride". Subtitle names the four cities.
- Desktop: asymmetrical grid (one large card spanning two rows on the left, three cards on the right) so it feels editorial; each card: city image, city name in Cinzel, one short line, and "Explore" link that goes to Trip Files with that city opened.
- Mobile: horizontal snap-scroll carousel with 85 percent wide cards and dot indicators.
- Animation: images clip-reveal on scroll; on hover the city name's underline draws and the image zooms.

**3. How it works** (bg-0)
- Tab switcher (pill) with two tabs: Direct Ride / Trip File. Tab indicator slides (shared layout animation).
- Direct Ride steps (4): Choose route - Pick date and time - Choose your car - Send booking and get confirmation.
- Trip File steps (4): Pick your places - Choose dates - Send your details - Confirm and get your price on WhatsApp.
- Layout: horizontal timeline on desktop (numbered diamond nodes joined by a gold line that **draws on as you scroll**); vertical timeline on mobile. Each step: icon, short title, one line of text.
- Tab change: content cross-fades with 20 px slide.

**4. Popular transfers** (bg-1) **[CHOICE, optional]**
- Shows up to 6 active routes marked "featured" in the admin, as compact cards: "Hurghada Airport to Hurghada hotels", with "from" price in the selected currency and a "Book" button that opens the wizard prefilled.
- Hidden automatically if no featured routes exist.

**5. Why choose us** (bg-0)
- Four feature cards in a row (2x2 on mobile): Professional drivers, Comfortable modern cars, Clear fixed prices, Support on WhatsApp. No fake statistics, reviews or awards.
- Subtle pyramid silhouette in the background at 5 percent opacity with slow parallax.

**6. Call to action band**
- Full-width band with the `bg-2` gradient and a faint hieroglyph-inspired pattern; centered H2 "Ready to start your journey?", text "Talk to us on WhatsApp or book online in minutes.", buttons: primary **Book a Direct Ride**, WhatsApp button.

### 5.2 Direct Rides page (booking wizard)

**Page header** (about 40vh): smaller scene (dunes and pyramids, no animation except twinkle), breadcrumb, H1 "Direct Rides", one line "Choose your route, date and car. We confirm your booking quickly."

**Layout, desktop (1024 px and up)**

```
+----------------------------------------+----------------------+
| STEPPER (5 diamonds with labels)       |                      |
|----------------------------------------|   SUMMARY PANEL      |
|  Step content (8 columns)              |   (sticky, 4 cols)   |
|                                        |   Route              |
|                                        |   Date / time        |
|                                        |   Car                |
|                                        |   Passengers/luggage |
|                                        |   PRICE (animated)   |
|  [Back]                    [Continue]  |                      |
+----------------------------------------+----------------------+
```

**Layout, mobile**: single column. Compact stepper at the top (current step name + "2 of 6", thin progress line). A **sticky bottom bar** (glass) with the live price on the start side and the Continue button on the end side; the summary opens as a bottom sheet when the price is tapped.

**Stepper**: diamond nodes joined by a line. Completed nodes are gold-filled with a tick, current node has a pulsing ring, future nodes are outlined. The line fills with gold as steps complete (animated).

**Step contents**

1. **Route**: two large selects, "Pickup point" and "Drop-off point", with a **swap button** (circular arrows icon that rotates 180 degrees on click) between them. Drop-off options are limited to valid routes. If a hotel-area free text applies, it appears below with a smooth height expand. A small route line graphic (dot - dashed road - pin) animates when both points are chosen.
2. **Date and time**: date picker and time picker side by side (stacked on mobile). Under them, small text with the minimum notice rule.
3. **Car**: vertical list of car cards (desktop: image left 40 percent, details right). Each shows photo, name, passenger and luggage icons with numbers, short description, and the **price in the selected currency** on the end side. The selected card gets the selected style. If a car cannot fit the passengers the user entered, it shows dimmed with a short note.
4. **Passengers and luggage**: two number steppers with icons. Live capacity hint.
5. **Your details**: form in a two-column grid (name, email; phone; nationality; passport upload full width). Consent checkbox with links to Privacy and Terms.
6. **Payment**: two radio cards, **Cash** and **Bank transfer**.
   - Bank transfer expands to show the bank details in a bordered "ledger" block with **Copy** buttons on account number / IBAN, the amount to pay in the chosen currency highlighted in gold, simple instructions (3 short numbered lines), and the screenshot dropzone.
7. **Review and submit**: a summary card framed like a papyrus plaque (cartouche-style header "Your booking"), all details in a two-column definition list, price total large, payment method, and a single primary **Send booking** button. Below: "Your booking is confirmed only after our team approves it."

(Steps 4 and 5 may be combined on mobile to reduce length; the stepper shows 5 stages: Route, Date, Car, Details, Payment & review. **[CHOICE]**)

**Confirmation screen** (replaces the wizard)
- Large **ankh** symbol draws on in gold (0.9 s), a soft glow pulse follows.
- H2 "Booking received".
- **Reference** shown inside a cartouche frame (for example CT-D-000123) with a copy button.
- Status timeline of three nodes: Submitted (done) - Admin approval (current, pulsing) - Confirmation by email and WhatsApp (upcoming).
- Text: "We will email and WhatsApp you as soon as your booking is approved."
- Buttons: Back to home, Book another ride.

### 5.3 Trip Files page (trip builder)

**Page header**: same smaller scene, H1 "Trip Files", line "Choose the places you want to see. We will confirm everything and your price on WhatsApp."

**Layout, desktop**

```
+-----------+------------------------------------+-------------------+
| CITY NAV  |  PLACES (2-column grid)            |  MY TRIP FILE     |
| (sticky)  |  City: LUXOR  [3 selected]         |  (sticky panel,   |
|  Luxor    |  (img)  (img)                      |   papyrus scroll  |
|  Aswan    |  [x]Name [ ]Name                   |   style)          |
|  Hurghada |  desc    desc                      |                   |
|  Marsa    |  City: ASWAN ...                   |  Luxor            |
|  Alam     |                                    |   - Karnak        |
|           |                                    |   - Valley ...    |
|           |                                    |  Aswan            |
|           |                                    |   - Philae        |
|           |                                    |  [Continue]       |
+-----------+------------------------------------+-------------------+
```

- **City nav (left, sticky)**: the four cities; the one in view is highlighted with a gold bar; each shows a small counter badge with the number of selected places. Clicking scrolls smoothly to that city.
- **City section header**: city cover image strip (16:5) with the city name in Cinzel over it, short description, and the counter.
- **Place card**: image (3:2) with gradient, **checkbox in the top corner (large 28 px)**, name (H4), short description (max 2 lines). The **whole card is clickable** to toggle. Selected state: gold border, glow, image gets a slight brightness lift, tick draws on, card scales to 1.01 with spring-ui. A subtle "Selected" label appears.
- **My Trip File (right, sticky)**: styled like a papyrus scroll plaque (dark with gold edging). Lists selected places grouped by city with small remove (x) buttons; items animate in and out (height + fade, layout animation so the list reflows smoothly). Empty state: "Tick places to build your trip." Counter at the top: "4 places in 2 cities". Primary **Continue** button (disabled until at least one place is selected).
- **Mobile**: city chips in a horizontal sticky bar under the header (scrollable, with counters); place cards single column; a **floating bar at the bottom** ("My Trip File - 4 places" + Continue). Tapping the bar opens the trip summary as a bottom sheet.

**Next steps (after Continue)** on the same page, wizard style (same stepper pattern):
1. **Dates**: start date picker and "Number of days" stepper; shows the calculated end date in a small cartouche-style chip. (Layout: two columns on desktop.)
2. **Your details**: same form as Direct Ride (including passport upload and consent).
3. **Review and send**: summary of places grouped by city, dates, people, contact info. Button: **Send and continue on WhatsApp** (WhatsApp glyph inside the primary button). Note: "No payment now. We will confirm availability and your custom price on WhatsApp."

**WhatsApp redirect screen**
- After submit the screen shows the winged sun emblem with a gentle rotating gold ring and text "Opening WhatsApp...". After 1.5 s the redirect happens. A visible **Open WhatsApp** button and **Copy message** button remain in case it is blocked.
- Below: the booking reference in a cartouche and a 3-node status timeline: Request received (done), Chat on WhatsApp (current), Price and confirmation (upcoming).

### 5.4 About page

```
[ Mini hero: H1 "About Cleopatra Transfers" ]
[ Story: 2 columns (text | tall image with clip reveal) ]
[ Our promise: 3 feature cards ]
[ Cities we serve: 4 small city tiles linking to Trip Files ]
[ CTA band ]
```

- Text blocks use a 640 px max line length. A pull quote in Cinzel italic gold with a thin gold line beside it.
- The image has an offset gold frame (a gold outline rectangle shifted 16 px behind the photo) and slow parallax (max 30 px).

### 5.5 Contact page

```
[ Mini hero: H1 "Contact us" ]
[ Left: contact cards (WhatsApp, Email, Phone)  |  Right: contact form ]
[ Cities served strip ]
```

- WhatsApp is the primary contact card (largest, gold border, "Chat now" button).
- Form: name, email, message, captcha, **Send** button. On success the form is replaced by a small ankh check and "Message sent."
- On mobile the form comes after the cards.

### 5.6 Privacy Policy and Terms

- Narrow reading layout (720 px column), H1, last-updated date, a sticky table of contents on desktop (left), plain readable text with generous spacing. Section headings get a small gold diamond.
- Minimal motion (fade-in only).

### 5.7 System pages

- **404** and **error** per section 4.9.
- **Maintenance**: winged sun, "We will be right back."

---

## 6. Admin Panel Design

Utilitarian but on-brand: same dark palette and gold accent, minimal motion (150 to 200 ms fades), high information density, English UI, desktop first with a usable tablet and phone layout.

### 6.1 Shell

```
+---------+---------------------------------------------+
| SIDEBAR |  TOP BAR: page title | search | admin menu  |
| (240px) |---------------------------------------------|
| logo    |                                             |
| Dashboard                 PAGE CONTENT                |
| Direct bookings                                       |
| Trip requests                                         |
| Locations & routes                                    |
| Cars                                                  |
| Pricing                                               |
| Cities & places                                       |
| Admins                                                |
| Settings                                              |
| Activity log                                          |
+---------+---------------------------------------------+
```

- Sidebar: `bg-0`, gold-line active indicator, icons 20 px, count badges for pending bookings and new trip requests. Collapsible to icons only; on mobile it becomes a slide-in drawer.
- Top bar: global search (reference, name, phone, email), notification dot, admin avatar menu (profile, logout).
- Content area: `bg-1` page, cards on `bg-0`.

### 6.2 Login page

Centered card on the hero scene background (static). Logo, email, password, **Sign in**, "Forgot password" link. Error messages inline. No sign-up link.

### 6.3 Dashboard

- Row of 4 stat cards: Pending direct bookings, Awaiting payment check, New trip requests, Trips today and tomorrow. Each is clickable and shows a number (count-up animation 0.6 s).
- Two lists below: "Latest pending bookings" and "Latest trip requests" with quick **Open** actions.

### 6.4 Tables (bookings, requests, admins, etc.)

- Sticky header row, row height 56 px, hover highlight `bg-2` at 40 percent, zebra off.
- Toolbar above: search, filters (status, date range, route, city, payment method) as chips, Export CSV button.
- Columns (direct bookings): Reference, Client, Route, Date and time, Car, Price, Payment, Status, Created. Status and payment as badges.
- Pagination bottom end (25 per page).
- Mobile: each row becomes a card with the key fields and a badge.

### 6.5 Booking detail (direct)

```
+---------------------------------------+-------------------+
| Header: reference | status badge      |  ACTIONS (sticky) |
|---------------------------------------|  [Approve]        |
| Trip: route, date/time, car, price    |  [Reject]         |
| Client: name, phone (WhatsApp link),  |  [Payment OK]     |
|         email, nationality, people    |  [Payment bad]    |
| Payment: method, status, screenshot   |  [Cancel]         |
| Passport photo (thumbnail > lightbox) |  [Completed]      |
| Admin notes (editable)                |                   |
| Status history timeline               |  Notes            |
+---------------------------------------+-------------------+
```

- Passport photo and payment screenshot show as thumbnails that open the lightbox (zoom, pan, download). A small warning label: "Sensitive document".
- **Approve** is the primary gold button; **Reject** opens a modal asking for an optional reason shown to the client; confirmations use modals with clear wording.
- Phone number has a **WhatsApp** quick-link icon.

### 6.6 Trip request detail

- Left: client info, dates, passengers, passport photo, **selected places grouped by city** (readable list with small thumbnails), notes.
- Right: status selector (New, Contacted, Confirmed, Completed, Cancelled), optional agreed price + currency fields, **Open WhatsApp chat** button, notes box, history.

### 6.7 Locations and routes

- Two tabs: Locations, Routes. Locations: table with type badge and active toggle; "Add location" opens a side drawer form.
- Routes: table "From - To", active toggle, "Add route" drawer with two selects and the **"Also create reverse route"** switch.

### 6.8 Cars

- Card grid (3 per row desktop): photo, name, capacities, active toggle, edit button; "Add car" card with a plus. Edit in a side drawer or full-page form.

### 6.9 Pricing matrix

```
Route: [ Hurghada Airport > Hurghada ▼ ]       [Copy from reverse route]
+-----------------+----------+----------+----------+
| Car             | USD      | EGP      | EUR      |
+-----------------+----------+----------+----------+
| Sedan           | [ 30 ]   | [ 1500 ] | [ 28 ]   |
| Minivan         | [ 45 ]   | [ 2250 ] | [ 42 ]   |
| Minibus         | [ --- ]  | [ --- ]  | [ --- ]  |
+-----------------+----------+----------+----------+
[ Save changes ]   (unsaved indicator, "3 changes")
```

- Number inputs with currency symbol prefix, empty cells show a warning outline and "No price set (car hidden for this route)". Edited cells get a small gold dot until saved. Save shows a toast.

### 6.10 Cities and places

- Left: list of cities (drag handles to reorder, active toggles). Right: the selected city's places as cards (image, name, short description), drag to reorder, "Add place" card.
- Content forms show **tabs for each language**: EN and AR are editable; RU and DE show an "Auto-translated" badge with an **Edit** pencil to override. A "Re-translate from English" button resets them.
- Image upload with a crop tool locked to the correct aspect ratio (3:2 places, 4:5 or 16:5 city images, 16:9 cars).

### 6.11 Settings

- Grouped cards with save buttons per group: Contact and WhatsApp, Notifications (emails and numbers), Bank account (ledger-style preview of how clients see it), Booking rules (minimum notice, max trip days, default currency, retention days), Message templates (tabs per language with live preview), Social links.

### 6.12 Admin motion

Fades and 8 px slides only, 150 to 200 ms. Table rows fade in on load. Drawers slide from the end side (0.25 s). No parallax, no particles.

---

## 7. Responsive Behavior Summary

| Area | Mobile (below 768) | Tablet (768 to 1023) | Desktop (1024+) |
|---|---|---|---|
| Header | Logo + hamburger | Logo + hamburger | Full nav |
| Hero | Simplified scene, 100svh, text centered | Same | Full scene with pointer parallax |
| Services | Stacked cards | Two columns | Two columns |
| Destinations | Snap carousel | 2x2 grid | Editorial asymmetric grid |
| Direct wizard | One column + sticky bottom bar | One column + inline summary | Two columns with sticky summary |
| Trip builder | City chips + floating bar + bottom sheet | Two columns (places + sticky summary) | Three columns |
| Tables (admin) | Cards | Table with horizontal scroll | Full table |

Touch targets minimum 44 px. Forms use the correct mobile keyboards (email, tel, numeric). Date and time pickers are usable with one hand.

---

## 8. Right-to-Left (Arabic)

- Use logical start/end spacing so the whole layout mirrors automatically.
- Mirror: header order, nav, stepper direction, arrows and chevrons, wizard slide directions, sticky panels (summary goes to the left), floating buttons, carousels, underline draw direction.
- Do **not** mirror: logo, wings (symmetrical), phone numbers, numerals in inputs, the WhatsApp glyph, play/media icons.
- Numbers: Western digits by default **[CHOICE]**; currency codes stay Latin (USD, EGP, EUR).
- Typography: Cairo, larger size and line-height per section 1.2; no letter-spacing.
- The hero name inside the cartouche stays in Latin letters (brand name) in all languages; the tagline translates.

---

## 9. Accessibility

- Contrast: gold on `bg-0` and ivory on `bg-0` both exceed 4.5:1; check gold-on-`bg-2` and `ivory-45` (decorative or disabled only).
- Visible focus ring on every interactive element: 2 px `gold-300` with 2 px offset.
- Full keyboard navigation of wizard steps, trip builder checkboxes (Space toggles), modals (focus trap, Esc closes), menus.
- All images have meaningful alt text (translated); decorative ornaments are `aria-hidden`.
- Form errors are announced (live region) and linked to fields.
- Hero intro is skippable, not required to use the site, and respects reduced motion.
- Language attribute and text direction set on the page for each locale.

---

## 10. Asset Checklist

| Asset | Format | Notes |
|---|---|---|
| Logo (full, emblem only, wordmark) | SVG + PNG 2048 x 2048 | Supplied: `cleopatra-transfers-logo.svg/png` in `public/brand/`. Emblem-only version to be exported for the header and favicon. |
| Hero layers: sky, dunes (3), pyramids, sun disc, road | Optimized SVG or WebP | Each layer separate for parallax; total under about 500 KB |
| Wing feathers and cartouche paths | SVG paths (inline) | Needed for the draw-on and spread animations |
| Grain texture | Small tiled PNG/WebP | 3 to 4 percent opacity |
| Border band and divider patterns | SVG | Repeating, themeable color |
| Custom icons (winged sun, ankh, pyramid, route, car, luggage, passenger, passport) | SVG | 1.5 px stroke style |
| City images (4) | WebP/AVIF, 4:5 and 16:5 crops | Owner to supply or approve |
| Place images | WebP/AVIF, 3:2 | Added by admin |
| Car images | WebP/AVIF, 16:9 | Added by admin |
| Open Graph image | 1200 x 630 | Logo on the night scene |
| Favicon set and Apple touch icon | From the emblem | |

---

## 11. Microcopy Guide (English; translate to AR, RU, DE)

- Tone: warm, confident, clear, never pushy. Short sentences.
- Buttons: "Book a Direct Ride", "Plan a Trip File", "Continue", "Back", "Send booking", "Send and continue on WhatsApp", "Open WhatsApp", "Copy".
- Reassurance lines: "Fixed prices, no hidden fees." (only if the owner confirms it is true); "Your passport photo is stored securely and only seen by our team."
- Errors: explain how to fix, for example "Please upload a clear photo of your passport (JPG, PNG or PDF, up to 10 MB)."
- Empty trip: "Tick places to build your trip."
- Never invent statistics, reviews, awards or guarantees.

---

## 12. Implementation Notes for OpenCode

1. Build design tokens first (colors, type, spacing, radii, shadows, durations, easings) as a single source used by the styling system and the animation helpers.
2. Create a small animation library from section 2.3 (fade-up, stagger group, line mask, image reveal, draw-on, shimmer, step transition, price change, shake) and reuse it everywhere instead of one-off animations.
3. Build the hero as an isolated, well-structured component with the layered scene and a timeline matching section 3.2; make the scene a persistent background shared with the home hero so the exit transition is seamless (shared-element animation for the emblem).
4. Server-render all content so SEO is unaffected by animation; animation enhances after hydration.
5. Test on a mid-range Android phone and on slow 4G; adjust particle counts and layer detail to hold 50+ fps.
6. Test every page in Arabic (RTL) and in German (long words) before sign-off.
7. Respect `prefers-reduced-motion` everywhere (section 2.4).

---

## 13. Open Items

1. **Reference matches**: owner to share screenshots or a screen recording of the parts of the Bake Studio website to mirror (for example scroll effects, menu animation, hover effects). This file will then get a "Reference Matches" section.
2. **Pinterest**: owner to share links or screenshots of pins they like (colors, layouts, ornaments) for a second refinement pass.
3. **Photography**: real photos of the four cities, places and cars.
4. **Confirm [CHOICE] items**: optional "Popular transfers" section, five-stage wizard stepper, Western digits in Arabic, heading font fallbacks for Russian.
5. Whether to include sound (not recommended; none is specified).
