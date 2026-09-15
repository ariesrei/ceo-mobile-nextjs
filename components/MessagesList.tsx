"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MessagingConversation, MessagingListResponse } from "@/lib/messaging";
import { Card } from "./ui/Card";

export function MessagesList() {
  const [items, setItems] = useState<MessagingConversation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading messages…</p>;
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-[var(--danger)]">{error}</p>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">
          No conversations yet.
        </p>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const preview = item.last_message?.body || "No messages yet.";
        const unread = Number(item.unread_count || 0);
        return (
          <li key={item.id}>
            <Link
              href={`/account/messaging/${item.id}`}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-[var(--ink)]">
                  {item.title || "Conversation"}
                </span>
                <span className="mt-1 block truncate text-sm text-[var(--muted)]">
                  {preview}
                </span>
              </span>
              {unread > 0 ? (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--accent)] px-2 text-xs font-bold text-[#081014]">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
