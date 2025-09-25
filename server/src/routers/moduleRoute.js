import { Router } from "express";
import moduleController from "../controllers/module/index.js";

const router = Router();

router.post("/", moduleController.create);
// router.get("/:id", moduleController.get);
// router.get("/", moduleController.getAll);
// router.put("/:id", moduleController.update);
// router.delete("/:id", moduleController.remove);

export default router;
