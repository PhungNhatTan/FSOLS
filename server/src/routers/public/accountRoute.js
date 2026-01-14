import { Router } from "express";
import accountController from "../../controllers/account/index.js";
import authenticate from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import { avatarUpload } from "../../middleware/avatarUpload.js";

const router = Router();

router.post("/register", accountController.register);
router.post("/verify-email", accountController.verifyEmail);
router.post("/resend-email-otp", accountController.resendEmailOtp);

router.post("/login", accountController.authentication);
router.post("/create-with-role", accountController.createAccountWithRole);

// Student profile (self)
router.get("/me", authenticate, authorize(["Student"]), accountController.getMe);
router.patch("/me", authenticate, authorize(["Student"]), accountController.updateMe);

// Avatar upload (Student self)
router.post(
  "/me/avatar",
  authenticate,
  authorize(["Student"]),
  avatarUpload,
  accountController.uploadAvatar
);

export default router;
