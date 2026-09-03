"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 5;

function useResponsivePageSize(phoneSize: number) {
  const [size, setSize] = useState(phoneSize);

  useEffect(() => {
    const tablet = window.matchMedia("(min-width: 768px)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      if (wide.matches) setSize(Math.max(phoneSize, 10));
      else if (tablet.matches) setSize(Math.max(phoneSize, 8));
      else setSize(phoneSize);
    };
    apply();
    tablet.addEventListener("change", apply);
    wide.addEventListener("change", apply);
    return () => {
      tablet.removeEventListener("change", apply);
      wide.removeEventListener("change", apply);
    };
  }, [phoneSize]);

  return size;
}

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
  listClassName = "ceo-list",
}: Props<T>) {
  const [page, setPage] = useState(1);
  const resolvedPageSize = useResponsivePageSize(pageSize);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / resolvedPageSize));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * resolvedPageSize;
    return items.slice(start, start + resolvedPageSize);
  }, [items, currentPage, resolvedPageSize]);

  if (total === 0) {
    return <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>;
  }

  const from = (currentPage - 1) * resolvedPageSize + 1;
  const to = Math.min(currentPage * resolvedPageSize, total);

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
          <span className="ml-1 opacity-70">({resolvedPageSize}/page)</span>
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
