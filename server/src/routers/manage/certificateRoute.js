import { Router } from "express";
import certificateController from "../controllers/certificate/index.js";

const router = Router();

router.get("/:id", certificateController.get);

export default router;
