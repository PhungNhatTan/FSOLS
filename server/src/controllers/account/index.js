import authentication from "./authentication.js";
import register from "./createAccount.js";
import createAccountWithRole from "./createAccountWithRole.js";
import getAll from "./getAll.js";
import verifyEmail from "./verifyEmail.js";
import resendEmailOtp from "./resendEmailOtp.js";

export default {
  register,
  verifyEmail,
  resendEmailOtp,
  authentication,
  createAccountWithRole,
  getAll,
};
