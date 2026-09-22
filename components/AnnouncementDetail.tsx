"use client";

import { useEffect, useState } from "react";
import {
  listAnnouncements,
  type CommunityAnnouncement,
} from "@/lib/helpers/events";
import { EmptyState, ListSkeleton } from "./ui/ListState";

function announcementWhen(date: string): string {
  const parsed = new Date(date.includes("T") ? date : date.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AnnouncementDetail({ announcementId }: { announcementId: number }) {
  const [item, setItem] = useState<CommunityAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!announcementId) {
      setLoading(false);
      return;
    }
    listAnnouncements(40)
      .then((data) => {
        if (data.ok) {
          setItem(data.items.find((row) => row.id === announcementId) || null);
        }
      })
      .finally(() => setLoading(false));
  }, [announcementId]);

  if (loading) return <ListSkeleton rows={2} height={88} />;
  if (!item) {
    return (
      <EmptyState icon="horn" subtitle="It may have been removed or the link is old.">
        Announcement not found
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
      <p>{announcementWhen(item.date)}</p>
      {item.excerpt ? <p className="ceo-events-detail__excerpt">{item.excerpt}</p> : null}
    </article>
  );
}
