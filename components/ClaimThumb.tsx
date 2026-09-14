"use client";

import { useEffect, useState } from "react";
import { UserIcon } from "./ui/Icons";

function initialsFrom(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  return letters.join("");
}

export function claimContactName(record: {
  warranty_first_name?: string;
  warranty_last_name?: string;
  resident_name?: string;
}) {
  return (
    [record.warranty_first_name, record.warranty_last_name]
      .filter(Boolean)
      .join(" ") ||
    record.resident_name ||
    ""
  );
}

type Props = {
  src?: string;
  name?: string;
  size?: "card" | "head";
};

/**
 * Claim rows always keep this slot, even with no photo, so the text column
 * does not jump left and the card height stays even.
 */
export function ClaimThumb({ src = "", name = "", size = "card" }: Props) {
  const [failed, setFailed] = useState(false);
  const className =
    size === "head" ? "ceo-claim-head__thumb" : "ceo-claim-card__thumb";
  const showImg = Boolean(src) && !failed;
  const initials = initialsFrom(name);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`${className} ${className}--empty`} aria-hidden>
      {initials ? (
        initials
      ) : (
        <UserIcon className={size === "head" ? "h-6 w-6" : "h-5 w-5"} />
      )}
    </span>
  );
}
