import { Router } from "express";
import userCertificateController from "../../controllers/userCertificate/index.js";

const router = Router();

router.get("/:id", userCertificateController.get);

export default router;
