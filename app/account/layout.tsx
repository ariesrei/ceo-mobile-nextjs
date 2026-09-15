import { ReactNode } from "react";
import { ClientBrandProvider } from "@/components/ClientBrandProvider";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();
  const branding = await getServerClientBranding();

  return (
    <ClientBrandProvider
      name={branding?.name ?? ""}
      logo={branding?.logo ?? ""}
    >
      {children}
    </ClientBrandProvider>
  );
}
