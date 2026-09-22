import { EventDetail } from "@/components/EventDetail";
import { AppShell } from "@/components/AppShell";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  await requireAuth();
  const [{ id }, branding] = await Promise.all([
    params,
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Event"
      layout="community"
      backHref="/account/events"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <EventDetail eventId={Number(id) || 0} />
    </AppShell>
  );
}
