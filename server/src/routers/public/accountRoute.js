import { Router } from "express"
import accountController from "../../controllers/account/index.js"
import authenticate from "../../middleware/auth.js"

const router = Router()

router.post("/register", accountController.register)
router.post("/login", accountController.authentication)
router.post("/create-with-role", accountController.createAccountWithRole)
router.get("/all", authenticate, accountController.getAll)

export default router
