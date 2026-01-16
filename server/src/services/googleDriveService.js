import fs from "fs";
import os from "os";
import path from "path";
import { google } from "googleapis";

/**
 * Google Drive-backed storage for FSOLS.
 *
 * Auth modes:
 *  - OAuth (recommended for personal Google accounts):
 *      Provide GDRIVE_OAUTH_CLIENT_ID, GDRIVE_OAUTH_CLIENT_SECRET, and GDRIVE_OAUTH_REFRESH_TOKEN.
 *      Optionally GDRIVE_OAUTH_REDIRECT_URI.
 *  - Service Account:
 *      Provide GDRIVE_SERVICE_ACCOUNT_B64 (or JSON / split keys).
 *      For Google Workspace, use Shared Drives or Domain-wide Delegation (impersonation).
 */

function readServiceAccountFromEnv() {
  // Prefer full JSON via env to avoid committing secrets.
  if (process.env.GDRIVE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GDRIVE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.GDRIVE_SERVICE_ACCOUNT_B64) {
    const raw = Buffer.from(process.env.GDRIVE_SERVICE_ACCOUNT_B64, "base64").toString("utf8");
    return JSON.parse(raw);
  }

  // Fallback: split keys.
  if (process.env.GDRIVE_CLIENT_EMAIL && process.env.GDRIVE_PRIVATE_KEY) {
    return {
      client_email: process.env.GDRIVE_CLIENT_EMAIL,
      // Private keys are commonly stored with escaped newlines.
      private_key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

export function isDriveEnabled() {
  return (process.env.STORAGE_DRIVER || "").toLowerCase() === "drive";
}

function requireRootFolderId() {
  const id = process.env.GDRIVE_ROOT_FOLDER_ID;
  if (!id) {
    throw new Error("GDRIVE_ROOT_FOLDER_ID is required when STORAGE_DRIVER=drive");
  }
  return id;
}

function supportsAllDrives() {
  return (process.env.GDRIVE_SUPPORTS_ALL_DRIVES || "").toLowerCase() === "true";
}

function authMode() {
  return (process.env.GDRIVE_AUTH_MODE || "").toLowerCase();
}

function buildAuthClient() {
  const mode = authMode();

  // OAuth mode (3-legged OAuth). Recommended for personal Google accounts.
  // If mode is not specified, we auto-enable OAuth when a refresh token is present.
  const shouldUseOAuth = mode === "oauth" || (!mode && !!process.env.GDRIVE_OAUTH_REFRESH_TOKEN);
  if (shouldUseOAuth) {
    const clientId = process.env.GDRIVE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GDRIVE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GDRIVE_OAUTH_REFRESH_TOKEN;
    const redirectUri = process.env.GDRIVE_OAUTH_REDIRECT_URI || "http://localhost";

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        "Google Drive OAuth is enabled but credentials are missing. Set GDRIVE_OAUTH_CLIENT_ID, GDRIVE_OAUTH_CLIENT_SECRET, and GDRIVE_OAUTH_REFRESH_TOKEN."
      );
    }

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2.setCredentials({ refresh_token: refreshToken });
    return oauth2;
  }

  // Service account mode.
  const sa = readServiceAccountFromEnv();
  if (!sa?.client_email || !sa?.private_key) {
    throw new Error(
      "Google Drive is enabled but service account credentials were not found. Set GDRIVE_SERVICE_ACCOUNT_B64 (recommended) or GDRIVE_SERVICE_ACCOUNT_JSON."
    );
  }

  const subject = process.env.GDRIVE_IMPERSONATE_USER || undefined;

  // For Google Workspace Domain-wide Delegation, set GDRIVE_IMPERSONATE_USER to a user in your domain.
  // This requires admin-side authorization of the service account client ID.
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
    subject,
  });

  return auth;
}

let _driveClient = null;

export function getDriveClient() {
  if (_driveClient) return _driveClient;

  const auth = buildAuthClient();
  _driveClient = google.drive({ version: "v3", auth });
  return _driveClient;
}

