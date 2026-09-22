"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStaffMenuPath } from "@/hooks/useStaffMenuPath";
import { ListSkeleton } from "./ui/ListState";

export function StaffPathGate({
  path,
  children,
  fallbackHref,
  confirmed = false,
}: {
  path: string;
  children: ReactNode;
  fallbackHref: string;
  confirmed?: boolean;
}) {
  const router = useRouter();
  const { staff, ready } = useStaffMenuPath(path, confirmed);

  useEffect(() => {
    if (confirmed || !ready) return;
    if (!staff) router.replace(fallbackHref);
  }, [confirmed, ready, staff, fallbackHref, router]);

  if (confirmed || (ready && staff)) return children;
  return <ListSkeleton rows={3} />;
}
