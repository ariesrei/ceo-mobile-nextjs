import { cookies } from "next/headers";
import { SplashScreen } from "@/components/SplashScreen";
import {
  COOKIE_APP_PROFILE,
  COOKIE_SITE_PROFILE,
  resolveDisplayAppProfile,
} from "@/lib/app-profile";
import { COOKIE_BASE_URL } from "@/lib/wp";

/**
 * Cookie read lives here, not in the root layout. An async RootLayout that
 * awaits cookies() makes Next attribute every child throw (and hydration
 * recovery) to `<body>`, which is what the after-login overlay was showing.
 */
export async function SplashGate() {
  let connected = false;
  let appProfile = resolveDisplayAppProfile({});
  try {
    const jar = await cookies();
    const baseUrl = jar.get(COOKIE_BASE_URL)?.value?.trim() || "";
    connected = Boolean(baseUrl);
    appProfile = resolveDisplayAppProfile({
      propertyUrl: baseUrl,
      siteCookie: jar.get(COOKIE_SITE_PROFILE)?.value,
      appCookie: jar.get(COOKIE_APP_PROFILE)?.value,
    });
  } catch {
    connected = false;
  }
  return <SplashScreen connected={connected} appProfile={appProfile} />;
}
