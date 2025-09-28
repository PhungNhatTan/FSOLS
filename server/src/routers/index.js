import { Router } from "express";
import courseRoutes from "./courseRoute";
import certificateRoute from "./certificateRoute";
import lessonRoute from "./lessonRoute";
import examRoute from "./examRoute";
import answerRoute from "./answerRoute";
import questionBankRoute from "./questionBankRoute";
import examQuestionRoute from "./examQuestionRoute";

const router = Router();

router.use("/api/course", courseRoutes);
router.use("/api/lesson", lessonRoute);
router.use("/api/certificate", certificateRoute);
router.use("/api/exam", examRoute);
router.use("/api/answer", answerRoute);
router.use("/api/questionBank", questionBankRoute);
router.use("/api/examQuestion", examQuestionRoute);

// manage

// admin

export default router;