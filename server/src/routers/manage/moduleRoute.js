import { Router } from "express";
import moduleController from "../../controllers/module/index.js";
import authenticate from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";

const router = Router();

router.post("/", authenticate, authorize(["Admin", "Mentor"]), moduleController.create);

export default router;
