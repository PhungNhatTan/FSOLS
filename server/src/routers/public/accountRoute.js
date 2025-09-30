import { Router } from "express";
import accountController from "../../controllers/account/index.js";

const router = Router();

router.post("/register", accountController.register);
router.post("/login", accountController.authentication);

export default router;