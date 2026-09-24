import { cookies } from "next/headers";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import {
  getServerAppProfile,
  getServerClientBranding,
  requireConnected,
} from "@/lib/server-nav";
import { COOKIE_BASE_URL } from "@/lib/wp";

export default async function ForgotPasswordPage() {
  await requireConnected();
  const [branding, appProfile, jar] = await Promise.all([
    getServerClientBranding(),
    getServerAppProfile(),
    cookies(),
  ]);

  return (
    <main className="ceo-login-page">
      <ForgotPasswordForm
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
