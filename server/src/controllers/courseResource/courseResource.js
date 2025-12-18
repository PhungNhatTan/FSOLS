import * as service from "../../services/courseResource.js";

export const uploadDraftResource = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const resource = service.buildDraftResource(
    req.params.courseId,
    req.file
  );

  res.json(resource);
};

export const listDraftResources = (req, res) => {
  res.json(service.listDraftResources(req.params.courseId));
};

export const deleteDraftResource = (req, res) => {
  const ok = service.deleteDraftResource(
    req.params.courseId,
    req.params.resourceId
  );

  ok
    ? res.json({ success: true })
    : res.status(404).json({ error: "Resource not found" });
};

export const approveVerification = (req, res) => {
  const moved = service.moveDraftToProduction(req.params.courseId);
  res.json({ success: true, movedFiles: moved });
};

export const rejectVerification = (req, res) => {
  service.cleanupDraft(req.params.courseId);
  res.json({ success: true });
};
