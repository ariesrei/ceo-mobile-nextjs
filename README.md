# CE OneSource — Mobile App (Next.js)

Headless staff and resident app for CE OneSource. Connects to a WordPress property via **URL + mobile security key**, authenticates with **JWT**, and renders menus from a role-aware WordPress API.

**One Next.js codebase, two store products.** Do not clone this folder for ClaimTrack. WordPress REST lives in theme `dayone-intranet-sub` (`onesource/v1/app/*`).

## Folder structure

```
app/public/
├── ceo-mobile-nextjs/              # This app (Next.js 15 on Vercel)
│   ├── app/go/[profile]/           # /go/operations | /go/warranty — locks product
│   ├── app/download/               # Unlisted store links
│   ├── app/api/connect/            # verify-connect + plan mismatch
│   ├── lib/app-profile.ts          # warranty | operations
│   └── lib/navigation.ts           # ClaimTrack allowlist vs Operations modules
├── ceo-mobile-nextjs-cap/          # Capacitor shell (two Android flavors + iOS schemes)
│   ├── flavors/operations.json
│   ├── flavors/warranty.json
│   └── scripts/use-flavor.ps1
└── wp-content/themes/dayone-intranet-sub/
    └── inc/rest/app/               # JWT, navigation, warranties, …
```

Ignore the legacy `ceo-mobile/` WebView wrapper.

## Two products

| Profile | Store name | Bundle ID | Native entry | Who may connect |
|---------|------------|-----------|--------------|-----------------|
| `operations` | CE OneSource Operations | `com.ceonesource.residentnext` | `/go/operations` | Non-warranty-plan sites |
| `warranty` | ClaimTrack | `com.ceonesource.warranty` | `/go/warranty` | Warranty-plan sites only |

WordPress returns `plan_key` + `app_profile` on verify-connect, login, refresh, `/app/me`, and `/app/navigation` (from `ceonesource_client_is_warranty_plan()`). The wrong store app is refused at Connect.

- **Operations UI:** home + every module WordPress has on (including Warranty / ClaimTrack).
- **ClaimTrack UI:** warranties + profile/account only. Bottom nav: Home · Warranty · More.

Property download page: WordPress shortcode `[ceo_app_download]`. Web: `/download`, `/download?app=operations`, `/download?app=warranty`.

## Requirements

- Node.js 20+
- A CE OneSource WordPress property with theme `dayone-intranet-sub`
- Mobile security key configured in WP (Site Admin → Options → Mobile App)

## Setup