const FOLDER_MIME = "application/vnd.google-apps.folder";

// Cache folder ids to avoid repeated Drive lookups.
const folderCache = new Map();

async function findChildFolderId(parentId, name) {
  const drive = getDriveClient();
  const q = [
    `'${parentId}' in parents`,
    `mimeType='${FOLDER_MIME}'`,
    "trashed=false",
    `name='${name.replace(/'/g, "\\'")}'`,
  ].join(" and ");

  const resp = await drive.files.list({
    q,
    fields: "files(id,name)",
    pageSize: 1,
    includeItemsFromAllDrives: supportsAllDrives(),
    supportsAllDrives: supportsAllDrives(),
  });

  const hit = resp?.data?.files?.[0];
  return hit?.id || null;
}

async function createChildFolder(parentId, name) {
  const drive = getDriveClient();
  const resp = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    },
    fields: "id,name",
    supportsAllDrives: supportsAllDrives(),
  });

  return resp?.data?.id;
}

export async function ensureFolder(parentId, name) {
  const key = `${parentId}/${name}`;
  if (folderCache.has(key)) return folderCache.get(key);

  let id = await findChildFolderId(parentId, name);
  if (!id) id = await createChildFolder(parentId, name);
  if (!id) throw new Error(`Failed to ensure Drive folder: ${name}`);

  folderCache.set(key, id);
  return id;
}

export async function ensureRootFolder() {
  const id = requireRootFolderId();
  folderCache.set("root", id);
  return id;
}

export async function ensureDraftRoot() {
  const root = await ensureRootFolder();
  return ensureFolder(root, "draft");
}

export async function ensureProductionRoot() {
  const root = await ensureRootFolder();
  return ensureFolder(root, "production");
}

export async function ensureAvatarsFolder() {
  const prod = await ensureProductionRoot();
  return ensureFolder(prod, "avatars");
}

export async function ensureCourseFolder(courseId, stage /* 'draft'|'production' */) {
  const base = stage === "production" ? await ensureProductionRoot() : await ensureDraftRoot();
  return ensureFolder(base, `course-${courseId}`);
}

export async function uploadFileToFolder({ folderId, localPath, name, mimeType, appProperties }) {
  const drive = getDriveClient();

  const resp = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
      appProperties: appProperties || undefined,
    },
    media: {
      mimeType,
      body: fs.createReadStream(localPath),
    },
    fields: "id,name,mimeType,size,createdTime,modifiedTime,parents",
    supportsAllDrives: supportsAllDrives(),
  });

  const f = resp?.data;
  if (!f?.id) throw new Error("Drive upload failed");

  if ((process.env.GDRIVE_MAKE_PUBLIC || "").toLowerCase() === "true") {
    // Optional; not required if you proxy through your backend.
    try {
      await drive.permissions.create({
        fileId: f.id,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: supportsAllDrives(),
      });
    } catch {
      // Best-effort.
    }
  }

  return f;
}

export async function listFilesInFolder(folderId) {
  const drive = getDriveClient();
  const q = [`'${folderId}' in parents`, "trashed=false"].join(" and ");
  const resp = await drive.files.list({
    q,
    fields: "files(id,name,mimeType,size,createdTime,modifiedTime,parents)",
    pageSize: 1000,
    includeItemsFromAllDrives: supportsAllDrives(),
    supportsAllDrives: supportsAllDrives(),
  });
  return resp?.data?.files || [];
}

export async function getFileMetadata(fileId) {
  const drive = getDriveClient();
  const resp = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size,createdTime,modifiedTime,parents",
    supportsAllDrives: supportsAllDrives(),
  });
  return resp?.data;
}

export async function deleteFile(fileId) {
  const drive = getDriveClient();
  await drive.files.delete({
    fileId,
    supportsAllDrives: supportsAllDrives(),
  });
}

export async function moveFileBetweenFolders({ fileId, fromFolderId, toFolderId }) {
  const drive = getDriveClient();
  const resp = await drive.files.update({
    fileId,
    addParents: toFolderId,
    removeParents: fromFolderId,
    fields: "id,parents",
    supportsAllDrives: supportsAllDrives(),
  });
  return resp?.data;
}

