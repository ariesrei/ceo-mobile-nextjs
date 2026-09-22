"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MessagingConversation, MessagingListResponse } from "@/lib/messaging";
import { Card } from "./ui/Card";
import { ListGo, ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

export function MessagesList() {
  const [items, setItems] = useState<MessagingConversation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);

  useEffect(() => {
    setLoading(true);
    fetch("/api/wp/messaging/conversations")
      .then(async (r) => {
        const data = (await r.json()) as MessagingListResponse & {
          message?: string;
        };
        if (!r.ok) {
          setError(data.message || "Could not load messages.");
          setItems([]);
          return;
        }
        setItems(data.items || []);
      })
      .catch(() => {
        setError("Network error.");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (pending) {
    return <ListSkeleton rows={4} height={88} />;
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-[var(--danger)]">{error}</p>
      </Card>
    );
  }

  return (
    <PaginatedList
      items={items}
      listClassName="space-y-2"
      emptyIcon="chat"
      emptyMessage="No conversations yet"
      emptySubtitle="Messages with the office will show up here."
      getKey={(item) => item.id}
      renderItem={(item) => {
        const preview = item.last_message?.body || "No messages yet.";
        const unread = Number(item.unread_count || 0);
        return (
          <Link
            href={`/account/messaging/${item.id}`}
            className="ceo-claim-card"
          >
            <span className="ceo-claim-card__thumb ceo-claim-card__thumb--empty">
              {(item.title || "M").slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="ceo-claim-card__title">
                {item.title || "Conversation"}
              </span>
              <span className="ceo-claim-card__meta">
                <span>{preview}</span>
              </span>
            </span>
            {unread > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--accent)] px-2 text-xs font-bold text-[#081014]">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : (
              <ListGo icon="chat" />
            )}
          </Link>
        );
      }}
    />
  );
}
