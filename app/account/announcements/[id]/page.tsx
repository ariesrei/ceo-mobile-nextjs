import { AnnouncementDetail } from "@/components/AnnouncementDetail";
import { AppShell } from "@/components/AppShell";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string }>;
};

export default async function AnnouncementDetailPage({
  params,
  searchParams,
}: Props) {
  await requireAuth();
  const [{ id }, query, branding] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as { from?: string }),
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Announcement"
      layout="community"
      backHref={query.from === "home" ? "/account" : "/account/announcements"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <AnnouncementDetail
        announcementId={Number(id) || 0}
        from={query.from}
      />
    </AppShell>
  );
}
