"use client";

import { useEffect, useMemo, useState } from "react";
import { FastLink } from "./FastLink";
import { listUpcomingEvents, type CommunityEvent } from "@/lib/helpers/events";
import { ListGo, ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

function parseWpDate(value: string): Date | null {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function eventDateParts(start: string): { month: string; day: string } {
  const parsed = parseWpDate(start);
  if (!parsed) return { month: "", day: "" };
  return {
    month: parsed.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(parsed.getDate()).padStart(2, "0"),
  };
}

function eventWhen(start: string): string {
  const from = parseWpDate(start);
  if (!from) return start;
  const day = from.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const time = from.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} • ${time}`;
}

function eventSub(item: CommunityEvent): string {
  return item.venue || item.excerpt || "";
}

function EventThumb({ item }: { item: CommunityEvent }) {
  const date = eventDateParts(item.start);
  const [broken, setBroken] = useState(false);
  if (item.photo && !broken) {
    return (
      <span className="ceo-events-row__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.photo} alt="" onError={() => setBroken(true)} />
      </span>
    );
  }
  return (
    <span className="ceo-events-row__date">
      <small>{date.month}</small>
      <strong>{date.day || "—"}</strong>
    </span>
  );
}

function EventRows({
  items,
  compact = false,
}: {
  items: CommunityEvent[];
  compact?: boolean;
}) {
  return (
    <PaginatedList
      items={items}
      listClassName="ceo-events-list"
      emptyIcon="calendar"
      emptyCompact={compact}
      emptyMessage={compact ? "No events this day" : "No upcoming events"}
      emptySubtitle={
        compact
          ? "Nothing on this day."
          : "New events will appear on this calendar."
      }
      getKey={(item) => item.id}
      renderItem={(item) => {
        const sub = eventSub(item);
        return (
          <FastLink href={`/account/events/${item.id}`} className="ceo-events-row">
            <EventThumb item={item} />
            <span className="ceo-events-row__body">
              <b>{item.title}</b>
              <em>{eventWhen(item.start)}</em>
              {sub ? <small>{sub}</small> : null}
            </span>
            <ListGo icon="calendar" />
          </FastLink>
        );
      }}
    />
  );
}

function MonthCalendar({
  month,
  eventDays,
  selected,
  onSelect,
  onMonth,
}: {
  month: Date;
  eventDays: Set<string>;
  selected: string;
  onSelect: (key: string) => void;
  onMonth: (next: Date) => void;
}) {
  const year = month.getFullYear();
  const mo = month.getMonth();
  const first = new Date(year, mo, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: startPad }, () => 0),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const label = month.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="ceo-events-cal">
      <div className="ceo-events-cal__head">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onMonth(new Date(year, mo - 1, 1))}
        >
          ‹
        </button>
        <p>{label}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => onMonth(new Date(year, mo + 1, 1))}
        >
          ›
        </button>
      </div>
      <div className="ceo-events-cal__week">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="ceo-events-cal__grid">
        {cells.map((day, i) => {
          if (!day) return <span key={`pad-${i}`} />;
          const key = dateKey(new Date(year, mo, day));
          const has = eventDays.has(key);
          return (
            <button
              key={key}
              type="button"
              className={`${has ? "has-event" : ""}${selected === key ? " is-on" : ""}`}
              onClick={() => onSelect(key)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EventsBoard() {
  const [items, setItems] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [tab, setTab] = useState<"upcoming" | "calendar">("upcoming");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState("");

  useEffect(() => {
    listUpcomingEvents(40)
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const eventDays = useMemo(() => {
    const keys = new Set<string>();
    for (const item of items) {
      const parsed = parseWpDate(item.start);
      if (parsed) keys.add(dateKey(parsed));
    }
    return keys;
  }, [items]);

  const calendarItems = useMemo(() => {
    if (!selectedDay) return items;
    return items.filter((item) => {
      const parsed = parseWpDate(item.start);
      return parsed ? dateKey(parsed) === selectedDay : false;
    });
  }, [items, selectedDay]);

  return (
    <div className="ceo-events">
      <div className="ceo-events-tabs" role="tablist" aria-label="Events view">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upcoming"}
          className={tab === "upcoming" ? "is-active" : ""}
          onClick={() => setTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "calendar"}
          className={tab === "calendar" ? "is-active" : ""}
          onClick={() => setTab("calendar")}
        >
          Calendar
        </button>
      </div>

      {pending ? (
        <ListSkeleton rows={5} height={76} />
      ) : tab === "upcoming" ? (
        <EventRows items={items} />
      ) : (
        <>
          <MonthCalendar
            month={month}
            eventDays={eventDays}
            selected={selectedDay}
            onSelect={setSelectedDay}
            onMonth={(next) => {
              setMonth(next);
              setSelectedDay("");
            }}
          />
          <EventRows items={calendarItems} compact />
        </>
      )}
    </div>
  );
}
