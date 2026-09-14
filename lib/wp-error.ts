/** WP REST fatals put HTML in `message`. Never show that markup in the app. */
export function publicWpErrorMessage(raw: unknown, fallback = "Something went wrong."): string {
  const text = typeof raw === "string" ? raw : "";
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (/critical error/i.test(stripped) || /there has been a critical error/i.test(stripped)) {
    return "This property’s WordPress site hit an error while signing you in. Try again, or ask an admin to check the site.";
  }
  if (!stripped) {
    return fallback;
  }
  return stripped.length > 180 ? `${stripped.slice(0, 180).trim()}…` : stripped;
}
