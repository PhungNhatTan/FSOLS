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

const AUTHENTICATED_ROLES = ["Student", "Mentor", "Moderator", "Admin"];

// Profile (self) - available to any authenticated role
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
