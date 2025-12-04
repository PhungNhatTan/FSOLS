import { Router } from "express";
import moduleController from "../../controllers/module/index.js";
import authenticate from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";

const router = Router();

router.post("/", authenticate, authorize(["Admin", "Mentor"]), moduleController.create);
// router.get("/:id", moduleController.get);
// router.get("/", moduleController.getAll);
// router.put("/:id", moduleController.update);
router.delete("/:id", authenticate, authorize(["Admin", "Mentor"]), moduleController.remove);

export default router;
