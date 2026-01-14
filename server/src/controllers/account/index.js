import authentication from "./authentication.js";
import register from "./createAccount.js";
import createAccountWithRole from "./createAccountWithRole.js";
import getAll from "./getAll.js";
import verifyEmail from "./verifyEmail.js";
import resendEmailOtp from "./resendEmailOtp.js";
import getMe from "./getMe.js";
import updateMe from "./updateMe.js";
import uploadAvatar from "./uploadAvatar.js";

export default {
  register,
  verifyEmail,
  resendEmailOtp,
  authentication,
  createAccountWithRole,
  getAll,
  getMe,
  updateMe,
  uploadAvatar,
};
