import { ReactNode } from "react";
import { cookies } from "next/headers";
import { WarrantyBrandProvider } from "@/components/WarrantyBrand";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { COOKIE_FIRST_NAME } from "@/lib/wp";

export default async function WarrantiesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();

  const [branding, jar] = await Promise.all([
    getServerClientBranding(),
    cookies(),
  ]);
  const firstName = jar.get(COOKIE_FIRST_NAME)?.value?.trim() || "";

  return (
    <WarrantyBrandProvider
      name={branding.name}
      logo={branding.logo}
      hero={branding.hero}
      firstName={firstName}
    >
      {children}
    </WarrantyBrandProvider>
  );
}
