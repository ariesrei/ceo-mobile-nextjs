import { AppShell } from "@/components/AppShell";
import { ClassifiedDetail } from "@/components/ClassifiedDetail";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClassifiedDetailPage({ params }: Props) {
  await requireAuth();
  const [{ id }, branding] = await Promise.all([
    params,
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Listing"
      layout="community"
      backHref="/account/classifieds"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ClassifiedDetail classifiedId={Number(id) || 0} />
    </AppShell>
  );
}
