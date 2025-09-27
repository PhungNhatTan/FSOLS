import { Router } from "express";
import examAnswer from "../controllers/examAnswer/index.js";

const router=Router();

router.post("/", examAnswer.create);
router.put("/:id", examAnswer.update);
router.delete("/:id", examAnswer.remove);

export default router;
