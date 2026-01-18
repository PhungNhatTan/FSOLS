export type MediaKind = "video" | "document" | "image" | "html" | "other" | "unknown";

const VIDEO_EXT = new Set(["mp4", "webm", "ogg", "ogv", "mov", "m4v", "avi", "mkv"]);
const DOC_EXT = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "md",
]);
const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

const getFileExtension = (v?: string | null): string => {
  if (!v) return "";
  const clean = v.split("?")[0].split("#")[0];
  const idx = clean.lastIndexOf(".");
  if (idx < 0) return "";
  return clean.slice(idx + 1).toLowerCase();
};

/**
 * Infer media kind based on URL and/or a filename hint.
 * We intentionally do NOT rely on legacy CourseLesson fields.
 */
export const inferMediaKind = (url?: string | null, nameHint?: string | null): MediaKind => {
  const ext = getFileExtension(url) || getFileExtension(nameHint);
  if (!ext) return "unknown";
  if (VIDEO_EXT.has(ext)) return "video";
  if (DOC_EXT.has(ext)) return "document";
  if (IMAGE_EXT.has(ext)) return "image";
  if (ext === "html" || ext === "htm") return "html";
  return "other";
};

export type ResourceLike = { Url?: string | null; Name?: string | null };

/**
 * Infer a lesson-level kind from resources.
 * Priority: video > document > image > html > other > unknown
 */
export const inferLessonKindFromResources = (resources?: ResourceLike[] | null): MediaKind => {
  const list = Array.isArray(resources) ? resources : [];
  const kinds = list
    .map((r) => inferMediaKind(r?.Url ?? null, r?.Name ?? null))
    .filter(Boolean);

  if (kinds.includes("video")) return "video";
  if (kinds.includes("document")) return "document";
  if (kinds.includes("image")) return "image";
  if (kinds.includes("html")) return "html";
  if (kinds.includes("other")) return "other";
  return "unknown";
};

export const iconForMediaKind = (kind: MediaKind): string => {
  switch (kind) {
    case "video":
      return "📹";
    case "document":
      return "📄";
    case "image":
      return "🖼️";
    default:
      return "📎";
  }
};
