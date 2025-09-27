import { Router } from "express";
import questionBank from "../models/questionBank";

const router=Router();

router.get("/:id", questionBank.get);
router.get("/course/:id", questionBank.getByCourse);
router.get("/lesson/:id", questionBank.getByLesson);

export default router;
