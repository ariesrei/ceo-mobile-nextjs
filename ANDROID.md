# Build Android for the Next.js portal

Your Next app stays on **Vercel**. Android is a Capacitor WebView that opens that URL.

Project: **`../ceo-mobile-nextjs-cap/`** (not `ceo-mobile`).

## Quick steps

1. Edit `ceo-mobile-nextjs-cap/capacitor.config.json` → set `server.url` to your Vercel URL.
2. ```bash
   cd ceo-mobile-nextjs-cap
   npm install
   npx cap add android
   npm run sync
   npm run open:android
   ```
3. Run from Android Studio.
4. In the app: Connect to `https://demo.ceonesource.com/pacificvista` (+ key).

See `ceo-mobile-nextjs-cap/README.md` for APK / Play Store notes.
