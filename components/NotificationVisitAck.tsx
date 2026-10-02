"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  loadStaffNotifications,
  notificationHrefMatchesPath,
  publishStaffNotifications,
  rememberNotificationsRead,
} from "@/lib/helpers/notifications";

function pathCanAck(path: string) {
  return (
    path.startsWith("/account/maintenance") ||
    path.startsWith("/account/entry-pass") ||
    path.startsWith("/account/warranties") ||
    path.startsWith("/account/profile") ||
    path.startsWith("/account/additional-info") ||
    path.startsWith("/account/reservations") ||
    path.startsWith("/account/parcels") ||
    path.startsWith("/account/guests") ||
    path.startsWith("/account/assets")
  );
}

export function NotificationVisitAck() {
  const pathname = usePathname();
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current || !pathCanAck(pathname)) return;
    let cancelled = false;
    loadStaffNotifications(true).then((data) => {
      if (cancelled) return;
      if (!data.available) {
        skip.current = true;
        return;
      }
      let changed = false;
      data.types.forEach((type) => {
        const items = type.items.filter(
          (item) =>
            item.unread && notificationHrefMatchesPath(item.href, pathname)
        );
        if (!items.length) return;
        rememberNotificationsRead(
          data,
          type.id,
          items.map((item) => item.id)
        );
        changed = true;
      });
      if (changed && !cancelled) {
        publishStaffNotifications(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
