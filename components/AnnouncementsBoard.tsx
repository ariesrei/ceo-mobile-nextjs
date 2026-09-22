"use client";

import { useEffect, useMemo, useState } from "react";
import { FastLink } from "./FastLink";
import {
  listAnnouncements,
  type CommunityAnnouncement,
} from "@/lib/helpers/events";
import { ListGo, ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

const TABS = [
  { id: "all", label: "All" },
  { id: "general", label: "General" },
  { id: "updates", label: "Updates" },
  { id: "safety", label: "Safety" },
] as const;

function announcementWhen(date: string): string {
  const parsed = new Date(date.includes("T") ? date : date.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AnnouncementsBoard() {
  const [items, setItems] = useState<CommunityAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  useEffect(() => {
    listAnnouncements(40)
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((item) => item.category === tab);
  }, [items, tab]);

  return (
    <div className="ceo-news">
      <div className="ceo-news-tabs" role="tablist" aria-label="Announcement type">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {pending ? (
        <ListSkeleton rows={4} height={88} />
      ) : (
        <PaginatedList
          items={visible}
          listClassName="ceo-news-list"
          emptyIcon="horn"
          emptyMessage={tab === "all" ? "No announcements yet" : "Nothing in this category"}
          emptySubtitle={
            tab === "all"
              ? "Community posts will show up here."
              : "Nothing in this category right now."
          }
          getKey={(item) => item.id}
          renderItem={(item) => (
            <FastLink
              href={`/account/announcements/${item.id}`}
              className="ceo-news-row"
            >
              <span className="ceo-news-row__photo">
                {item.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo} alt="" />
                ) : (
                  <span aria-hidden>
                    {(item.title[0] || "A").toUpperCase()}
                  </span>
                )}
              </span>
              <span className="ceo-news-row__body">
                <b>{item.title}</b>
                {item.excerpt ? <em>{item.excerpt}</em> : null}
                <small>{announcementWhen(item.date)}</small>
              </span>
              <ListGo icon="horn" />
            </FastLink>
          )}
        />
      )}
    </div>
  );
}
