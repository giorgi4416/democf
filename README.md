# MORNING. — Specialty Coffee & Brunch (client demo)

A static, dependency-free multi-page website (HTML + CSS + vanilla JS) in English and Georgian.

## Run locally

```bash
cd morning-cafe
npm run dev          # http://localhost:5173  (no npm install needed)
```

Any static host works (Netlify, Vercel, GitHub Pages, cPanel). There is no build step.

## Pages

| URL | Page |
|---|---|
| `/` | Home |
| `/menu/` | Full menu — category + dietary filters (V / VG / GF), deep links like `/menu/#desserts` |
| `/our-coffee/` | Origins, roasting, brewing methods, signature drinks, beans to take home |
| `/our-story/` | History, philosophy, atmosphere, ingredients, team |
| `/gallery/` | Photo gallery with categories and a full-screen lightbox (`/gallery/#coffee`) |
| `/whats-new/` | Seasonal drinks, new dishes, offers, news |
| `/contact/` | Address, hours (live "open now"), phone, Instagram, map, FAQ |

## Project structure

```
index.html                 homepage
menu/ our-coffee/ …        one folder per page (index.html) → clean URLs
partials/                  shared header, footer, call-to-reserve band, icons, lightbox
css/styles.css             one stylesheet (homepage styles first, inner-page additions at the end)
js/config.js               phone, address, map, social links, opening hours
js/menu-data.js            every dish (used by the homepage menu, Menu page and Our Coffee page)
js/i18n.js                 homepage + shared translations (EN / KA)
js/i18n-pages.js           translations for the inner pages
js/main.js                 shared behaviour (language, navigation, lightbox, animations)
js/pages/*.js              page-specific behaviour (menu filters, gallery filters, …)
scripts/sync-partials.js   copies partials/ into every page
```

### Changing the header, footer or navigation

Edit the file in `partials/`, then run:

```bash
npm run sync
```

It rewrites the marked regions (`<!-- partial:header -->…<!-- /partial:header -->`) in all seven pages, so the
navigation can never drift out of sync.

## Adapting it for a client

| What | Where |
|---|---|
| Phone (every "Call to Reserve" button), address, map location, Instagram/Facebook, opening hours | `js/config.js` |
| Hide the "Sample contact details" / "Sample content" notices | `js/config.js` → `isDemo: false` |
| Dishes, prices (₾), photos, dietary tags, "Signature" marks | `js/menu-data.js` (`fullOnly: true` = Menu page only) |
| Text in both languages | `js/i18n.js`, `js/i18n-pages.js` |
| Colours, fonts, spacing | top of `css/styles.css` (`:root` tokens) |

Reservations are phone-only: every reserve button is a `tel:` link built from `phoneHref`,
so phones open the dialer directly. There are no forms, payments or booking systems.

## Language

- Visitors with a Georgian browser get Georgian automatically; otherwise English.
- The choice is remembered across pages. `?lang=ge` or `?lang=en` forces a language.

## Content to replace before launch

Photography is free Unsplash stock, and the team, timeline, offers, news items, coffee origins and
contact details are realistic sample content for the demo. Replace them with the client's own.
