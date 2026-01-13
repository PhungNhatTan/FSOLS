import fs from "fs";
import path from "path";
import {
  draftUploadsDir,
  productionUploadsDir,
} from "../config/uploadPath.js";
import { getMimeType } from "../utils/upload/mimeType.js";
import { toPublicUrl } from "../utils/upload/toPublicUrl.js";

export function buildDraftResource(courseId, file) {
  const relativePath = `/uploads/draft/course-${courseId}/${file.filename}`;

  return {
    id: `draft_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: file.originalname,
    url: toPublicUrl(relativePath),
    size: file.size,
    type: file.mimetype,
    uploadedAt: new Date().toISOString(),
  };
}


export function listDraftResources(courseId) {
  const dir = path.join(draftUploadsDir, `course-${courseId}`);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir).map(filename => {
    const filePath = path.join(dir, filename);
    const stat = fs.statSync(filePath);

    const relativePath = `/uploads/draft/course-${courseId}/${filename}`;

    return {
      id: `draft_${filename}`,
      name: filename,
      url: toPublicUrl(relativePath),
      size: stat.size,
      type: getMimeType(filename),
      uploadedAt: stat.birthtime.toISOString(),
    };
  });
}

export function deleteDraftResource(courseId, resourceId) {
  const filename = resourceId.replace("draft_", "");
  const filePath = path.join(
    draftUploadsDir,
    `course-${courseId}`,
    filename
  );

  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function moveDraftToProduction(courseId) {
  const draftDir = path.join(draftUploadsDir, `course-${courseId}`);
  const prodDir = path.join(productionUploadsDir, `course-${courseId}`);

  if (!fs.existsSync(draftDir)) return [];

  fs.mkdirSync(prodDir, { recursive: true });

  const files = fs.readdirSync(draftDir);
  const moved = [];

  for (const f of files) {
    fs.copyFileSync(
      path.join(draftDir, f),
      path.join(prodDir, f)
    );

    moved.push({
      name: f,
      draftUrl: toPublicUrl(`/uploads/draft/course-${courseId}/${f}`),
      productionUrl: toPublicUrl(`/uploads/production/course-${courseId}/${f}`),
    });
  }

  // fs.rmSync(draftDir, { recursive: true, force: true }); // Moved to cleanupDraft
  return moved;
}

export function cleanupDraft(courseId) {
  const dir = path.join(draftUploadsDir, `course-${courseId}`);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
