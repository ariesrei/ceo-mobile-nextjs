import type { CSSProperties } from "react";

function rgbFromCss(color: string): [number, number, number] | null {
  const key = color.trim().toLowerCase();
  if (key === "black") return [0, 0, 0];
  if (key === "white") return [255, 255, 255];
  const hex = key.replace(/^#/, "");
  if (hex.length === 3 && /^[0-9a-f]+$/.test(hex)) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ];
  }
  if (hex.length === 6 && /^[0-9a-f]+$/.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  const rgb = key.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

/** Desktop Closed is often black — invisible on the dark app. */
function usableStatusColor(color?: string): string | undefined {
  if (!color?.trim()) return undefined;
  const rgb = rgbFromCss(color);
  if (!rgb) return color;
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  if (luminance < 0.4) return undefined;
  return color;
}

export function statusTone(
  label?: string
): "progress" | "warn" | "done" | "info" | "danger" {
  const s = (label || "").toLowerCase();
  /* Matched on "denied"/"deny" rather than "den", which also appears inside
     "resident". */
  if (
    s.includes("denied") ||
    s.includes("deny") ||
    s.includes("reject") ||
    s.includes("expired")
  ) {
    return "danger";
  }
  if (
    s.includes("complete") ||
    s.includes("closed") ||
    s.includes("claimed") ||
    s.includes("checked out") ||
    s.includes("done")
  ) {
    return "done";
  }
  if (s.includes("progress") || s.includes("assign")) {
    return "warn";
  }
  if (
    s.includes("schedul") ||
    s.includes("pending") ||
    s.includes("open") ||
    s.includes("storage") ||
    s.includes("checked in") ||
    s.includes("new") ||
    s.includes("approved")
  ) {
    return "progress";
  }
  return "info";
}

/**
 * Condenses the workflow names WordPress stores ("New Warranty Approved",
 * "WARRANTY DENIED") to the short badge wording the design uses, so a long
 * all-caps label does not crowd out a claim card.
 */
export function shortStatusLabel(label?: string): string {
  const raw = (label || "").trim();
  const s = raw.toLowerCase();
  if (!raw) return "";
  if (s.includes("progress")) return "In Progress";
  if (s.includes("await") || s.includes("assign")) return "Awaiting";
  if (s.includes("hold")) return "On Hold";
  if (s.includes("denied") || s.includes("deny")) return "Denied";
  if (s.includes("complete")) return "Completed";
  if (s.includes("closed")) return "Closed";
  if (s.includes("new")) return "New";
  if (s.includes("approved")) return "Approved";
  if (s.includes("cancel")) return "Cancelled";
  return raw;
}

export function StatusBadge({
  label,
  /** Opt-in so Parcels and Maintenance keep their full workflow names. */
  short = false,
  color,
}: {
  label?: string;
  short?: boolean;
  /** Intra status color. When set, skip the mapped tone. */
  color?: string;
}) {
  if (!label) return null;
  const safeColor = usableStatusColor(color);
  const intra = Boolean(safeColor && !short);
  const className = [
    "ceo-status",
    intra ? "ceo-status--intra" : `ceo-status--${statusTone(label)}`,
    short ? "" : "ceo-status--full",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={className}
      style={
        intra
          ? ({ ["--status-color"]: safeColor } as CSSProperties)
          : undefined
      }
    >
      {short ? shortStatusLabel(label) : label}
    </span>
  );
}
