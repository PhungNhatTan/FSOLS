import { router } from "express";
import courseRoutes from "./courseRoute";
import certificateRoute from "./certificateRoute";
import lessonRoute from "./lessonRoute";
import examRoute from "./examRoute";

const routers = router();

router.use("/api/course", courseRoutes);
router.use("/api/lesson", lessonRoute);
router.use("/api/certificate", certificateRoute);
router.use("/api/exam",examRoute);

export default routers;