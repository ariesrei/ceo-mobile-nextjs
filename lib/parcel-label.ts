export type ParsedParcelLabel = {
  name: string;
  unit: string;
  tracking: string;
  carrier: string;
};

const CARRIERS = ["DHL", "UPS", "USPS", "FEDEX", "AMAZON"] as const;

export function parseParcelLabel(text: string): ParsedParcelLabel {
  const compact = normalizeLabelText(text);
  return {
    name: extractName(compact),
    unit: extractUnit(compact),
    tracking: extractTracking(compact),
    carrier: extractCarrier(compact),
  };
}

export function pickTracking(...tokens: string[]): string {
  const discrete: string[] = [];
  for (const token of tokens) {
    const raw = String(token || "").trim();
    if (!raw) continue;
    if (raw.includes("\n") || raw.length > 40) {
      const fromText = extractTracking(raw);
      if (fromText) discrete.push(fromText);
      continue;
    }
    const one = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (isPlausibleTracking(one)) {
      discrete.push(one);
    }
  }
  return scoreTracking(discrete);
}

/** Prefer the printed unit number (10) over a WP post ID (71008). */
export function humanUnitLabel(
  unitId?: number,
  unitTitle?: string,
  parsedUnit?: string
): string {
  const parsed = String(parsedUnit || "")
    .replace(/^unit\s+/i, "")
    .trim();
  const title = String(unitTitle || "")
    .replace(/^unit\s+/i, "")
    .trim();
  const id = unitId ? String(unitId) : "";
  if (parsed && (!title || title === id || (/^\d{5,}$/.test(title) && parsed.length <= 6))) {
    return parsed;
  }
  if (title && title !== id) {
    return title;
  }
  return parsed || title;
}

/** Labeled lines only — do not append raw OCR digits (PHP mashes those). */
export function formatLookupText(raw: string, parsed: ParsedParcelLabel): string {
  const lines = [
    parsed.name ? `SHIP TO: ${parsed.name}` : "",
    parsed.unit ? `Unit #${parsed.unit}` : "",
    parsed.tracking ? `TRACKING NUMBER ${parsed.tracking}` : "",
    parsed.carrier,
  ].filter(Boolean);
  const safeRaw = String(raw || "")
    .replace(/\d{8,}/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
  if (safeRaw) {
    lines.push(safeRaw);
  }
  return lines.join("\n");
}

function normalizeLabelText(text: string): string {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/SHIP\s*TO/gi, "SHIP TO")
    .replace(/UNIT\s*#/gi, "Unit #")
    .replace(/TRACK\s*ING/gi, "TRACKING");
}

function unglueName(raw: string): string {
  return raw
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(JR|SR|II|III|IV)\b/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function extractName(text: string): string {
  const shipTo = text.match(
    /\b(?:ship\s*to|deliver(?:ed)?\s*to|recipient|attn|attention)\b[:\s,]*([A-Za-z][A-Za-z.'\-\s]{2,80}?)(?=\s*(?:,|recipient|unit|#|\d|$))/i
  );
  if (shipTo?.[1]) {
    const name = cleanName(unglueName(shipTo[1]));
    if (looksLikeName(name) || /^[A-Za-z].+\s+[A-Za-z]/.test(name)) {
      return name;
    }
  }

  for (const line of text.split(/\n+/)) {
    const trimmed = cleanName(unglueName(line.replace(/[,:]+$/g, "").trim()));
    if (looksLikeName(trimmed)) {
      return trimmed;
    }
  }
  return "";
}

function extractUnit(text: string): string {
  const match = text.match(
    /\b(?:unit|apt|apartment|suite|ste)\s*[#:]?\s*([A-Za-z0-9\-]{1,6})\b/i
  );
  const token = match?.[1] ? match[1].toUpperCase() : "";
  if (!token || /^\d{5,}$/.test(token)) {
    return "";
  }
  return token;
}

export function extractTracking(text: string): string {
  const lines = String(text || "").split(/\n+/);

  for (const line of lines) {
    if (!/\b(?:tracking|track(?:ing)?\s*(?:number|no|#)?|barcode)\b/i.test(line)) {
      continue;
    }
    const groups = line.match(/\d{12,22}/g) || [];
    const labeled = scoreTracking(groups);
    if (labeled) {
      return labeled;
    }
    const token = line.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const branded = brandedTracking(token);
    if (branded) {
      return branded;
    }
  }

  const branded = brandedTracking(text.toUpperCase().replace(/[^A-Z0-9]/g, ""));
  if (branded) {
    return branded;
  }

  const standalone: string[] = [];
  for (const line of lines) {
    const digits = line.replace(/\D/g, "");
    const letters = line.replace(/[^A-Za-z]/g, "");
    if (isPlausibleTracking(digits) && letters.length <= 4) {
      standalone.push(digits);
    }
    for (const group of line.match(/\d{12,22}/g) || []) {
      standalone.push(group);
    }
  }
  return scoreTracking(standalone);
}

function brandedTracking(compact: string): string {
  return (
    compact.match(/1Z[0-9A-Z]{16}/)?.[0] ||
    compact.match(/TBA[0-9A-Z]{10,22}/)?.[0] ||
    compact.match(/JD[0-9A-Z]{16,24}/)?.[0] ||
    ""
  );
}

function isPlausibleTracking(token: string): boolean {
  const value = String(token || "").replace(/[^A-Za-z0-9]/g, "");
  return value.length >= 12 && value.length <= 22;
}

function scoreTracking(candidates: string[]): string {
  const unique = Array.from(
    new Set(candidates.map((item) => item.replace(/[^A-Za-z0-9]/g, "").toUpperCase()).filter(isPlausibleTracking))
  );
  if (!unique.length) {
    return "";
  }
  unique.sort((a, b) => trackingScore(b) - trackingScore(a));
  return unique[0];
}

function trackingScore(token: string): number {
  let score = token.length;
  if (token.length >= 18 && token.length <= 20) {
    score += 20;
  }
  if (/^(1Z|TBA|JD)/.test(token)) {
    score += 30;
  }
  if (/^856/.test(token)) {
    score += 10;
  }
  return score;
}

function extractCarrier(text: string): string {
  const upper = text.toUpperCase();
  return CARRIERS.find((name) => new RegExp(`\\b${name}\\b`).test(upper)) || "";
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
