"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  ackStaffNotifications,
  loadStaffNotifications,
  notificationTypeMatchesPath,
} from "@/lib/helpers/notifications";

function pathCanAck(path: string) {
  return (
    path.startsWith("/account/maintenance") ||
    path.startsWith("/account/entry-pass") ||
    path.startsWith("/account/warranties")
  );
}

export function NotificationVisitAck() {
  const pathname = usePathname();
  const acked = useRef(new Set<string>());
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current || !pathCanAck(pathname)) return;
    let cancelled = false;
    loadStaffNotifications(false).then((data) => {
      if (cancelled) return;
      if (!data.available) {
        skip.current = true;
        return;
      }
      data.types.forEach((type) => {
        if (type.skip_mark_seen || type.count < 1) return;
        if (!notificationTypeMatchesPath(type, pathname)) return;
        if (acked.current.has(type.id)) return;
        acked.current.add(type.id);
        void ackStaffNotifications(type.id);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
