import { cookies } from "next/headers";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import {
  getServerAppProfile,
  getServerClientBranding,
  requireConnected,
} from "@/lib/server-nav";
import { COOKIE_BASE_URL } from "@/lib/wp";

type Props = {
  searchParams: Promise<{ key?: string; login?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  await requireConnected();
  const [branding, appProfile, jar, query] = await Promise.all([
    getServerClientBranding(),
    getServerAppProfile(),
    cookies(),
    searchParams,
  ]);
  const screen = {
    fallbackLogo: branding?.logo ?? "",
    fallbackName: branding?.name ?? "",
    fallbackHero: branding?.hero ?? "",
    fallbackTagline: branding?.tagline ?? "",
    fallbackBaseUrl: jar.get(COOKIE_BASE_URL)?.value?.trim() || "",
    appProfile,
  };
  const resetKey = String(query.key || "").trim();
  const login = String(query.login || "").trim();

  return (
    <main className="ceo-login-page">
      {resetKey && login ? (
        <ResetPasswordForm resetKey={resetKey} login={login} {...screen} />
      ) : (
        <ForgotPasswordForm {...screen} />
      )}
    </main>
  );
}
