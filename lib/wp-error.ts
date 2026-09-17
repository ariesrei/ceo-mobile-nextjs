/** WP REST fatals put HTML in `message`. Never show that markup in the app. */
export function publicWpErrorMessage(raw: unknown, fallback = "Something went wrong."): string {
  const text = typeof raw === "string" ? raw : "";
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (isWafBlockedMessage(text) || isWafBlockedMessage(stripped)) {
    return "This property blocked the hosted app server. Sign-in and data now load from your device instead. Try again.";
  }
  if (/critical error/i.test(stripped) || /there has been a critical error/i.test(stripped)) {
    return "This property’s WordPress site hit an error while signing you in. Try again, or ask an admin to check the site.";
  }
  if (!stripped) {
    return fallback;
  }
  return stripped.length > 180 ? `${stripped.slice(0, 180).trim()}…` : stripped;
}

/** nginx / Cloudflare / host WAF HTML, or the stripped "403 Forbidden 403 Forbidden" leftover. */
export function isWafBlockedMessage(raw?: string | null): boolean {
  const text = String(raw || "");
  if (!text) return false;
  if (/<!DOCTYPE|<html[\s>]|<h1>\s*403/i.test(text)) return true;
  if (/403\s+Forbidden(\s+403\s+Forbidden)?/i.test(text)) return true;
  if (
    /attention required|cloudflare|access denied|blocked by|blocked the hosted|web application firewall|\bwaf\b/i.test(
      text
    )
  ) {
    return true;
  }
  return false;
}

export function isWafBlockedResult(result: {
  status: number;
  error?: string;
  data?: unknown;
}): boolean {
  if (result.data) return false;
  if (isWafBlockedMessage(result.error)) return true;
  return result.status === 403 && !result.error;
}
