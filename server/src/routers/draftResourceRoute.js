import { Router } from "express";
import { draftUpload } from "../middleware/multerDraft.js";
import * as ctrl from "../controllers/courseResource/courseResource.js";

const router = Router();

router.post(
  "/:courseId/draft/resource",
  draftUpload.single("file"),
  ctrl.uploadDraftResource
);

router.get(
  "/:courseId/draft/resources",
  ctrl.listDraftResources
);

router.delete(
  "/:courseId/draft/resource/:resourceId",
  ctrl.deleteDraftResource
);

router.post(
  "/:courseId/verification-approve",
  ctrl.approveVerification
);

router.post(
  "/:courseId/verification-reject",
  ctrl.rejectVerification
);

export default router;
