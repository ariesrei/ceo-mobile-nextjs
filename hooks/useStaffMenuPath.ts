"use client";

import { useEffect, useState } from "react";
import {
  applyNavVisibility,
  menuHasStaffPath,
  navHasStaffRole,
} from "@/lib/navigation";
import type { NavigationResponse } from "@/lib/types";

/** Browser nav. SSR is often WAF-blocked so staff looks like a resident. */
export function useStaffMenuPath(path: string, initial = false) {
  const [staff, setStaff] = useState(initial);
  const [ready, setReady] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wp/navigation")
      .then((res) => res.json())
      .then((data: NavigationResponse) => {
        if (cancelled) return;
        if (!data.upstream_blocked) {
          const menus = applyNavVisibility(data)?.menus || data.menus || [];
          setStaff(menuHasStaffPath(menus, path) || navHasStaffRole(data));
        }
        setReady(true);
      })
      .catch(() => {
        // Failed nav is unknown — do not treat the user as a resident.
        if (!cancelled) setReady(initial);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { staff, ready };
}
