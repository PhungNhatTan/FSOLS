import examQuestionController from "../../controllers/examQuestion/index.js";
import express from "express";

const router = express.Router();

router.post("/", examQuestionController.create);

export default router;