import path from "path";

export function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();

  const mimeTypes = {
    // Videos
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",

    // Documents
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Images
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",

    // Archives
    ".zip": "application/zip",

    // Text
    ".txt": "text/plain",
  };

  return mimeTypes[ext] ?? "application/octet-stream";
}
