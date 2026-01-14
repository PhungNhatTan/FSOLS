import { Router } from "express";
import examSubmission from "../../controllers/examSubmission/index.js";
import { authorize } from "../../middleware/role.js";
import authenticate from "../../middleware/auth.js";

const router = Router();

router.get("/:id", authenticate, authorize(["Admin", "Mentor", "Student"]), examSubmission.getDetailedExamResult);
router.post("/submit", authenticate, authorize(["Student"]), examSubmission.submitExam);

export default router;
