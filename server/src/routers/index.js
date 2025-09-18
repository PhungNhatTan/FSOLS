import {router} from "express";
import courseRoutes from "./courseRoute";

const routers=router();

router.use("/api/course", courseRoutes);

export default routers;