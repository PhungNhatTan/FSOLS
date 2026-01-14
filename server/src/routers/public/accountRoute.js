import { Router } from "express";
import accountController from "../../controllers/account/index.js";

const router = Router();

router.post("/register", accountController.register);
router.post("/verify-email", accountController.verifyEmail);
router.post("/resend-email-otp", accountController.resendEmailOtp);

router.post("/login", accountController.authentication);
router.post("/create-with-role", accountController.createAccountWithRole);

export default router;
