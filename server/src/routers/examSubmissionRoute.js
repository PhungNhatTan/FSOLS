import { Router } from "express";
import examSubmission from "../controllers/examSubmission/index.js";

const router = Router();

router.post("/submit", examSubmission.submitExam);

export default router;