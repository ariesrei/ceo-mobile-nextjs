# CE OneSource — Resident Portal (Next.js)

Headless Resident Portal for CE OneSource. Connects to a WordPress property via **URL + mobile security key**, authenticates with **JWT**, and renders **My Account** menus from a role-aware WordPress API.

## Requirements

- Node.js 20+
- A CE OneSource WordPress property with theme `dayone-intranet-sub` (includes `onesource/v1/app/*` REST routes)
- Mobile security key configured in WP (same key used by the Capacitor connect flow)

## Setup

```bash
cd ceo-mobile-nextjs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## App flow

1. **Connect** (`/connect`) — property URL + security key → `POST /wp-json/onesource/v1/mobile/verify-connect`
2. **Login** (`/login`) — credentials → `POST /wp-json/onesource/v1/app/auth/login` (tokens stored in httpOnly cookies)
3. **My Account** (`/account`) — menus from `GET /wp-json/onesource/v1/app/navigation`

### Resident menus (phase 1)

- My Profile
- Edit Profile
- Reservations (when calendar / contact reservations module is on)
- Additional Information (pets, vehicles, preferences, …)
- History

### Building Admin / Staff menus

Login is allowed for `staff_user` and `building_admin` (also `client_admin` / `administrator`).  
`GET /app/navigation` returns only these items (gated by Staff Access + modules):

| Menu | Path | Enabled when |
|------|------|----------------|
| Contacts | `/account/contacts` | `contacts_access` |
| Guests | `/account/guests` | `guest_access` |
| Parcels | `/account/parcels` | parcels module + Building/Client Admin **or** staff `parcel_access` (create/edit supported) |
| Warranties | `/account/warranties` | `warranties_access` + warranty module |
| Maintenance | `/account/maintenance` | `maintenance_access` |
| Activities | `/account/activities` | `activities_access` |

Building Admin / Client Admin pass all access checks (same as desktop). Screens are placeholders until full workflows ship.

## WordPress REST (theme)

Namespace: `onesource/v1`

| Method | Route | Auth |
|--------|-------|------|
| POST | `/mobile/verify-connect` | public (security key) |
| POST | `/app/auth/login` | public |
| POST | `/app/auth/refresh` | refresh token |
| GET | `/app/me` | Bearer access |
| GET | `/app/navigation` | Bearer access |
| GET/PATCH | `/app/profile` | Bearer access |
| GET | `/app/additional-info` | Bearer access |
| GET | `/app/additional-info/options` | Bearer access |
| POST/PATCH | `/app/additional-info/pets[/id]` | Bearer access |
| POST/PATCH | `/app/additional-info/vehicles[/id]` | Bearer access |
| POST/PATCH | `/app/additional-info/preferences[/id]` | Bearer access |
| GET | `/app/reservations` | Bearer access |
| GET | `/app/history` | Bearer access |

Resident create/edit for pets, vehicles, and preferences follows the PHP portal: submissions go through **gatekeeper review** (draft until staff approves).

PHP lives under:

`wp-content/themes/dayone-intranet-sub/inc/rest/app/`

JWT secret is auto-generated into WP option `option_ceo_app_jwt_secret` (separate from the mobile connect key). Tokens are scoped with `blog_id` for multisite safety.

## Local testing notes

- Start the site in **LocalWP** before connecting.
- Use the full property URL (subsite path included for multisite), e.g. `http://ceonesource.local` or the HTTPS URL Local shows.
- **LocalWP HTTPS:** Node does not trust Local’s SSL cert by default. In `npm run dev`, the app allows insecure TLS for server → WordPress calls. For production builds against Local HTTPS, set `CEO_ALLOW_INSECURE_TLS=1`, or prefer the `http://` site URL.
- CORS allows the Next origin; browser calls go through Next `/api/*` proxies so cookies stay first-party
- Profile edits submit through gatekeeper review (same as the PHP Resident Portal)

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve production build

## Deploy (Vercel demo)

See **[DEPLOY.md](./DEPLOY.md)**. Summary: import the GitHub repo on Vercel, set **Root Directory** to `ceo-mobile-nextjs`, deploy, then Connect using a LocalWP **Live Link** (or staging) WordPress URL.

## Android

See **[ANDROID.md](./ANDROID.md)** and the Capacitor shell in `../ceo-mobile-nextjs-cap/`.
