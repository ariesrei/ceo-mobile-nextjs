"use client";

import { useEffect, useState } from "react";
import {
  listAnnouncements,
  type CommunityAnnouncement,
} from "@/lib/helpers/events";
import { FastLink } from "./FastLink";
import { CalendarIcon } from "./ui/Icons";
import { EmptyState, ListGo, SkelLine, SkelThumb } from "./ui/ListState";

const CATEGORY_LABEL: Record<string, string> = {
  general: "General",
  updates: "Updates",
  safety: "Safety",
};

function announcementWhen(date: string): string {
  const parsed = new Date(date.includes("T") ? date : date.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] || "General";
}

function bodyParagraphs(text: string): string[] {
  const chunks = text
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  return chunks.length ? chunks : [];
}

function StorySkeleton() {
  return (
    <div className="ceo-story" role="status" aria-label="Loading">
      <div className="ceo-story__hero">
        <span className="ceo-skel ceo-story__hero-skel" />
      </div>
      <section className="ceo-story__card ceo-story__card--skel">
        <b>
          <SkelLine width="82%" />
          <SkelLine width="48%" />
        </b>
        <span className="ceo-story__meta">
          <SkelLine width="9.5rem" />
        </span>
        <div className="ceo-story__body">
          <SkelLine width="100%" />
          <SkelLine width="94%" />
          <SkelLine width="62%" />
        </div>
      </section>
      <section className="ceo-story__more">
        <h3>More announcements</h3>
        <ul>
          {[0, 1].map((row) => (
            <li key={row}>
              <span className="ceo-story__more-row">
                <SkelThumb size="3.1rem" />
                <span className="ceo-story__more-body">
                  <SkelLine width="72%" />
                  <SkelLine width="46%" />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function AnnouncementDetail({
  announcementId,
  from,
}: {
  announcementId: number;
  from?: string;
}) {
  const [item, setItem] = useState<CommunityAnnouncement | null>(null);
  const [more, setMore] = useState<CommunityAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const fromQs = from === "home" ? "?from=home" : "";

  useEffect(() => {
    if (!announcementId) {
      setLoading(false);
      return;
    }
    listAnnouncements(40)
      .then((data) => {
        if (!data.ok) return;
        const current =
          data.items.find((row) => row.id === announcementId) || null;
        setItem(current);
        const rest = data.items.filter((row) => row.id !== announcementId);
        const same = current
          ? rest.filter((row) => row.category === current.category)
          : [];
        setMore([...same, ...rest.filter((row) => !same.includes(row))].slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, [announcementId]);

  if (loading) return <StorySkeleton />;
  if (!item) {
    return (
      <EmptyState icon="horn" subtitle="It may have been removed or the link is old.">
        Announcement not found
      </EmptyState>
    );
  }

  const paragraphs = bodyParagraphs(item.excerpt);
  const category = item.category || "general";

  return (
    <article className="ceo-story">
      <div className={`ceo-story__hero is-${category}`}>
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo} alt="" />
        ) : (
          <span className="ceo-story__mark" aria-hidden>
            {(item.title[0] || "A").toUpperCase()}
          </span>
        )}
        <span className={`ceo-story__chip is-${category}`}>
          {categoryLabel(category)}
        </span>
      </div>

      <section className="ceo-story__card">
        <h2>{item.title}</h2>
        {item.date ? (
          <p className="ceo-story__meta">
            <CalendarIcon className="ceo-story__meta-icon" />
            <span>{announcementWhen(item.date)}</span>
          </p>
        ) : null}
        {paragraphs.length ? (
          <div className="ceo-story__body">
            {paragraphs.map((part) => (
              <p key={part}>{part}</p>
            ))}
          </div>
        ) : null}
      </section>

      {more.length ? (
        <section className="ceo-story__more">
          <h3>More announcements</h3>
          <ul>
            {more.map((row) => (
              <li key={row.id}>
                <FastLink href={`/account/announcements/${row.id}${fromQs}`}>
                  <span className="ceo-story__thumb">
                    {row.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.photo} alt="" />
                    ) : (
                      <span aria-hidden>{(row.title[0] || "A").toUpperCase()}</span>
                    )}
                  </span>
                  <span className="ceo-story__more-body">
                    <b>{row.title}</b>
                    <small>{announcementWhen(row.date)}</small>
                  </span>
                  <ListGo icon="horn" />
                </FastLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
