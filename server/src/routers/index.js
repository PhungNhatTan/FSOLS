import { Router } from "express";
import accountRoutes from "./public/accountRoute.js";
import userCertificateRoutes from "./public/userCertificateRoute.js";

import courseRoutes from "./courseRoute.js";
import certificateRoute from "./certificateRoute.js";
import lessonRoute from "./lessonRoute.js";
import examRoute from "./examRoute.js";
import answerRoute from "./answerRoute.js";
import questionBankRoute from "./questionBankRoute.js";
import examQuestionRoute from "./examQuestionRoute.js";
import examSubmissionRoute from "./examSubmissionRoute.js";

const router = Router();

// public

router.use("/api/account", accountRoutes);
router.use("/api/userCertificate", userCertificateRoutes);

// old

router.use("/api/course", courseRoutes);
router.use("/api/lesson", lessonRoute);
router.use("/api/certificate", certificateRoute);
router.use("/api/exam", examRoute);
router.use("/api/answer", answerRoute);
router.use("/api/questionBank", questionBankRoute);
router.use("/api/examQuestion", examQuestionRoute);
router.use("/api/examSubmission", examSubmissionRoute);

// manage



// admin

export default router;