import { cookies } from "next/headers";
import { SplashScreen } from "@/components/SplashScreen";
import { COOKIE_BASE_URL } from "@/lib/wp";

/**
 * Cookie read lives here, not in the root layout. An async RootLayout that
 * awaits cookies() makes Next attribute every child throw (and hydration
 * recovery) to `<body>`, which is what the after-login overlay was showing.
 */
export async function SplashGate() {
  let connected = false;
  try {
    const jar = await cookies();
    connected = Boolean(jar.get(COOKIE_BASE_URL)?.value?.trim());
  } catch {
    connected = false;
  }
  return <SplashScreen connected={connected} />;
}
