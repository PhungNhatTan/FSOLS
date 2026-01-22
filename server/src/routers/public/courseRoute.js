import { Router } from "express";
import course from "../../controllers/course/index.js";
import getCourseWithCertificate from "../../controllers/course/getCourseWithCertificate.js";
import authenticate from "../../middleware/auth.js";
import authenticateOptional from "../../middleware/authOptional.js";

const router = Router();

router.get("/featured", course.getFeatured);
router.get("/:id(\\d+)", course.get);
router.get("/", course.getAll);

// ✅ cần auth
router.get("/enrolled", authenticate, course.getEnrolled);

// ✅ optional auth: có token thì personalize, không có thì trả về gợi ý chung
router.get("/recommendations", authenticateOptional, course.getRecommendation);

router.get("/:courseId/:accountId", async (req, res) => {
  const { courseId, accountId } = req.params;
  try {
    const courseData = await getCourseWithCertificate(Number(courseId), accountId);
    res.status(200).json(courseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
