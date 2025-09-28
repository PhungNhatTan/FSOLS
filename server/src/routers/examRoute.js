import { Router } from "express";
import exam from "../controllers/exam/index.js";

const router = Router();

router.post("/", exam.create);
router.get("/:id", exam.getForExam);
// router.get("/", exam.getAll);
// router.put("/:id", exam.update);
// router.delete("/:id", exam.remove);

export default router;
