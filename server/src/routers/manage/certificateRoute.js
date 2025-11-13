import { Router } from "express";
import certificateController from "../../controllers/certificate/index.js";
import authenticate from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";

const router = Router();

router.get("/:id", authenticate, authorize(["Admin", "Mentor"]), certificateController.get);
router.post("/", authenticate, authorize(["Admin", "Mentor"]), certificateController.create);

export default router;
