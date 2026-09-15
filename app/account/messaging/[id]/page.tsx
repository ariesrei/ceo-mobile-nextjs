import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { MessageThread } from "@/components/MessageThread";
import type { MessagingConversation } from "@/lib/messaging";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";
import { wpFetchServer } from "@/lib/wp";

type Props = { params: Promise<{ id: string }> };

export default async function MessagingThreadPage({ params }: Props) {
  await requireMenuPath("/account/messaging");
  const { id } = await params;
  const conversationId = Number(id);
  const [result, branding] = await Promise.all([
    wpFetchServer<{ item?: MessagingConversation }>(
      `/app/messaging/conversations/${conversationId}`
    ),
    getServerClientBranding(),
  ]);

  const title = result.data?.item?.title || "Conversation";

  return (
    <AppShell
      title={title}
      subtitle="Conversation"
      backHref="/account/messaging"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      {conversationId <= 0 || !result.data?.item ? (
        <Card>
          <p className="text-sm text-[var(--danger)]">
            {result.error || "Conversation not found."}
          </p>
        </Card>
      ) : (
        <MessageThread conversationId={conversationId} title={title} />
      )}
    </AppShell>
  );
}
