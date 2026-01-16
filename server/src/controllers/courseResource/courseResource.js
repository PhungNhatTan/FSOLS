import fs from "fs";
import * as service from "../../services/courseResource.js";
import { isDriveEnabled } from "../../services/googleDriveService.js";

export const uploadDraftResource = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const resource = await service.buildDraftResource(req.params.courseId, req.file);

  // If Drive is enabled, multer staged the file in a temp folder; remove it now.
  if (isDriveEnabled() && req.file?.path) {
    fs.promises.unlink(req.file.path).catch(() => undefined);
  }

  res.json(resource);
};

export const listDraftResources = async (req, res) => {
  res.json(await service.listDraftResources(req.params.courseId));
};

export const deleteDraftResource = async (req, res) => {
  const ok = await service.deleteDraftResource(req.params.courseId, req.params.resourceId);

  if (ok) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Resource not found" });
  }
};

export const approveVerification = async (req, res) => {
  const moved = await service.moveDraftToProduction(req.params.courseId);
  await service.cleanupDraft(req.params.courseId);
  res.json({ success: true, movedFiles: moved });
};

export const rejectVerification = async (req, res) => {
  await service.cleanupDraft(req.params.courseId);
  res.json({ success: true });
};
