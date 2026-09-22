"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { loadWarrantyOptions } from "@/lib/helpers/warranties";
import { ListSkeleton } from "./ui/ListState";

export function WarrantyStaffGate({
  children,
  fallbackHref,
  confirmed = false,
}: {
  children: ReactNode;
  fallbackHref: string;
  confirmed?: boolean;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(confirmed);

  useEffect(() => {
    if (confirmed) return;
    let cancelled = false;
    loadWarrantyOptions().then((data) => {
      if (cancelled) return;
      if (data?.is_staff) {
        setOk(true);
        return;
      }
      router.replace(fallbackHref);
    });
    return () => {
      cancelled = true;
    };
  }, [confirmed, fallbackHref, router]);

  if (!ok) return <ListSkeleton rows={3} />;
  return children;
}
