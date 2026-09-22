"use client";

import { useEffect, useState } from "react";
import {
  listAnnouncements,
  listUpcomingEvents,
  type CommunityAnnouncement,
  type CommunityEvent,
} from "@/lib/helpers/events";
import { FastLink } from "./FastLink";
import { ListGo, ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

function parseWpDate(value: string): Date | null {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function eventDateParts(start: string): { month: string; day: string } {
  const parsed = parseWpDate(start);
  if (!parsed) return { month: "", day: "" };
  return {
    month: parsed.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(parsed.getDate()).padStart(2, "0"),
  };
}

function eventWhen(start: string, end: string, venue: string): string {
  const from = parseWpDate(start);
  const bits: string[] = [];
  if (from) {
    bits.push(
      from.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    );
  } else if (start) {
    bits.push(start);
  }
  if (venue) bits.push(venue);
  return bits.join(" · ");
}

function announcementWhen(date: string): string {
  const parsed = parseWpDate(date);
  if (!parsed) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CommunityEventsList() {
  const [items, setItems] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);

  useEffect(() => {
    listUpcomingEvents(20)
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  if (pending) return <ListSkeleton rows={4} height={72} />;

  return (
    <section className="ceo-ops-panel">
      <PaginatedList
        items={items}
        listClassName="ceo-ops-events"
        emptyIcon="calendar"
        emptyMessage="No upcoming events"
        emptySubtitle="New events will appear here."
        getKey={(item) => item.id}
        renderItem={(item) => {
          const date = eventDateParts(item.start);
          return (
            <FastLink href={`/account/events/${item.id}`}>
              {item.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photo} alt="" className="ceo-ops-events__photo" />
              ) : (
                <span className="ceo-ops-events__date">
                  {date.month ? <small>{date.month}</small> : null}
                  <strong>{date.day || "—"}</strong>
                </span>
              )}
              <span className="ceo-ops-events__body">
                <b>{item.title}</b>
                <em>{eventWhen(item.start, item.end, item.venue)}</em>
              </span>
              <ListGo icon="calendar" />
            </FastLink>
          );
        }}
      />
    </section>
  );
}

export function CommunityAnnouncementsList() {
  const [items, setItems] = useState<CommunityAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);

  useEffect(() => {
    listAnnouncements(20)
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  if (pending) return <ListSkeleton rows={4} height={72} />;

  return (
    <section className="ceo-ops-panel">
      <PaginatedList
        items={items}
        listClassName="ceo-ops-news"
        emptyIcon="horn"
        emptyMessage="No announcements yet"
        emptySubtitle="Community posts will show up here."
        getKey={(item) => item.id}
        renderItem={(item) => (
          <FastLink href={`/account/announcements/${item.id}`}>
            {item.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photo} alt="" />
            ) : (
              <span className="ceo-ops-news__mark" aria-hidden>
                {(item.title[0] || "A").toUpperCase()}
              </span>
            )}
            <span className="ceo-ops-news__body">
              <b>{item.title}</b>
              {item.excerpt ? <em>{item.excerpt}</em> : null}
              <small>{announcementWhen(item.date)}</small>
            </span>
            <ListGo icon="horn" />
          </FastLink>
        )}
      />
    </section>
  );
}
