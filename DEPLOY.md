# Deploy Resident Portal (Next.js) to Vercel

The git repo root is the WordPress `public/` folder. On Vercel, set **Root Directory** to `ceo-mobile-nextjs` so only this app builds.

## Option A — Vercel Dashboard (recommended)

1. Push this repo to GitHub (already: `ariesrei/ceo-cursor-setup` or your fork).
2. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project** → import the repo.
3. Configure the project:
   - **Root Directory:** `ceo-mobile-nextjs` (click Edit / continue → set this)
   - **Framework Preset:** Next.js (auto)
   - **Build Command:** `npm run build` (default)
   - **Output:** leave default (Next.js)
4. **Environment variables:** none required for the Connect flow  
   (property URL + security key are entered in the app).  
   Do **not** set `CEO_ALLOW_INSECURE_TLS` on Vercel.
5. Click **Deploy**. When finished, open the `*.vercel.app` URL.

## Option B — Vercel CLI

```bash
cd ceo-mobile-nextjs
npm i -g vercel
vercel login
vercel
```

When prompted:

- Link to existing project or create new
- Confirm root is `ceo-mobile-nextjs` (run the CLI **from this folder**)

Production deploy:

```bash
vercel --prod
```

## After deploy — test with LocalWP

1. In LocalWP, enable **Live Links** and copy the public WordPress URL (HTTPS).
2. Open your Vercel demo URL.
3. **Connect** with:
   - Property URL = Live Link URL (include multisite path if any)
   - Security key = Mobile app key from WP
4. Sign in as a resident and smoke-test Account / Additional Info / Reservations.

## Android later

Point Capacitor `server.url` at the Vercel URL (e.g. `https://your-app.vercel.app`).  
Residents still Connect to whatever WordPress URL you give them (Live Link or production).

## Notes

| Topic | Detail |
|--------|--------|
| WP must be public | Live Link or hosted staging — not `*.local` only on your PC |
| Live Links | Temporary; fine for demos; URL may change when restarted |
| Cookies | `/api/*` stays on the Vercel domain (same-site) — good for auth cookies |
| Custom domain | Vercel → Project → Settings → Domains |
| Monorepo | Always keep Root Directory = `ceo-mobile-nextjs` |

## Redeploy

Push to the connected Git branch, or run `vercel --prod` again from `ceo-mobile-nextjs`.
