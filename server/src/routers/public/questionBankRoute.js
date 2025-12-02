import { Router } from "express";
import questionBank from "../../controllers/questionBank/index.js";

const router=Router();

router.get("/course/:id", questionBank.getByCourse);
router.get("/lesson/:id", questionBank.getByLesson);
router.get("/:id", questionBank.get);

export default router;
