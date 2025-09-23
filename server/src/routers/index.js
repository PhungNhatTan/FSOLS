import { router } from "express";
import courseRoutes from "./courseRoute";
import certificateRoute from "./certificateRoute";
import lessonRoute from "./lessonRoute";

const routers = router();

router.use("/api/course", courseRoutes);
router.use("/api/lesson", lessonRoute);
router.use("/api/certificate", certificateRoute);

export default routers;