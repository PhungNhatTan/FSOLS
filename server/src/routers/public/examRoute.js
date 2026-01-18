import { Router } from "express";
import exam from "../../controllers/exam/index.js";
import authenticateOptional from "../../middleware/authOptional.js";

const router = Router();

router.post("/", exam.create);
router.get("/eligibility/:id", authenticateOptional, exam.eligibility);
router.get("/takingExam/:id", authenticateOptional, exam.getForExam);
router.get("/:id", authenticateOptional, exam.get);
// router.get("/", exam.getAll);
// router.put("/:id", exam.update);
// router.delete("/:id", exam.remove);

export default router;
