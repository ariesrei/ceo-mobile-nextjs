"use client";

import { ReactNode, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 5;

type Props<T> = {
  items: T[];
  pageSize?: number;
  emptyMessage: string;
  getKey: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  listClassName?: string;
};

export function PaginatedList<T>({
  items,
  pageSize = DEFAULT_PAGE_SIZE,
  emptyMessage,
  getKey,
  renderItem,
  listClassName = "space-y-3",
}: Props<T>) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  if (total === 0) {
    return <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>;
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  return (
    <div className="space-y-3">
      <ul className={listClassName}>
        {pageItems.map((item) => (
          <li key={getKey(item)}>{renderItem(item)}</li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
        <p className="text-xs text-[var(--muted)]">
          {from}–{to} of {total}
          <span className="ml-1 opacity-70">({pageSize}/page)</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <span className="min-w-[4.5rem] text-center text-xs font-medium text-[var(--muted)]">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
