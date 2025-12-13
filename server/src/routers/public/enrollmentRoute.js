import { Router } from "express"
import enrollment from "../../controllers/enrollment/index.js"
import authenticate from "../../middleware/auth.js"

const router = Router()

// Get user's enrolled courses (requires auth)
router.get("/", authenticate, enrollment.getEnrolled)

// Get enrollment status for a specific course (requires auth)
router.get("/status/:courseId(\\d+)", authenticate, enrollment.getStatus)

// Enroll in a course (requires auth)
router.post("/:courseId(\\d+)", authenticate, enrollment.enroll)

// Unenroll from a course (requires auth)
router.delete("/:courseId(\\d+)", authenticate, enrollment.unenroll)

export default router
