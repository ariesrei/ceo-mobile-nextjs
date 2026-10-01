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
    const one = sliceCarrierTracking(raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase());
    if (one) {
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
  if (parsed && (!title || title === id || /^\d{5,}$/.test(title))) {
    return parsed;
  }
  if (title && title !== id && !/^\d{5,}$/.test(title)) {
    return title;
  }
  return parsed;
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
  const match =
    text.match(/\bunit\b[^#\n]{0,16}#\s*([A-Za-z0-9\-]{1,6})\b/i) ||
    text.match(/\b(?:unit|apt|apartment|suite|ste)\s*[#:]?\s*([A-Za-z0-9\-]{1,6})\b/i);
  const token = match?.[1] ? match[1].toUpperCase() : "";
  if (!token || /^\d{5,}$/.test(token) || token === "NUMBER") {
    return "";
  }
  return token;
}

export function extractTracking(text: string): string {
  const raw = String(text || "").replace(/TRACK\s*ING/gi, "TRACKING");
  const lines = raw.split(/\n+/);
  const found: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!isTrackingLabelLine(lines[i])) {
      continue;
    }
    const block = sliceCarrierTracking(digitsAfterTrackingLabel(lines, i));
    if (block) {
      found.push(block);
    }
  }

  const spaced = extractSpacedTracking(raw);
  if (spaced) {
    found.push(spaced);
  }

  const fromBlob = extractKnownCarrier(raw);
  if (fromBlob) {
    found.push(fromBlob);
  }

  for (const line of lines) {
    const letters = line.replace(/[^A-Za-z]/g, "");
    if (letters.length <= 4) {
      const sliced = sliceCarrierTracking(ocrDigitRun(line));
      if (sliced) {
        found.push(sliced);
      }
    }
    for (const group of line.match(/\d{12,22}/g) || []) {
      found.push(group);
    }
  }

  return scoreTracking(found);
}

function isTrackingLabelLine(line: string): boolean {
  return /track|barcode|awb|waybill/i.test(line);
}

/** Digits on the TRACKING line plus following digit lines. Do not glue 8506 bars onto 856. */
function digitsAfterTrackingLabel(lines: string[], start: number): string {
  const afterLabel = lines[start]
    .replace(/.*(?:track(?:ing)?|barcode|awb|waybill)\b/i, "")
    .replace(/^\s*NUMBER\b/i, "");
  let digits = ocrDigitRun(afterLabel);
  for (let step = 1; step <= 3 && digits.length < 22; step++) {
    const line = lines[start + step] || "";
    if (!line.trim()) {
      continue;
    }
    const extra = ocrDigitRun(line);
    if (!extra) {
      continue;
    }
    const letters = line.replace(/[^A-Za-z]/g, "");
    if (letters.length > 4 && extra.length < 10) {
      continue;
    }
    if (/^856/.test(digits) && /^8506/.test(extra)) {
      break;
    }
    if (/^856/.test(digits) && digits.length >= 19 && /^856/.test(extra)) {
      break;
    }
    digits += extra;
  }
  return digits;
}

function ocrDigitRun(raw: string): string {
  return String(raw || "")
    .replace(/[Oo]/g, "0")
    .replace(/[IilL|]/g, "1")
    .replace(/[Ss]/g, "5")
    .replace(/[Bg]/g, "8")
    .replace(/Z/g, "2")
    .replace(/\D/g, "");
}

/** 856 / 1Z / TBA / JD from the whole blob. Strip TRACKING first so I→1 cannot prefix 1856. */
function extractKnownCarrier(text: string): string {
  const compact = String(text || "")
    .toUpperCase()
    .replace(/TRACK\s*ING/g, " ")
    .replace(/NUMBER|BARCODE|WAYBILL|AIRWAY/g, " ")
    .replace(/[^A-Z0-9]/g, "");
  const branded = brandedTracking(compact);
  if (branded) {
    return branded;
  }
  return sliceCarrierTracking(ocrDigitRun(compact));
}

/** 8561234567901234566 even when OCR inserts spaces. Do not join the whole page. */
function extractSpacedTracking(text: string): string {
  const matches856 = Array.from(
    text.matchAll(/8[5S]6(?:[\s\-]*[0-9OoDIilL|SsBgZ]){14,20}/g)
  ).map((match) => ocrDigitRun(match[0]));
  const full856 = matches856.filter((token) => token.length >= 16 && token.length <= 22);
  if (full856.length) {
    return full856.sort((a, b) => b.length - a.length)[0].slice(0, 19);
  }
  const match8506 = text.match(/8506(?:[\s\-]*\d){14,20}/);
  if (match8506) {
    return match8506[0].replace(/\D/g, "").slice(0, 21);
  }
  return "";
}

function sliceCarrierTracking(digits: string): string {
  const match856 = digits.match(/856\d{13,20}/);
  if (match856) {
    return match856[0].slice(0, 19);
  }
  const match8506 = digits.match(/8506\d{14,20}/);
  if (match8506) {
    return match8506[0].slice(0, 21);
  }
  return isPlausibleTracking(digits) ? digits : "";
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
  if (/^(1Z|TBA|JD)/.test(value)) {
    return value.length >= 12 && value.length <= 24;
  }
  if (/^856\d+$/.test(value)) {
    return value.length >= 16 && value.length <= 22;
  }
  if (/^8506\d+$/.test(value)) {
    return value.length >= 18 && value.length <= 24;
  }
  return value.length >= 18 && value.length <= 22;
}

function scoreTracking(candidates: string[]): string {
  const unique = Array.from(
    new Set(
      candidates
        .map((item) => sliceCarrierTracking(item.replace(/[^A-Za-z0-9]/g, "").toUpperCase()))
        .filter(isPlausibleTracking)
    )
  );
  if (!unique.length) {
    return "";
  }
  unique.sort((a, b) => trackingScore(b) - trackingScore(a));
  return unique[0];
}

function trackingScore(token: string): number {
  if (/^856\d{16}$/.test(token)) {
    return 1000;
  }
  if (/^8506\d{16,18}$/.test(token)) {
    return 80 + token.length;
  }
  if (/^856\d{15}$/.test(token)) {
    return 90;
  }
  if (/^856\d{13,14}$/.test(token)) {
    return 70 + token.length;
  }
  if (/^(1Z|TBA|JD)/.test(token)) {
    return 60 + token.length;
  }
  if (/^1856/.test(token)) {
    return token.length;
  }
  return token.length;
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
