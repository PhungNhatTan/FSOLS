import examQuestionController from "../../controllers/examQuestion/index.js";
import express from "express";
import authenticate from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";

const router = express.Router();

router.post("/", authenticate, authorize(["Admin", "Mentor"]), examQuestionController.create);
router.delete("/:id", authenticate, authorize(["Admin", "Mentor"]), examQuestionController.remove);

export default router;
