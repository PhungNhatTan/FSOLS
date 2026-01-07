import authentication from "./authentication.js"
import register from "./createAccount.js"
import createAccountWithRole from "./createAccountWithRole.js"
import getAll from "./getAll.js"

export default {
  register, // create
  authentication, // getToken
  createAccountWithRole,
  getAll,
}
