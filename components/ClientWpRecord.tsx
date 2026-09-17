"use client";

import { useEffect, useState, type ReactNode } from "react";
import { publicWpErrorMessage } from "@/lib/wp-error";
import { Card } from "./ui/Card";

export function ClientWpRecord<T>({
  path,
  initial,
  error,
  children,
}: {
  path: string;
  initial?: T | null;
  error?: string;
  children: (data: T) => ReactNode;
}) {
  const [data, setData] = useState<T | null>(initial ?? null);
  const [err, setErr] = useState(initial ? "" : error || "");
  const [loading, setLoading] = useState(!initial);

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

  if (data) return <>{children(data)}</>;
  if (loading) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </Card>
    );
  }
  return (
    <Card>
      <p className="text-sm text-[var(--danger)]">{err || "Unavailable."}</p>
    </Card>
  );
}
