import { AnnouncementDetail } from "@/components/AnnouncementDetail";
import { AppShell } from "@/components/AppShell";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AnnouncementDetailPage({ params }: Props) {
  await requireAuth();
  const [{ id }, branding] = await Promise.all([
    params,
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Announcement"
      layout="community"
      backHref="/account/announcements"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <AnnouncementDetail announcementId={Number(id) || 0} />
    </AppShell>
  );
}
