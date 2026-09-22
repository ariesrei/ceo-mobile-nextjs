"use client";

import { useEffect, useState, type ComponentType } from "react";
import { publicWpErrorMessage } from "@/lib/wp-error";
import { Card } from "./ui/Card";
import { ListSkeleton } from "./ui/ListState";
import { useHeldLoading } from "./ui/useLoadMore";

export function ClientWpRecord<
  T,
  E extends Record<string, unknown> = Record<string, never>,
>({
  path,
  initial,
  error,
  as: View,
  extra,
}: {
  path: string;
  initial?: T | null;
  error?: string;
  as: ComponentType<{ data: T } & E>;
  extra?: E;
}) {
  const [data, setData] = useState<T | null>(initial ?? null);
  const [err, setErr] = useState(initial ? "" : error || "");
  const [loading, setLoading] = useState(!initial);
  const pending = useHeldLoading(loading);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    const url = `/api/wp${path.startsWith("/") ? path : `/${path}`}`;
    fetch(url)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            publicWpErrorMessage(
              (json as { message?: string }).message ||
                (json as { error?: string }).error ||
                "",
              `Request failed (${res.status})`
            )
          );
        }
        return json as T;
      })
      .then((next) => {
        if (!cancelled) {
          setData(next);
          setErr("");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Could not load.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, initial]);

  if (pending) {
    return <ListSkeleton rows={3} height={88} />;
  }
  if (data) {
    const props = { data, ...(extra ?? ({} as E)) } as { data: T } & E;
    return <View {...props} />;
  }
  return (
    <Card>
      <p className="text-sm text-[var(--danger)]">{err || "Unavailable."}</p>
    </Card>
  );
}
