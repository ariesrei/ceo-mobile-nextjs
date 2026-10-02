import { EventDetail } from "@/components/EventDetail";
import { AppShell } from "@/components/AppShell";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string }>;
};

export default async function EventDetailPage({ params, searchParams }: Props) {
  await requireAuth();
  const [{ id }, query, branding] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as { from?: string }),
    getServerClientBranding(),
  ]);

  return (
    <AppShell
      title="Event"
      layout="community"
      backHref={query.from === "home" ? "/account" : "/account/events"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <EventDetail eventId={Number(id) || 0} from={query.from} />
    </AppShell>
  );
}
