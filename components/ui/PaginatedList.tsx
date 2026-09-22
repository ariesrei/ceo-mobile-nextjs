"use client";

import { ReactNode } from "react";
import { EmptyState, LoadingDots, type EmptyIcon } from "./ListState";
import { useLoadMore } from "./useLoadMore";

export const DEFAULT_PAGE_SIZE = 15;

type Props<T> = {
  items: T[];
  pageSize?: number;
  emptyMessage: string;
  emptySubtitle?: string;
  getKey: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  listClassName?: string;
  emptyIcon?: EmptyIcon;
  emptyCompact?: boolean;
};

export function PaginatedList<T>({
  items,
  pageSize = DEFAULT_PAGE_SIZE,
  emptyMessage,
  emptySubtitle,
  getKey,
  renderItem,
  listClassName = "ceo-list",
  emptyIcon,
  emptyCompact,
}: Props<T>) {
  const resetKey = items.map((item) => String(getKey(item))).join("|");
  const { visible, hasMore, loadingMore, sentinelRef } = useLoadMore(
    items.length,
    pageSize,
    resetKey
  );

  if (!items.length) {
    return (
      <EmptyState icon={emptyIcon} subtitle={emptySubtitle} compact={emptyCompact}>
        {emptyMessage}
      </EmptyState>
    );
  }

  return (
    <div>
      <ul className={listClassName}>
        {items.slice(0, visible).map((item) => (
          <li key={getKey(item)}>{renderItem(item)}</li>
        ))}
      </ul>
      {hasMore || loadingMore ? (
        <div
          ref={sentinelRef}
          className="ceo-list-more"
          role="status"
          aria-live="polite"
          aria-label={loadingMore ? "Loading more" : "Scroll for more"}
        >
          {loadingMore ? <LoadingDots /> : null}
        </div>
      ) : null}
    </div>
  );
}
