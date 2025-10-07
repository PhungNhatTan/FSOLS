import {Router} from "express";
import courseRoutes from "./courseRoute.js";

const routers=Router();

routers.use("/api/course", courseRoutes);

export default routers;