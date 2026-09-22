"use client";

import { useEffect, useState } from "react";
import { listUpcomingEvents, type CommunityEvent } from "@/lib/helpers/events";
import { EmptyState, ListSkeleton } from "./ui/ListState";

function parseWpDate(value: string): Date | null {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWhen(start: string, end: string): string {
  const from = parseWpDate(start);
  if (!from) return start;
  const day = from.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = from.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const until = parseWpDate(end);
  if (until && until.getTime() !== from.getTime()) {
    const endTime = until.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${day} • ${time} – ${endTime}`;
  }
  return `${day} • ${time}`;
}

export function EventDetail({ eventId }: { eventId: number }) {
  const [item, setItem] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    listUpcomingEvents(40)
      .then((data) => {
        if (data.ok) {
          setItem(data.items.find((row) => row.id === eventId) || null);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <ListSkeleton rows={2} height={88} />;
  if (!item) {
    return (
      <EmptyState icon="calendar" subtitle="It may have been removed or the link is old.">
        Event not found
      </EmptyState>
    );
  }

  return (
    <article className="ceo-events-detail">
      {item.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photo} alt="" className="ceo-events-detail__photo" />
      ) : null}
      <h2>{item.title}</h2>
      <p>{formatWhen(item.start, item.end)}</p>
      {item.venue ? <p>{item.venue}</p> : null}
      {item.excerpt ? <p className="ceo-events-detail__excerpt">{item.excerpt}</p> : null}
    </article>
  );
}
