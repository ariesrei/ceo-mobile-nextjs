# Deploy to Vercel

This GitHub repo (`ariesrei/ceo-mobile-nextjs`) **is** the Next.js app. Leave **Root Directory** empty (repo root).

## Option A — Vercel Dashboard

1. Push to GitHub: `ariesrei/ceo-mobile-nextjs`.
2. [vercel.com](https://vercel.com) → **Add New…** → **Project** → import the repo (or open the existing project).
3. Configure:
   - **Root Directory:** empty / `.` (not a subfolder)
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
4. **Environment variables:** none required for Connect.  
   Do **not** set `CEO_ALLOW_INSECURE_TLS` on Vercel.
5. **Deploy**. Open the `*.vercel.app` URL.

## Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Run these from this repo root. Link to the existing project or create a new one.

## After deploy

1. WordPress must be reachable on the public internet (LocalWP **Live Link**, staging, or production). `*.local` will not work from Vercel.
2. Open the Vercel URL → **Connect**:
   - Property URL = public WordPress URL (include multisite path if any)
   - Security key = Mobile app key from WP
3. Sign in as staff or resident and smoke-test Home, Parcels, Warranty / ClaimTrack, Maintenance, Profile.

## Notes

| Topic | Detail |
|--------|--------|
| WP must be public | Live Link or hosted site — not `*.local` on your PC |
| Live Links | Temporary; URL may change when Local restarts |
| Cookies | `/api/*` stays on the Vercel domain (same-site auth cookies) |
| Custom domain | Vercel → Project → Settings → Domains |
| Theme | Deployed app needs the matching `dayone-intranet-sub` REST routes on WP |

## Redeploy

Push to the connected Git branch, or run `vercel --prod` again from this folder.
