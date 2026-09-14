# Two app builds, one code base

Warranty and Operations ship from this same repo. Splash, icon, and login
branding follow the build. After sign-in the dashboard depends on who
logged in: residents get the account tiles; Warranty staff get ClaimTrack.

## Build switch

| Build | Env var |
| --- | --- |
| CE OneSource Warranty (brown) | `NEXT_PUBLIC_CEO_APP_VARIANT=warranty` (default) |
| CE OneSource Operations (green) | `NEXT_PUBLIC_CEO_APP_VARIANT=operations` |

Set it per Vercel project so each build produces its own icon, splash, manifest
and store name. Locally:

```powershell
$env:NEXT_PUBLIC_CEO_APP_VARIANT = "operations"; npm run dev
```

## What the variant controls

Defined in `lib/brand.ts`:

- Store / PWA name: "CE OneSource Warranty" or "CE OneSource Operations"
- Logo: `public/brand/warranty-logo.png` or `public/brand/operations-logo.png`
- Tagline: "CAPTURE. TRACK. ASSIGN. CLOSE." or "OPERATE. SERVE. ENHANCE."
- Login badge: "Warranty Management" or "Operations Management"
- Splash gradient and theme color
- Post-login home: `/account` for residents; Warranty staff continue to `/account/warranties`

The blue CE OneSource mark is the company/site-level logo and is not used by
either app build.

## Native icons (Capacitor)

The web manifest and `<link rel="icon">` come from the variant above. The
Android/iOS launcher icons live in the Capacitor shell and are generated from
the same PNGs:

```bash
# in ceo-mobile-nextjs-cap
npx @capacitor/assets generate --iconBackgroundColor "#0B0705" \
  --splashBackgroundColor "#0B0705"
```

Point `assets/icon.png` at the matching `public/brand/*-logo.png` before
generating, and build the Android project once per variant (each needs its own
`applicationId`).
