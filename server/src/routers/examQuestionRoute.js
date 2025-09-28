import { Router } from "express";
import examQuestion from "../controllers/examQuestion/index.js";

const router = Router();

router.get("/Exam/:id", examQuestion.getForExam);

export default router;
