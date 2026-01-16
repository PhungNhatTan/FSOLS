import fs from "fs";
import path from "path";
import {
  draftUploadsDir,
  productionUploadsDir,
} from "../config/uploadPath.js";
import { getMimeType } from "../utils/upload/mimeType.js";
import {
  isDriveEnabled,
  ensureCourseFolder,
  uploadFileToFolder,
  listFilesInFolder,
  deleteFile,
  moveFileBetweenFolders,
} from "./googleDriveService.js";

function buildLocalDraftResource(courseId, file) {
  const relativePath = `/uploads/draft/course-${courseId}/${file.filename}`;

  return {
    id: `draft_${file.filename}`,
    name: file.originalname,
    // IMPORTANT: keep this as a relative /uploads/... URL.
    // The client (and dev proxy) is responsible for resolving it to the correct origin.
    // This avoids hard-coding localhost into persisted drafts.
    url: relativePath,
    size: file.size,
    type: file.mimetype,
    uploadedAt: new Date().toISOString(),
  };
}

export async function buildDraftResource(courseId, file) {
  if (!isDriveEnabled()) {
    return buildLocalDraftResource(courseId, file);
  }

  const folderId = await ensureCourseFolder(courseId, "draft");
  const uploaded = await uploadFileToFolder({
    folderId,
    localPath: file.path,
    name: file.originalname,
    mimeType: file.mimetype,
    appProperties: { originalName: file.originalname },
  });

  const relativePath = `/uploads/draft/course-${courseId}/${uploaded.id}`;

  return {
    id: `draft_${uploaded.id}`,
    name: uploaded.name || file.originalname,
    url: relativePath,
    size: Number(uploaded.size || file.size || 0),
    type: uploaded.mimeType || file.mimetype,
    uploadedAt: uploaded.createdTime || new Date().toISOString(),
  };
}

export async function listDraftResources(courseId) {
  if (!isDriveEnabled()) {
    const dir = path.join(draftUploadsDir, `course-${courseId}`);
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir).map((filename) => {
      const filePath = path.join(dir, filename);
      const stat = fs.statSync(filePath);

      const relativePath = `/uploads/draft/course-${courseId}/${filename}`;

      return {
        id: `draft_${filename}`,
        name: filename,
        url: relativePath,
        size: stat.size,
        type: getMimeType(filename),
        uploadedAt: stat.birthtime.toISOString(),
      };
    });
  }

  const folderId = await ensureCourseFolder(courseId, "draft");
  const files = await listFilesInFolder(folderId);

  return files.map((f) => ({
    id: `draft_${f.id}`,
    name: f.name,
    url: `/uploads/draft/course-${courseId}/${f.id}`,
    size: Number(f.size || 0),
    type: f.mimeType || getMimeType(f.name),
    uploadedAt: f.createdTime || f.modifiedTime || new Date().toISOString(),
  }));
}

export async function deleteDraftResource(courseId, resourceId) {
  if (!resourceId) return false;

  if (!isDriveEnabled()) {
    const filename = resourceId.replace("draft_", "");
    const filePath = path.join(draftUploadsDir, `course-${courseId}`, filename);

    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  }

  const fileId = resourceId.replace("draft_", "");
  try {
    // Best-effort: only delete if the file is in the expected folder.
    const folderId = await ensureCourseFolder(courseId, "draft");
    const files = await listFilesInFolder(folderId);
    if (!files.some((f) => f.id === fileId)) return false;
    await deleteFile(fileId);
    return true;
  } catch {
    return false;
  }
}

export async function moveDraftToProduction(courseId) {
  if (!isDriveEnabled()) {
    const draftDir = path.join(draftUploadsDir, `course-${courseId}`);
    const prodDir = path.join(productionUploadsDir, `course-${courseId}`);

    if (!fs.existsSync(draftDir)) return [];

    fs.mkdirSync(prodDir, { recursive: true });

    const files = fs.readdirSync(draftDir);
    const moved = [];

    for (const f of files) {
      fs.copyFileSync(path.join(draftDir, f), path.join(prodDir, f));

      moved.push({
        name: f,
        draftUrl: `/uploads/draft/course-${courseId}/${f}`,
        productionUrl: `/uploads/production/course-${courseId}/${f}`,
      });
    }

    return moved;
  }

  const draftFolderId = await ensureCourseFolder(courseId, "draft");
  const prodFolderId = await ensureCourseFolder(courseId, "production");
  const files = await listFilesInFolder(draftFolderId);

  const moved = [];
  for (const f of files) {
    await moveFileBetweenFolders({
      fileId: f.id,
      fromFolderId: draftFolderId,
      toFolderId: prodFolderId,
    });

    moved.push({
      name: f.name,
      draftUrl: `/uploads/draft/course-${courseId}/${f.id}`,
      productionUrl: `/uploads/production/course-${courseId}/${f.id}`,
    });
  }

  return moved;
}

export async function cleanupDraft(courseId) {
  if (!isDriveEnabled()) {
    const dir = path.join(draftUploadsDir, `course-${courseId}`);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    return;
  }

  // In Drive mode, delete remaining files in the draft folder (folder is reused).
  try {
    const folderId = await ensureCourseFolder(courseId, "draft");
    const files = await listFilesInFolder(folderId);
    await Promise.all(files.map((f) => deleteFile(f.id).catch(() => undefined)));
  } catch {
    // Best-effort.
  }
}
