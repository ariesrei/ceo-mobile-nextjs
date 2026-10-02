import { ReactNode, Suspense } from "react";
import { ClientBrandProvider } from "@/components/ClientBrandProvider";
import { NavProgress } from "@/components/NavProgress";
import { NotificationVisitAck } from "@/components/NotificationVisitAck";
import { SessionKeepAlive } from "@/components/SessionKeepAlive";
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
      hero={branding?.hero ?? ""}
    >
      <Suspense fallback={null}>
        <NavProgress />
        <NotificationVisitAck />
      </Suspense>
      <SessionKeepAlive />
      {children}
    </ClientBrandProvider>
  );
}
