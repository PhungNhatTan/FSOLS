import { Router } from "express";
import { draftUpload } from "../middleware/multerDraft.js";
import * as ctrl from "../controllers/courseResource/courseResource.js";
import authenticate from '../../middleware/auth.js';
import { authorize } from '../../middleware/role.js';

const router = Router();

router.post(
  "/:courseId/draft/resource", authenticate, authorize(["Mentor"]),  
  draftUpload.single("file"),
  ctrl.uploadDraftResource
);

router.get(
  "/:courseId/draft/resources", authenticate, authorize(["Mentor", "Admin", "Moderator"]), 
  ctrl.listDraftResources
);

router.delete(
  "/:courseId/draft/resource/:resourceId",  authenticate, authorize(["Mentor", "Admin", "Moderator"]), 
  ctrl.deleteDraftResource
);

router.post(
  "/:courseId/verification-approve", authenticate, authorize(["Admin", "Moderator"]), 
  ctrl.approveVerification
);

router.post(
  "/:courseId/verification-reject", authenticate, authorize(["Admin", "Moderator"]),
  ctrl.rejectVerification
);

export default router;
