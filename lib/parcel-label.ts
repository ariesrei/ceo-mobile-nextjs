export type ParsedParcelLabel = {
  name: string;
  unit: string;
  tracking: string;
  carrier: string;
};

const CARRIERS = ["DHL", "UPS", "USPS", "FEDEX", "AMAZON"] as const;

export function parseParcelLabel(text: string): ParsedParcelLabel {
  const compact = text.replace(/\r/g, "");
  return {
    name: extractName(compact),
    unit: extractUnit(compact),
    tracking: extractTracking(compact),
    carrier: extractCarrier(compact),
  };
}

/** Labeled lines first so PHP can match ship-to / unit / tracking. */
export function formatLookupText(raw: string, parsed: ParsedParcelLabel): string {
  const lines = [
    parsed.name ? `SHIP TO: ${parsed.name}` : "",
    parsed.unit ? `Unit #${parsed.unit}` : "",
    parsed.tracking ? `TRACKING NUMBER ${parsed.tracking}` : "",
    parsed.carrier,
    raw.trim(),
  ].filter(Boolean);
  return lines.join("\n");
}

function extractName(text: string): string {
  const shipTo = text.match(
    /\b(?:ship\s*to|deliver(?:ed)?\s*to|recipient|attn|attention)\b[:\s]+([A-Za-z][A-Za-z.'\-]+(?:\s+[A-Za-z][A-Za-z.'\-]+){1,3})/i
  );
  if (shipTo?.[1]) {
    return cleanName(shipTo[1]);
  }

  for (const line of text.split(/\n+/)) {
    const trimmed = line.replace(/[,:]+$/g, "").trim();
    if (looksLikeName(trimmed)) {
      return cleanName(trimmed);
    }
  }
  return "";
}

function extractUnit(text: string): string {
  const match = text.match(
    /\b(?:unit|apt|suite|ste|#)\s*[#:]?\s*([A-Za-z0-9\-]{1,12})\b/i
  );
  return match?.[1] ? match[1].toUpperCase() : "";
}

export function extractTracking(text: string): string {
  const labeled = text.match(
    /\b(?:tracking(?:\s*number)?|barcode)\b[:\s#]*([A-Z0-9][A-Z0-9\s-]{7,40})/i
  );
  if (labeled?.[1]) {
    const token = sanitizeTracking(labeled[1]);
    if (token) return token;
  }

  const compact = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const branded =
    compact.match(/1Z[0-9A-Z]{16}/)?.[0] ||
    compact.match(/TBA[0-9A-Z]{10,22}/)?.[0] ||
    compact.match(/JD[0-9A-Z]{16,24}/)?.[0];
  if (branded) return branded;

  const runs = compact.match(/\d{12,28}/g) || [];
  runs.sort((a, b) => b.length - a.length);
  return runs[0] || "";
}

function extractCarrier(text: string): string {
  const upper = text.toUpperCase();
  return CARRIERS.find((name) => new RegExp(`\\b${name}\\b`).test(upper)) || "";
}

function sanitizeTracking(raw: string): string {
  const token = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return token.length >= 8 && token.length <= 40 ? token : "";
}

function cleanName(raw: string): string {
  return raw
    .replace(/\s+(unit|street|avenue|road|drive|lane|blvd|suite|apt|floor|recipient)\b.*$/i, "")
    .replace(/[,:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeName(line: string): boolean {
  if (!line || /\d/.test(line)) return false;
  if (/^(ship|deliver|recipient|attn|attention|from|tracking|barcode|parcel|weight|date)\b/i.test(line)) {
    return false;
  }
  return /^[A-Za-z][A-Za-z.'\-]+(?:\s+[A-Za-z][A-Za-z.'\-]+){1,3}$/.test(line);
}
