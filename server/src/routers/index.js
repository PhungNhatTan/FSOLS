import { router } from "express";
import courseRoutes from "./courseRoute";
import certificateRoute from "./certificateRoute";
import lessonRoute from "./lessonRoute";
import examRoute from "./examRoute";
import answerRoute from "./answerRoute";
import questionBank from "./questionBankRoute";

const routers = router();

router.use("/api/course", courseRoutes);
router.use("/api/lesson", lessonRoute);
router.use("/api/certificate", certificateRoute);
router.use("/api/exam", examRoute);
router.use("/api/answer", answerRoute);
router.use("/api/questionBank", questionBank)

export default routers;