export function toPublicFileUrl(pathname) {
  if (!pathname) return null;

  // already absolute → leave it
  if (pathname.startsWith("http")) return pathname;

  const baseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL;

  return `${baseUrl}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}