function getHeaderCaseInsensitive(headers, name) {
  if (!headers) return undefined;
  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (direct !== undefined) return direct;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : undefined;
}

function parseRangeHeader(rangeHeader, totalSize) {
  // Only support a single range: bytes=start-end
  if (!rangeHeader || typeof rangeHeader !== "string") return null;
  const m = /^bytes=(\d+)-(\d+)?$/.exec(rangeHeader.trim());
  if (!m) return null;
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : Math.max(0, Number(totalSize) - 1);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) return null;
  return { start, end };
}

export async function streamFileToResponse({ fileId, rangeHeader, res, totalSize }) {
  const drive = getDriveClient();

  const requestOptions = {
    responseType: "stream",
    headers: rangeHeader ? { Range: rangeHeader } : undefined,
  };

  // The googleapis client returns a gaxios response with status/headers/data(stream)
  const resp = await drive.files.get(
    {
      fileId,
      alt: "media",
      // Allows downloading files flagged by Google as potentially abusive.
      // Harmless for normal files; necessary for some uploads.
      acknowledgeAbuse: true,
      supportsAllDrives: supportsAllDrives(),
    },
    requestOptions
  );

  // Forward most relevant headers.
  const h = resp?.headers || {};
  // If the caller already set a preferred Content-Type (e.g., inferred from filename),
  // do not overwrite it with a generic Drive type like application/octet-stream.
  const incomingType = getHeaderCaseInsensitive(h, "content-type");
  if (incomingType) {
    const existingType = res.getHeader("Content-Type");
    const existingStr = existingType ? String(existingType).toLowerCase() : "";
    const incomingStr = String(incomingType).toLowerCase();
    const shouldSet =
      !existingType ||
      existingStr.includes("application/octet-stream") ||
      (existingStr.startsWith("text/") && !incomingStr.startsWith("text/"));

    if (shouldSet) res.setHeader("Content-Type", incomingType);
  }
  const incomingLength = getHeaderCaseInsensitive(h, "content-length");
  const incomingRange = getHeaderCaseInsensitive(h, "content-range");
  const incomingAcceptRanges = getHeaderCaseInsensitive(h, "accept-ranges");

  // Forward Range-related headers. If Drive omits Content-Range for a 206 response,
  // compute a valid Content-Range from the requested range + known total size.
  if (incomingRange) {
    res.setHeader("Content-Range", incomingRange);
  } else if (rangeHeader && totalSize) {
    const r = parseRangeHeader(rangeHeader, totalSize);
    if (r) res.setHeader("Content-Range", `bytes ${r.start}-${r.end}/${totalSize}`);
  }

  if (incomingLength) {
    res.setHeader("Content-Length", incomingLength);
  } else if (rangeHeader && totalSize) {
    const r = parseRangeHeader(rangeHeader, totalSize);
    if (r) res.setHeader("Content-Length", String(r.end - r.start + 1));
  }

  if (incomingAcceptRanges) res.setHeader("Accept-Ranges", incomingAcceptRanges);
  else res.setHeader("Accept-Ranges", "bytes");

  // Cache aggressively; safe when URLs are immutable (Drive file IDs).
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  res.status(resp.status || (rangeHeader ? 206 : 200));

  // If the client aborts (common for media range probes), stop the upstream stream.
  res.on("close", () => {
    if (res.writableEnded || res.writableFinished) return;
    try {
      if (resp?.data && typeof resp.data.destroy === "function") resp.data.destroy();
    } catch {
      // ignore
    }
  });

  resp.data.on("error", (e) => {
    if (!res.headersSent) res.status(500);
    res.end(e);
  });
  resp.data.pipe(res);
}

export function getTempUploadDir(...parts) {
  const base = path.join(os.tmpdir(), "fsols-temp-uploads", ...parts);
  fs.mkdirSync(base, { recursive: true });
  return base;
}
