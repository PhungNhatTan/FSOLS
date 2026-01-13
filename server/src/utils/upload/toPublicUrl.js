// utils/publicUrl.js
export function toPublicUrl(relativePath) {
  if (!relativePath) return null;

  if (relativePath.startsWith("http")) return relativePath;

  const base =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL;

  if (!base) {
    throw new Error("SERVER_URL / RENDER_EXTERNAL_URL not set");
  }

  return `${base}${relativePath.startsWith("/") ? "" : "/"}${relativePath}`;
}
