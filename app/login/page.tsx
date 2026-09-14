import { LoginForm } from "@/components/LoginForm";
import { getServerClientBranding, requireConnected } from "@/lib/server-nav";

export default async function LoginPage() {
  await requireConnected();
  const branding = await getServerClientBranding();

  return (
    <main className="ceo-login-page">
      <LoginForm
        fallbackLogo={branding.logo}
        fallbackName={branding.name}
        fallbackHero={branding.hero}
        fallbackTagline={branding.tagline}
      />
    </main>
  );
}
