import { Router } from "express";
import certificateController from "../../controllers/certificate/index.js";

const router = Router();

router.get("/:accountId/:certificateId", certificateController.getStudentCertificate);

export default router;
