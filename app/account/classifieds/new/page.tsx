import { AppShell } from "@/components/AppShell";
import { ClassifiedForm } from "@/components/ClassifiedForm";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

export default async function NewClassifiedPage() {
  await requireAuth();
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Post listing"
      layout="community"
      backHref="/account/classifieds"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ClassifiedForm />
    </AppShell>
  );
}
