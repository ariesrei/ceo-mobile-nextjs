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

export function fetchErrorMessage(err: unknown): string {
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
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return "Could not reach WordPress. Is LocalWP running, and is the property URL correct?";
  }
  return err instanceof Error ? err.message : "Network error talking to WordPress.";
}
