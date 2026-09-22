"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const LIST_LOAD_MS = 3000;

/** First paint: card skeleton while fetching. Do not hold after the request finishes. */
export function useHeldLoading(loading: boolean): boolean {
  return loading;
}

export function useLoadMore(total: number, pageSize: number, resetKey?: string | number) {
  const [visible, setVisible] = useState(() => Math.min(pageSize, Math.max(total, 0)));
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef(0);
  const scrolledRef = useRef(false);

  useEffect(() => {
    window.clearTimeout(timerRef.current);
    setLoadingMore(false);
    setVisible(Math.min(pageSize, Math.max(total, 0)));
    scrolledRef.current = false;
  }, [pageSize, resetKey, total]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    const mark = () => {
      scrolledRef.current = true;
    };
    window.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("touchmove", mark, { passive: true });
    return () => {
      window.removeEventListener("scroll", mark);
      window.removeEventListener("touchmove", mark);
    };
  }, [resetKey]);

  const hasMore = visible < total;

  const loadMore = useCallback(() => {
    if (loadingMore || visible >= total || !scrolledRef.current) return;
    scrolledRef.current = false;
    setLoadingMore(true);
    timerRef.current = window.setTimeout(() => {
      setVisible((count) => Math.min(total, count + pageSize));
      setLoadingMore(false);
    }, LIST_LOAD_MS);
  }, [loadingMore, pageSize, total, visible]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { root: null, rootMargin: "80px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadingMore, visible]);

  return { visible, hasMore, loadingMore, sentinelRef, loadMore };
}
