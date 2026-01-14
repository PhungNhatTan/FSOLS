import { Router } from "express";
import accountController from "../../controllers/account/index.js";
import authenticate from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import { avatarUpload } from "../../middleware/avatarUpload.js";

const router = Router();

const AUTHENTICATED_ROLES = ["Student", "Mentor", "Moderator", "Admin"];

router.post("/register", accountController.register);
router.post("/verify-email", accountController.verifyEmail);
router.post("/resend-email-otp", accountController.resendEmailOtp);

// Forgot password (OTP sent via email)
router.post("/forgot-password", accountController.requestPasswordReset);
router.post("/reset-password", accountController.resetPassword);

router.post("/login", accountController.authentication);

router.post(
  "/create-with-role",
  authenticate,
  authorize(["Admin"]),
  accountController.createAccountWithRole
);

router.get("/me", authenticate, authorize(AUTHENTICATED_ROLES), accountController.getMe);
router.patch("/me", authenticate, authorize(AUTHENTICATED_ROLES), accountController.updateMe);

router.post(
  "/me/avatar",
  authenticate,
  authorize(AUTHENTICATED_ROLES),
  avatarUpload,
  accountController.uploadAvatar
);

export default router;
