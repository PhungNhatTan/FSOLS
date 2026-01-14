export function resolveUploadUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  // Common case: server stores relative upload URLs like /uploads/...
  if (url.startsWith("/uploads")) {
    const apiBase = String(import.meta.env.VITE_API_BASE_URL || "");
    // Default env is http://localhost:5000/api -> origin should be http://localhost:5000
    const origin = apiBase.replace(/\/?api\/?$/i, "");
    return `${origin}${url}`;
  }

  return url;
}
