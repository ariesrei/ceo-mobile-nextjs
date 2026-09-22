"use client";

import { useEffect, useState } from "react";
import {
  listClassifieds,
  timeAgo,
  type ClassifiedItem,
} from "@/lib/helpers/classifieds";
import { EmptyState, ListSkeleton } from "./ui/ListState";

export function ClassifiedDetail({ classifiedId }: { classifiedId: number }) {
  const [item, setItem] = useState<ClassifiedItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classifiedId) {
      setLoading(false);
      return;
    }
    listClassifieds(40)
      .then((data) => {
        if (data.ok) {
          setItem(data.items.find((row) => row.id === classifiedId) || null);
        }
      })
      .finally(() => setLoading(false));
  }, [classifiedId]);

  if (loading) return <ListSkeleton rows={2} height={88} />;
  if (!item) {
    return (
      <EmptyState icon="tag" subtitle="It may have been removed or the link is old.">
        Listing not found
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
      {item.price ? <p className="ceo-class-price">{item.price}</p> : null}
      <p>{timeAgo(item.date)}</p>
      {item.description ? (
        <p className="ceo-events-detail__excerpt">{item.description}</p>
      ) : null}
    </article>
  );
}
