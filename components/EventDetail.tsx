"use client";

import { useEffect, useState } from "react";
import { listUpcomingEvents, type CommunityEvent } from "@/lib/helpers/events";
import {
  StoryMore,
  StoryMoreRow,
  StorySkeleton,
  storyParagraphs,
} from "./CommunityStory";
import { EmptyState } from "./ui/ListState";
import { CalendarIcon, PinIcon } from "./ui/Icons";

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

function eventChip(start: string): string {
  const from = parseWpDate(start);
  if (!from) return "Event";
  return from.toLocaleString("en-US", { month: "short", day: "numeric" });
}

export function EventDetail({
  eventId,
  from,
}: {
  eventId: number;
  from?: string;
}) {
  const [item, setItem] = useState<CommunityEvent | null>(null);
  const [more, setMore] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const fromQs = from === "home" ? "?from=home" : "";

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    listUpcomingEvents(40)
      .then((data) => {
        if (!data.ok) return;
        const current = data.items.find((row) => row.id === eventId) || null;
        setItem(current);
        setMore(data.items.filter((row) => row.id !== eventId).slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <StorySkeleton moreLabel="More events" />;
  if (!item) {
    return (
      <EmptyState icon="calendar" subtitle="It may have been removed or the link is old.">
        Event not found
      </EmptyState>
    );
  }

  const paragraphs = storyParagraphs(item.excerpt);
  const when = formatWhen(item.start, item.end);

  return (
    <article className="ceo-story">
      <div className="ceo-story__hero">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo} alt="" />
        ) : (
          <span className="ceo-story__mark" aria-hidden>
            {(item.title[0] || "E").toUpperCase()}
          </span>
        )}
        <span className="ceo-story__chip">{eventChip(item.start)}</span>
      </div>

      <section className="ceo-story__card">
        <h2>{item.title}</h2>
        <div className="ceo-story__facts">
          {when ? (
            <p className="ceo-story__meta">
              <CalendarIcon className="ceo-story__meta-icon" />
              <span>{when}</span>
            </p>
          ) : null}
          {item.venue ? (
            <p className="ceo-story__meta">
              <PinIcon className="ceo-story__meta-icon" />
              <span>{item.venue}</span>
            </p>
          ) : null}
        </div>
        {paragraphs.length ? (
          <div className="ceo-story__body">
            {paragraphs.map((part) => (
              <p key={part}>{part}</p>
            ))}
          </div>
        ) : null}
      </section>

      {more.length ? (
        <StoryMore title="More events">
          {more.map((row) => (
            <StoryMoreRow
              key={row.id}
              href={`/account/events/${row.id}${fromQs}`}
              photo={row.photo}
              title={row.title}
              meta={[formatWhen(row.start, row.end), row.venue]
                .filter(Boolean)
                .join(" · ")}
              icon="calendar"
            />
          ))}
        </StoryMore>
      ) : null}
    </article>
  );
}
