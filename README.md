# CE OneSource — Mobile App (Next.js)

Headless staff and resident app for CE OneSource. Connects to a WordPress property via **URL + mobile security key**, authenticates with **JWT**, and renders menus from a role-aware WordPress API.

This repository is the Next.js app. WordPress REST lives in theme `dayone-intranet-sub` (`onesource/v1/app/*`).

## Requirements

- Node.js 20+
- A CE OneSource WordPress property with theme `dayone-intranet-sub`
- Mobile security key configured in WP (same key used by the Capacitor connect flow)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## App flow

1. **Connect** (`/connect`) — property URL + security key → `POST /wp-json/onesource/v1/mobile/verify-connect`
2. **Login** (`/login`) — credentials → `POST /wp-json/onesource/v1/app/auth/login` (tokens in httpOnly cookies)
3. **Home** (`/account`) — menus from `GET /wp-json/onesource/v1/app/navigation`

Staff users see staff menus even if they also have a resident role.

## Devices

- **Phone** — compact single-column layout (max ~32rem)
- **Tablet / iPad** (768px+) — wider shell, 2-column lists and forms, 3–4 home tiles
- **iPad landscape** (1024px+) — home splits hero and tiles side by side; bottom nav is a floating bar

Viewport uses `device-width` and `viewport-fit=cover` for safe areas.

## UI

Dark theme (`#0E1116` / teal `#2EC4B6`). Dates on ACF-backed forms use **m/d/Y**.

## Resident menus

Bottom nav: **Home · Profile · Edit Profile · Reservations · Parcels · More**

| Menu | Path | Notes |
|------|------|--------|
| My Profile | `/account/profile` | Read-only |
| Edit Profile | `/account/edit` | Photo queues for **gatekeeper review** |
| Reservations | `/account/reservations` | When calendar / reservations module is on |
| Parcels | `/account/parcels` | Own parcels only, read-only |
| Additional Information | `/account/additional-info` | Pets, vehicles, preferences (home tile) |
| History | `/account/history` | More |
| Warranty Claim | `/account/warranties` | Home tile (My Warranty in WP nav) |

Pets, vehicles, preferences, and profile photo go through **gatekeeper review**.

## Staff menus

Dashboard tile and bottom nav label: **Warranty**. List page title: **ClaimTrack**.

Staff modules currently enabled in the app: **Parcels**, **Warranty (ClaimTrack)**, **Maintenance**, **Guests**.

| Menu | Path | Enabled when |
|------|------|----------------|
| Parcels | `/account/parcels` | Parcels module + Building/Client Admin **or** `parcel_access` |
| Warranty | `/account/warranties` | Warranty module + Building/Client Admin **or** `warranties_access` |
| Maintenance | `/account/maintenance` | `maintenance_access` |
| Guests | `/account/guests` | Building/Client Admin **or** `guest_access` |
| Contacts | `/account/contacts` | `contacts_access` (placeholder) |
| Activities | `/account/activities` | `activities_access` (placeholder) |

Building Admin / Client Admin pass all access checks (same as desktop).

### Warranty (ClaimTrack)

- **Create ticket** (`/account/warranties/new`) — no status field. Staff create sets **New Warranty Approved**. First / last / email / phone fill from the **selected unit’s resident**, not the logged-in staff user.
- **Assign ticket** (`/account/warranties/{id}/assign`) — subcontractor, trades, target due (`m/d/Y`), internal notes. Hidden after the ticket is already assigned.
- List actions: Assign Subcontractor → Update Status → Edit.

## WordPress REST (theme)

Namespace: `onesource/v1`. Browser calls go through Next `/api/wp/{path}` (do **not** use `/api/wp/app/...`).

| Method | Route | Auth |
|--------|-------|------|
| POST | `/mobile/verify-connect` | public (security key) |
| POST | `/app/auth/login` | public |
| POST | `/app/auth/refresh` | refresh token |
| GET | `/app/me` | Bearer access |
| GET | `/app/navigation` | Bearer access |
| GET/PATCH | `/app/profile` | Bearer access |
| POST | `/app/profile/media` | Bearer access (photo for gatekeeper) |
| GET | `/app/additional-info` | Bearer access |
| GET | `/app/additional-info/options` | Bearer access |
| POST/PATCH | `/app/additional-info/pets[/id]` | Bearer access |
| POST/PATCH | `/app/additional-info/vehicles[/id]` | Bearer access |
| POST/PATCH | `/app/additional-info/preferences[/id]` | Bearer access |
| GET | `/app/reservations` | Bearer access |
| GET | `/app/history` | Bearer access |
| GET/POST | `/app/parcels` | Bearer access |
| GET | `/app/parcels/options` | Bearer access |
| POST | `/app/parcels/media` | Bearer access |
| POST | `/app/parcels/{id}/signout` | Bearer access |
| GET/PATCH | `/app/parcels/{id}` | Bearer access |
| GET/POST | `/app/warranties` | Bearer access |
| GET | `/app/warranties/options` | Bearer access (`unit_id` returns unit resident contact) |
| POST | `/app/warranties/media` | Bearer access |
| POST | `/app/warranties/{id}/assign` | Bearer access |
| POST | `/app/warranties/{id}/status` | Bearer access |
| GET/PATCH | `/app/warranties/{id}` | Bearer access |
| GET/POST | `/app/maintenance` | Bearer access |
| GET | `/app/maintenance/options` | Bearer access |
| POST | `/app/maintenance/media` | Bearer access |
| GET/PATCH | `/app/maintenance/{id}` | Bearer access |
| GET/POST | `/app/guests` | Bearer access |
| GET | `/app/guests/options` | Bearer access |
| POST | `/app/guests/media` | Bearer access |
| POST | `/app/guests/{id}/checkout` | Bearer access |
| GET/PATCH | `/app/guests/{id}` | Bearer access |

PHP lives under:

`wp-content/themes/dayone-intranet-sub/inc/rest/app/`

JWT secret is auto-generated into WP option `option_ceo_app_jwt_secret` (separate from the mobile connect key). Tokens are scoped with `blog_id` for multisite safety.

## Local testing notes

- Start the site in **LocalWP** before connecting.
- Use the full property URL (subsite path included for multisite), e.g. `http://ceonesource.local`.
- **LocalWP HTTPS:** Node does not trust Local’s SSL cert by default. `npm run dev` allows insecure TLS for server → WordPress calls. For production builds against Local HTTPS, set `CEO_ALLOW_INSECURE_TLS=1`, or use the `http://` site URL.
- Browser calls go through Next `/api/*` proxies so cookies stay first-party.
- Profile photo and additional-info edits go through gatekeeper review.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve production build

## Deploy (Vercel)

See **[DEPLOY.md](./DEPLOY.md)**. This repo root **is** the Next app — do not set a subdirectory Root Directory.

After deploy, Connect with a **public** WordPress URL (LocalWP Live Link or staging), not `*.local`.

## Android

See **[ANDROID.md](./ANDROID.md)** and the Capacitor shell in `../ceo-mobile-nextjs-cap/`.
