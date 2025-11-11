import { Router } from "express";
import questionBankController from "../../controllers/questionBank/index.js";
import authenticate from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";

const router = Router();

router.post("/", authenticate, authorize(["Admin", "Mentor"]), questionBankController.create);

export default router;