```bash
cd ceo-mobile-nextjs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| URL | What it does |
|-----|----------------|
| `/` | Redirects to connect, login, or account |
| `/connect` | Property URL + security key |
| `/login` | JWT sign-in |
| `/account` | Home |
| `/go/operations` | Lock this browser session as Operations |
| `/go/warranty` | Lock this browser session as ClaimTrack |
| `/download` | Store links for the matching (or both) products |

Optional env (see `.env.example`):

```bash
# NEXT_PUBLIC_APP_PROFILE=operations
# NEXT_PUBLIC_PLAY_STORE_URL=
# NEXT_PUBLIC_WARRANTY_PLAY_STORE_URL=
# NEXT_PUBLIC_APP_STORE_URL=
# NEXT_PUBLIC_WARRANTY_APP_STORE_URL=
```

## App flow

1. **Connect** (`/connect`) — property URL + security key → `POST /wp-json/onesource/v1/mobile/verify-connect`
2. Product lock (if `/go/warranty` or `/go/operations` ran) must match the site `app_profile`
3. **Login** (`/login`) — credentials → `POST /wp-json/onesource/v1/app/auth/login` (tokens in httpOnly cookies)
4. **Home** (`/account`) — menus from `GET /wp-json/onesource/v1/app/navigation`

Staff users see staff menus even if they also have a resident role.

## Native commands (sibling folder)

```bat
cd ..\ceo-mobile-nextjs-cap
npm install
npm run flavor:android
npm run flavor:operations
npm run build:android:operations
npm run flavor:warranty
npm run build:android:warranty
```

| Command | Result |
|---------|--------|
| `npm run flavor:operations` | Capacitor + iOS identity → Operations |
| `npm run flavor:warranty` | Capacitor + iOS identity → ClaimTrack |
| `npm run flavor:android` | Re-apply Gradle `operations` / `warranty` flavors after `cap sync` |
| `npm run build:android:operations` | AAB `android/app/build/outputs/bundle/operationsRelease/` |
| `npm run build:android:warranty` | AAB `android/app/build/outputs/bundle/warrantyRelease/` |
| `npm run open:ios` | Xcode — archive the **Operations** or **Warranty** scheme |

Full store steps: `../ceo-mobile-nextjs-cap/STORE.md` and `../docs/Mobile-Store-Unlisted-Publish.MD`.

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

Operations shows WordPress-enabled modules (Parcels, Warranty, Maintenance, Guests, plus others the site turns on). The Warranty product is ClaimTrack-first: warranties + profile/account only.

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

Host WAF (nginx, Cloudflare, AWS, or similar) must **allow** every route below. Blocking `/wp-json/onesource/v1/*` returns HTML `403 Forbidden` and breaks Connect, Login, and in-app data — including requests from Vercel, Capacitor, and the phone browser.

| Method | Route | Auth | WAF |
|--------|-------|------|-----|
| POST | `/mobile/verify-connect` | public (security key) | Don't Block |
| GET | `/mobile/branding` | public | Don't Block |
| POST | `/app/auth/login` | public | Don't Block |
| POST | `/app/auth/refresh` | refresh token | Don't Block |
| GET | `/app/me` | Bearer access | Don't Block |
| GET | `/app/navigation` | Bearer access | Don't Block |
| GET/PATCH | `/app/profile` | Bearer access | Don't Block |
| POST | `/app/profile/media` | Bearer access (photo for gatekeeper) | Don't Block |
| GET | `/app/additional-info` | Bearer access | Don't Block |
| GET | `/app/additional-info/options` | Bearer access | Don't Block |
| POST/PATCH | `/app/additional-info/pets[/id]` | Bearer access | Don't Block |
| POST/PATCH | `/app/additional-info/vehicles[/id]` | Bearer access | Don't Block |
| POST/PATCH | `/app/additional-info/preferences[/id]` | Bearer access | Don't Block |
| GET | `/app/reservations` | Bearer access | Don't Block |
| GET | `/app/history` | Bearer access | Don't Block |
| GET/POST | `/app/parcels` | Bearer access | Don't Block |
| GET | `/app/parcels/options` | Bearer access | Don't Block |
| POST | `/app/parcels/media` | Bearer access | Don't Block |
| POST | `/app/parcels/{id}/signout` | Bearer access | Don't Block |
| GET/PATCH | `/app/parcels/{id}` | Bearer access | Don't Block |
| GET/POST | `/app/warranties` | Bearer access | Don't Block |
| GET | `/app/warranties/options` | Bearer access (`unit_id` returns unit resident contact) | Don't Block |
| POST | `/app/warranties/media` | Bearer access | Don't Block |
| POST | `/app/warranties/{id}/assign` | Bearer access | Don't Block |
| POST | `/app/warranties/{id}/status` | Bearer access | Don't Block |
| GET/PATCH | `/app/warranties/{id}` | Bearer access | Don't Block |
| GET/POST | `/app/maintenance` | Bearer access | Don't Block |
| GET | `/app/maintenance/options` | Bearer access | Don't Block |
| POST | `/app/maintenance/media` | Bearer access | Don't Block |
| GET/PATCH | `/app/maintenance/{id}` | Bearer access | Don't Block |
| GET/POST | `/app/guests` | Bearer access | Don't Block |
| GET | `/app/guests/options` | Bearer access | Don't Block |
| POST | `/app/guests/media` | Bearer access | Don't Block |
| POST | `/app/guests/{id}/checkout` | Bearer access | Don't Block |
| GET/PATCH | `/app/guests/{id}` | Bearer access | Don't Block | |

PHP lives under:

`wp-content/themes/dayone-intranet-sub/inc/rest/app/`

JWT secret is auto-generated into WP option `option_ceo_app_jwt_secret` (separate from the mobile connect key). Tokens are scoped with `blog_id` for multisite safety.

## Local testing notes

- Start the site in **LocalWP** before connecting.
- Use the full property URL (subsite path included for multisite), e.g. `http://ceonesource.local`.
- **LocalWP HTTPS:** Node does not trust Local’s SSL cert by default. `npm run dev` allows insecure TLS for server → WordPress calls. For production builds against Local HTTPS, set `CEO_ALLOW_INSECURE_TLS=1`, or use the `http://` site URL.
- Browser calls go through Next `/api/*` proxies so cookies stay first-party.
- Profile photo and additional-info edits go through gatekeeper review.

## Scripts (this folder)

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve production build

## Deploy (Vercel)

See **[DEPLOY.md](./DEPLOY.md)**. This repo root **is** the Next app — do not set a subdirectory Root Directory.

After deploy, Connect with a **public** WordPress URL (LocalWP Live Link or staging), not `*.local`.

## Android / iOS

See **[ANDROID.md](./ANDROID.md)** and **[`../ceo-mobile-nextjs-cap/README.md`](../ceo-mobile-nextjs-cap/README.md)**.
