import { Agent, fetch as undiciFetch } from "undici";

/**
 * LocalWP HTTPS uses a cert Node does not trust by default.
 * In development (or when CEO_ALLOW_INSECURE_TLS=1), skip TLS verification
 * for server-side calls from Next → WordPress.
 */
function allowInsecureTls(): boolean {
  if (process.env.CEO_ALLOW_INSECURE_TLS === "1") return true;
  if (process.env.CEO_ALLOW_INSECURE_TLS === "0") return false;
  return process.env.NODE_ENV !== "production";
}

const insecureAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

export async function serverFetch(
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (!allowInsecureTls()) {
    return fetch(input, init);
  }

  // undici's fetch accepts dispatcher; cast keeps Next/TS happy across versions.
  return undiciFetch(input, {
    ...init,
    dispatcher: insecureAgent,
  } as Parameters<typeof undiciFetch>[1]) as unknown as Promise<Response>;
}

function isPrivateWpHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "127.0.0.1" ||
      host === "::1"
    );
  } catch {
    return false;
  }
}

export function fetchErrorMessage(err: unknown, requestUrl?: string): string {
  const cause =
    err && typeof err === "object" && "cause" in err
      ? (err as { cause?: { code?: string; message?: string } }).cause
      : undefined;
  const code = cause?.code || "";
  if (
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "CERT_HAS_EXPIRED" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    /certificate/i.test(cause?.message || "")
  ) {
    return (
      "Could not verify the WordPress SSL certificate (common with LocalWP HTTPS). " +
      "Try the http:// site URL from Local, or keep NODE_ENV=development / set CEO_ALLOW_INSECURE_TLS=1."
    );
  }
  if (
    requestUrl &&
    isPrivateWpHost(requestUrl) &&
    process.env.NODE_ENV === "production"
  ) {
    return (
      "This hosted Next.js app cannot reach LocalWP (.local / localhost). " +
      "Run npm run dev and open http://localhost:3000, then Connect with http://ceonesource.local/your-property. " +
      "Or use a LocalWP Live Link URL from the Vercel demo."
    );
  }
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT") {
    if (requestUrl && isPrivateWpHost(requestUrl)) {
      return (
        "Could not reach WordPress at that .local URL. Use the LocalWP site URL including the property path " +
        "(example: http://ceonesource.local/starlink), and run this Next app locally (npm run dev) — not on Vercel."
      );
    }
    return "Could not reach WordPress. Is LocalWP running, and is the property URL correct?";
  }
  return err instanceof Error ? err.message : "Network error talking to WordPress.";
}
