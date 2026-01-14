import { Router } from "express";
import accountController from "../../controllers/account/index.js";
import authenticate from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";

const router = Router();

router.get("/all", authenticate, authorize(["Admin"]), accountController.getAll);

export default router;