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

function present(value?: string) {
  const text = (value || "").trim();
  return text && text !== "—" ? text : "";
}

function usableImageUrl(url?: string) {
  const text = (url || "").trim();
  if (!text || /default-user\.jpg/i.test(text)) {
    return "";
  }
  return text;
}

/** Claim attachment first, then the contact avatar. Empty when neither exists. */
export function claimThumbSrc(record: {
  photos?: { url?: string }[];
  avatar?: string;
}) {
  return (
    usableImageUrl(record.photos?.[0]?.url) || usableImageUrl(record.avatar)
  );
}

function formatUnitLine(unit: string) {
  if (!unit) return "";
  return /^unit\b/i.test(unit) ? unit : `Unit ${unit}`;
}

function tradeLine(
  trade?: string[] | string
) {
  if (Array.isArray(trade)) {
    return present(trade.filter(Boolean).join(", "));
  }
  return present(typeof trade === "string" ? trade : "");
}

/** Extra card lines from the mockup — omitted when empty so no dash rows. */
export function claimMetaLines(
  record: {
    unit_title?: string;
    warranty_first_name?: string;
    warranty_last_name?: string;
    resident_name?: string;
    created_date?: string;
    type_label?: string;
    warranty_tel_number?: string;
    trade_labels?: string[] | string;
    warranty_sources_trade?: string[] | string | number[];
    subcontractor_name?: string;
    warranty_sources_target_due?: string;
  },
  title = ""
) {
  const unit = formatUnitLine(present(record.unit_title));
  const name = present(claimContactName(record));
  const date = present(record.created_date);
  const type = present(record.type_label);
  const typeOk = type && type !== title && !/^units?$/i.test(type);
  const phone = present(record.warranty_tel_number);
  const trade = tradeLine(record.trade_labels) || tradeLine(
    typeof record.warranty_sources_trade === "string"
      ? record.warranty_sources_trade
      : Array.isArray(record.warranty_sources_trade)
        ? record.warranty_sources_trade.map(String)
        : ""
  );
  const vendor = present(record.subcontractor_name);
  const due = present(record.warranty_sources_target_due);
  return [
    unit && unit !== title ? unit : "",
    name,
    date,
    typeOk ? type : "",
    phone,
    trade && trade !== type ? trade : "",
    vendor,
    due && due !== date ? `Due ${due}` : "",
  ].filter(Boolean);
}

type Props = {
  src?: string;
  name?: string;
  size?: "card" | "head" | "contact";
};

/**
 * Claim rows always keep this slot, even with no photo, so the text column
 * does not jump left and the card height stays even.
 */
export function ClaimThumb({ src = "", name = "", size = "card" }: Props) {
  const [failed, setFailed] = useState(false);
  const className =
    size === "head"
      ? "ceo-claim-head__thumb"
      : size === "contact"
        ? "ceo-contact-card__avatar"
        : "ceo-claim-card__thumb";
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
