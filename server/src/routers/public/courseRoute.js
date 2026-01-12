import { Router } from 'express';
import course from '../../controllers/course/index.js';
import getCourseWithCertificate from '../../controllers/course/getCourseWithCertificate.js';

const router = Router();

// course
router.get('/featured', course.getFeatured);
router.get('/:id(\\d+)', course.get);
router.get('/', course.getAll);
router.get('/enrolled', course.getEnrolled);
router.get('/recommendations', course.getRecommendation);
router.get('/:courseId/:accountId', async (req, res) => {
  const { courseId, accountId } = req.params;

  try {
    const courseData = await getCourseWithCertificate(Number(courseId), accountId);
    res.status(200).json(courseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
