"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { MessagingMessage, MessagingThreadResponse } from "@/lib/messaging";
import { Card } from "./ui/Card";

export function MessageThread({
  conversationId,
  title,
}: {
  conversationId: number;
  title?: string;
}) {
  const [messages, setMessages] = useState<MessagingMessage[]>([]);
  const [userId, setUserId] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/wp/messaging/conversations/${conversationId}/messages?limit=50`)
      .then(async (r) => {
        const data = (await r.json()) as MessagingThreadResponse & {
          message?: string;
        };
        if (!r.ok) {
          setError(data.message || "Could not load this conversation.");
          setMessages([]);
          return;
        }
        setUserId(Number(data.user_id) || 0);
        setMessages((data.messages || []).slice().reverse());
      })
      .catch(() => {
        setError("Network error.");
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    const el = scroller.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  const heading = useMemo(() => title || "Conversation", [title]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const next = body.trim();
    if (!next || sending) {
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch(
        `/api/wp/messaging/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: next }),
        }
      );
      const data = (await res.json()) as {
        item?: MessagingMessage;
        user_id?: number;
        message?: string;
      };
      if (!res.ok || !data.item) {
        setError(data.message || "Could not send message.");
        return;
      }
      setUserId(Number(data.user_id) || userId);
      setMessages((prev) => [...prev, data.item as MessagingMessage]);
      setBody("");
    } catch {
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading conversation…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">{heading}</p>
      {error ? (
        <Card>
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Card>
      ) : null}
      <div
        ref={scroller}
        className="ceo-msg-thread max-h-[calc(100dvh-18rem)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
      >
        {messages.length ? (
          messages.map((m) => {
            const mine = Number(m.sender_id) === userId;
            return (
              <article
                key={String(m.id)}
                className={`ceo-msg-bubble ${mine ? "is-mine" : "is-theirs"}`}
              >
                <p>{m.deleted ? "This message was deleted." : m.body}</p>
                {m.created_at ? (
                  <time className="ceo-msg-bubble__meta">{m.created_at}</time>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className="px-2 py-6 text-center text-sm text-[var(--muted)]">
            No messages yet. Write a reply below.
          </p>
        )}
      </div>
      <form className="flex gap-2" onSubmit={send}>
        <textarea
          className="min-h-12 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--ink)]"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
        />
        <button
          type="submit"
          className="ceo-btn-accent self-end rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
          disabled={sending || !body.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
