import { AppShell } from "@/components/AppShell";
import { MessagesList } from "@/components/MessagesList";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function MessagingPage() {
  await requireMenuPath("/account/messaging");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Messages"
      subtitle="Reply to building staff"
      backHref="/account"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <MessagesList />
    </AppShell>
  );
}
