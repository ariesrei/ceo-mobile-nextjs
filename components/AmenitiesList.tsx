"use client";

import { useEffect, useMemo, useState } from "react";
import { FastLink } from "./FastLink";
import { listAmenities, type AmenityItem, type AmenitySpace } from "@/lib/helpers/amenities";
import { ListSkeleton } from "./ui/ListState";
import { PaginatedList } from "./ui/PaginatedList";
import { useHeldLoading } from "./ui/useLoadMore";

const FILTERS: { id: AmenitySpace | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "indoor", label: "Indoor" },
  { id: "outdoor", label: "Outdoor" },
  { id: "spaces", label: "Spaces" },
];

export function AmenitiesList() {
  const [items, setItems] = useState<AmenityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pending = useHeldLoading(loading);
  const [query, setQuery] = useState("");
  const [space, setSpace] = useState<AmenitySpace | "all">("all");

  useEffect(() => {
    listAmenities()
      .then((data) => {
        if (data.ok) setItems(data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchSpace = space === "all" || item.space === space;
      const matchQ = !q || item.title.toLowerCase().includes(q);
      return matchSpace && matchQ;
    });
  }, [items, query, space]);

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

      <div className="ceo-amenity__tabs" role="tablist" aria-label="Space type">
        {FILTERS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={space === tab.id}
            className={space === tab.id ? "is-active" : ""}
            onClick={() => setSpace(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {pending ? (
        <ListSkeleton rows={3} height={196} />
      ) : (
        <PaginatedList
          items={visible}
          listClassName="ceo-amenity__list"
          emptyIcon={query.trim() || space !== "all" ? "search" : "calendar"}
          emptyMessage={
            query.trim() || space !== "all"
              ? "No matching amenities"
              : "No amenities yet"
          }
          emptySubtitle={
            query.trim() || space !== "all"
              ? "Try another search or space type."
              : "Amenities you can reserve will show up here."
          }
          getKey={(item) => item.id}
          renderItem={(item) => (
            <article className="ceo-amenity__card">
              <div className="ceo-amenity__photo">
                {item.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo} alt="" />
                ) : null}
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
