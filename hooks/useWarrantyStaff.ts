"use client";

import { useEffect, useState } from "react";
import { readStoredNavRole, writeStoredNavRole } from "@/lib/browser-session";
import { loadWarrantyOptions } from "@/lib/helpers/warranties";

/** Browser confirms staff via WP. SSR nav is often WAF-blocked on Vercel. */
export function useWarrantyStaff(initial = false) {
  const [staff, setStaff] = useState(() => {
    if (initial) return true;
    return readStoredNavRole() === "staff";
  });

  useEffect(() => {
    let cancelled = false;
    loadWarrantyOptions().then((data) => {
      if (cancelled || !data) return;
      const next = Boolean(data.is_staff);
      setStaff(next);
      writeStoredNavRole(next ? "staff" : "resident");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return staff;
}
