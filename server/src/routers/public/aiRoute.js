import { Router } from "express";
import authenticate from "../../middleware/auth.js";
import chat from "../../controllers/ai/chat.js";

const router = Router();

// AI chat (requires login)
router.post("/chat", authenticate, chat);

export default router;
