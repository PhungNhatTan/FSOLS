export function resolveUploadUrl(url?: string | null): string | null {
  if (!url) return null;
  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "");
  const apiOrigin = apiBase.replace(/\/?api\/?$/i, "");

  const isLocalHost = (hostname: string) =>
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local");

  // If a previously-saved draft stored an absolute localhost URL, rewrite it
  // to the configured API origin so it works outside the dev machine.
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      if (u.pathname.startsWith("/uploads") && apiOrigin && isLocalHost(u.hostname)) {
        return `${apiOrigin}${u.pathname}${u.search}${u.hash}`;
      }
    } catch {
      // fall through
    }
    return url;
  }

  // Common case: server stores relative upload URLs like /uploads/...
  if (url.startsWith("/uploads")) {
    return apiOrigin ? `${apiOrigin}${url}` : url;
  }

  return url;
}
