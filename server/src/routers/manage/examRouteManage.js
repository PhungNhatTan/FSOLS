import { Router } from "express";
import exam from "../../controllers/exam/index.js";
import authenticate from "../../middleware/aut.js";
import { authorize } from "../../middleware/role.js";

const router = Router();

router.post("/", authenticate, authorize(["Admin", "Mentor"]), exam.create);
router.get("/:id", authenticate, authorize(["Admin", "Mentor"]), exam.get);
// router.get("/", exam.getAll);
// router.put("/:id", exam.update);
router.delete("/:id", authenticate, authorize(["Admin", "Mentor"]), exam.remove);

export default router;
