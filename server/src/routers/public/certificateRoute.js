import { Router } from "express";
import certificateController from "../../controllers/certificate/index.js";
import authenticate from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";

const router = Router();

// List certificates issued to the current authenticated user (Profile page)
// NOTE: declare this route before the "/:accountId/:certificateId" route
router.get(
  "/me",
  authenticate,
  authorize(["Student", "Mentor", "Moderator", "Admin"]),
  certificateController.getMyCertificates
);

router.get("/:accountId/:certificateId", certificateController.getStudentCertificate);

export default router;
