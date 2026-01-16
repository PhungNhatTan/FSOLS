import { Router } from "express";
import {
  isDriveEnabled,
  ensureCourseFolder,
  ensureAvatarsFolder,
  getFileMetadata,
  streamFileToResponse,
} from "../services/googleDriveService.js";
import { getMimeType } from "../utils/upload/mimeType.js";

/**
 * Fallback handler for /uploads/... when STORAGE_DRIVER=drive.
 *
 * The server continues to serve legacy local files via express.static.
 * If a file is not found locally, this route attempts to stream it from Drive.
 */

const router = Router();

function parseUploadsPath(reqPath) {
  // reqPath is like: /draft/course-123/<fileId>
  const parts = reqPath.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const stage = parts[0]; // draft | production
  const fileId = parts[parts.length - 1];

  if (stage === "draft") {
    const coursePart = parts[1];
    const m = /^course-(.+)$/.exec(coursePart);
    if (!m) return null;
    return { stage: "draft", courseId: m[1], fileId };
  }

  if (stage === "production") {
    const second = parts[1];
    if (second === "avatars") {
      return { stage: "production", kind: "avatars", fileId };
    }
    const m = /^course-(.+)$/.exec(second);
    if (!m) return null;
    return { stage: "production", courseId: m[1], fileId };
  }

  return null;
}

async function ensureExpectedFolderId(parsed) {
  if (parsed.stage === "draft") {
    return ensureCourseFolder(parsed.courseId, "draft");
  }
  if (parsed.stage === "production" && parsed.kind === "avatars") {
    return ensureAvatarsFolder();
  }
  if (parsed.stage === "production") {
    return ensureCourseFolder(parsed.courseId, "production");
  }
  return null;
}

router.get("/*", async (req, res) => {
  try {
    if (!isDriveEnabled()) return res.status(404).end();

    const parsed = parseUploadsPath(req.path);
    if (!parsed?.fileId) return res.status(404).end();

    // Security check: enforce the requested file is inside the expected folder.
    const expectedFolderId = await ensureExpectedFolderId(parsed);
    const meta = await getFileMetadata(parsed.fileId);
    const parents = meta?.parents || [];
    if (!expectedFolderId || !parents.includes(expectedFolderId)) {
      return res.status(404).end();
    }

    // Prefer a real media/document MIME type.
    // Drive can sometimes return application/octet-stream for uploaded binaries;
    // in that case we infer from the original filename.
    const name = meta?.name || "";
    const metaMime = meta?.mimeType || "";
    const guessedMime = name ? getMimeType(name) : "";
    const preferredMime =
      metaMime && metaMime !== "application/octet-stream" ? metaMime : guessedMime;

    if (preferredMime && preferredMime !== "application/octet-stream") {
      res.setHeader("Content-Type", preferredMime);
    }

    // Help browsers decide inline playback/download behavior.
    if (name) {
      // Keep it simple to avoid header encoding edge-cases.
      res.setHeader("Content-Disposition", `inline; filename=\"${name.replace(/\"/g, "")}\"`);
    }

    // Expose Range headers for cross-origin media playback.
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Range,Accept-Ranges,Content-Type"
    );

    const range = req.headers.range;
    await streamFileToResponse({
      fileId: parsed.fileId,
      rangeHeader: range,
      res,
      totalSize: meta?.size ? Number(meta.size) : undefined,
    });
  } catch (err) {
    // Drive returns 404/403 as errors; normalize to 404.
    const code = err?.code || err?.response?.status;
    if (code === 404 || code === 403) return res.status(404).end();
    console.error("uploadsProxyRoute error:", err);
    return res.status(500).end();
  }
});

export default router;
