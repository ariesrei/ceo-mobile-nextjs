export function statusTone(label?: string): "progress" | "warn" | "done" | "info" {
  const s = (label || "").toLowerCase();
  if (
    s.includes("complete") ||
    s.includes("closed") ||
    s.includes("claimed") ||
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
    s.includes("storage")
  ) {
    return "progress";
  }
  return "info";
}

export function StatusBadge({ label }: { label?: string }) {
  if (!label) return null;
  return <span className={`ceo-status ceo-status--${statusTone(label)}`}>{label}</span>;
}
