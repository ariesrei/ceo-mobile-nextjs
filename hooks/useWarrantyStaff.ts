"use client";

import { useEffect, useState } from "react";
import { loadWarrantyOptions } from "@/lib/helpers/warranties";

/** Browser confirms staff via WP. SSR nav is often WAF-blocked on Vercel. */
export function useWarrantyStaff(initial = false) {
  const [staff, setStaff] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    loadWarrantyOptions().then((data) => {
      if (cancelled || !data) return;
      setStaff(Boolean(data.is_staff));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return staff;
}
