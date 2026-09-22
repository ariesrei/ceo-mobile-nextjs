"use client";

import { useEffect, useMemo, useState } from "react";
import { FastLink } from "./FastLink";
import {
  listClassifieds,
  timeAgo,
  type ClassifiedItem,
} from "@/lib/helpers/classifieds";
import { ListGo, ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

const TABS = [
  { id: "all", label: "All" },
  { id: "for_sale", label: "For sale" },
  { id: "wanted", label: "Wanted" },
  { id: "free", label: "Free" },
] as const;

export function ClassifiedsBoard() {
  const [items, setItems] = useState<ClassifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  useEffect(() => {
    listClassifieds(40)
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchTab = tab === "all" || item.category === tab;
      const matchQ =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q) ||
        item.price.toLowerCase().includes(q);
      return matchTab && matchQ;
    });
  }, [items, query, tab]);

  return (
    <div className="ceo-class">
      <label className="ceo-amenity__search">
        <span className="sr-only">Search classifieds</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search classifieds"
        />
      </label>

      <div className="ceo-news-tabs" role="tablist" aria-label="Listing type">
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
          emptyIcon={query || tab !== "all" ? "search" : "tag"}
          emptyMessage={query || tab !== "all" ? "No matching listings" : "No listings yet"}
          emptySubtitle={
            query || tab !== "all"
              ? "Try another search or category."
              : "Be the first to post something for the community."
          }
          getKey={(item) => item.id}
          renderItem={(item) => (
            <FastLink
              href={`/account/classifieds/${item.id}`}
              className="ceo-news-row"
            >
              <span className="ceo-news-row__photo">
                {item.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo} alt="" />
                ) : (
                  <span aria-hidden>
                    {(item.title[0] || "C").toUpperCase()}
                  </span>
                )}
              </span>
              <span className="ceo-news-row__body">
                <b>{item.title}</b>
                {item.price ? <strong className="ceo-class-price">{item.price}</strong> : null}
                <small>{timeAgo(item.date)}</small>
              </span>
              <ListGo icon="tag" />
            </FastLink>
          )}
        />
      )}

      <FastLink href="/account/classifieds/new" className="ceo-class-fab">
        <span aria-hidden>+</span>
        Post
      </FastLink>
    </div>
  );
}
