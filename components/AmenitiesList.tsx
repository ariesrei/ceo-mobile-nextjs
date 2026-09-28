"use client";

import { useEffect, useMemo, useState } from "react";
import { FastLink } from "./FastLink";
import { listAmenities, type AmenityItem } from "@/lib/helpers/amenities";
import { ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

export function AmenityPhoto({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const [srcOverride, setSrcOverride] = useState("");
  const url = srcOverride || src;
  if (!url || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={title}
      onError={() => {
        if (url.startsWith("http://")) {
          setSrcOverride(`https://${url.slice("http://".length)}`);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

export function AmenitiesList() {
  const [items, setItems] = useState<AmenityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listAmenities()
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => !q || item.title.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="ceo-amenity">
      <label className="ceo-amenity__search">
        <span className="sr-only">Search amenities</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search amenities"
        />
      </label>

      {pending ? (
        <ListSkeleton rows={3} height={196} />
      ) : (
        <PaginatedList
          items={visible}
          listClassName="ceo-amenity__list"
          emptyIcon={query.trim() ? "search" : "calendar"}
          emptyMessage={query.trim() ? "No matching amenities" : "No amenities yet"}
          emptySubtitle={
            query.trim()
              ? "Try another search."
              : "Amenities you can reserve will show up here."
          }
          getKey={(item) => item.id}
          renderItem={(item) => (
            <article className="ceo-amenity__card">
              <div className="ceo-amenity__photo">
                <AmenityPhoto src={item.photo} title={item.title} />
              </div>
              <div className="ceo-amenity__body">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.hours}</p>
                </div>
                <FastLink
                  href={`/account/reservations/new?amenity=${item.id}`}
                  className="ceo-amenity__reserve"
                >
                  Reserve
                </FastLink>
              </div>
            </article>
          )}
        />
      )}
    </div>
  );
}
