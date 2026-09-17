import { cookies } from "next/headers";
import { LoginForm } from "@/components/LoginForm";
import {
  getServerAppProfile,
  getServerClientBranding,
  requireConnected,
} from "@/lib/server-nav";
import { COOKIE_BASE_URL } from "@/lib/wp";

export default async function LoginPage() {
  await requireConnected();
  const [branding, appProfile, jar] = await Promise.all([
    getServerClientBranding(),
    getServerAppProfile(),
    cookies(),
  ]);

  return (
    <main className="ceo-login-page">
      <LoginForm
        fallbackLogo={branding?.logo ?? ""}
        fallbackName={branding?.name ?? ""}
        fallbackHero={branding?.hero ?? ""}
        fallbackTagline={branding?.tagline ?? ""}
        fallbackBaseUrl={jar.get(COOKIE_BASE_URL)?.value?.trim() || ""}
        appProfile={appProfile}
      />
    </main>
  );
}
