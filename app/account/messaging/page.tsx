import { AppShell } from "@/components/AppShell";
import { ComingSoonBoard } from "@/components/ComingSoonBoard";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function MessagingPage() {
  await requireMenuPath("/account/messaging");
  const branding = await getServerClientBranding();
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Messages"
      subtitle={community ? undefined : "Reply to building staff"}
      backHref={community ? undefined : "/account"}
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ComingSoonBoard
        kind="messages"
        copy="Messages with the office aren’t available yet. You’ll be able to chat with staff here soon."
      />
    </AppShell>
  );
}
