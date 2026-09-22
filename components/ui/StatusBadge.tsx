export function statusTone(
  label?: string
): "progress" | "warn" | "done" | "info" | "danger" {
  const s = (label || "").toLowerCase();
  /* Matched on "denied"/"deny" rather than "den", which also appears inside
     "resident". */
  if (s.includes("denied") || s.includes("deny") || s.includes("reject")) {
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
}: {
  label?: string;
  short?: boolean;
}) {
  if (!label) return null;
  return (
    <span className={`ceo-status ceo-status--${statusTone(label)}`}>
      {short ? shortStatusLabel(label) : label}
    </span>
  );
}
