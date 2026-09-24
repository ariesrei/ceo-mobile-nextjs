import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { propertySiteFromQuery } from "@/lib/connect";
import {
  getServerAppProfile,
  getServerClientBranding,
} from "@/lib/server-nav";
import { COOKIE_BASE_URL } from "@/lib/wp";

type Props = {
  searchParams: Promise<{ key?: string; login?: string; site?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const query = await searchParams;
  const resetKey = String(query.key ?? "").trim();
  const login = String(query.login ?? "").trim();
  switch (resetKey) {
    case "":
      redirect("/forgot-password");
  }
  switch (login) {
    case "":
      redirect("/forgot-password");
  }

  const siteFromEmail = propertySiteFromQuery(String(query.site ?? ""));
  const [branding, appProfile, jar] = await Promise.all([
    getServerClientBranding(),
    getServerAppProfile(),
    cookies(),
  ]);
  const cookieUrl = jar.get(COOKIE_BASE_URL)?.value?.trim() ?? "";
  const fallbackBaseUrl = siteFromEmail || cookieUrl;

  return (
    <main className="ceo-login-page">
      <ResetPasswordForm
        resetKey={resetKey}
        login={login}
        fallbackLogo={branding?.logo ?? ""}
        fallbackName={branding?.name ?? ""}
        fallbackHero={branding?.hero ?? ""}
        fallbackTagline={branding?.tagline ?? ""}
        fallbackBaseUrl={fallbackBaseUrl}
        appProfile={appProfile}
      />
    </main>
  );
}
