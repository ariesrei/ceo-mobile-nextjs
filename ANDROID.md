# Build Android for the Next.js portal

Your Next app stays on **Vercel**. Android is a Capacitor WebView in **`../ceo-mobile-nextjs-cap/`** (not `ceo-mobile`).

Two store apps share that shell:

| Flavor | Name | applicationId | Entry |
|--------|------|---------------|-------|
| `operations` | CE OneSource Operations | `com.ceonesource.residentnext` | `/go/operations` |
| `warranty` | ClaimTrack | `com.ceonesource.warranty` | `/go/warranty` |

## Quick steps

```bat
cd ..\ceo-mobile-nextjs-cap
npm install
npx cap add android
npm run sync
npm run flavor:android
npm run open:android
```

In Android Studio pick **operationsDebug** or **warrantyDebug**, then Run.

Two products means two APKs (or two Play AABs). Each flavor has its own launcher icon: green Operations seal and brown Warranty seal, from `ceo-mobile-nextjs/public/brand/`. Regenerate with `npm run assets:win` inside `ceo-mobile-nextjs-cap` before you build.

```bat
npm run build:android:win
npm run build:android:warranty:debug
```

Signed unlisted bundles:

```bat
npm run keystore:win
npm run assets:win
npm run build:android:operations
npm run build:android:warranty
```

See `ceo-mobile-nextjs-cap/README.md` and `ceo-mobile-nextjs-cap/STORE.md`.

Public download page: `/download` (`?app=operations` or `?app=warranty`). Set store URL env vars on Vercel when listings go live. Property sites: `[ceo_app_download]`.
