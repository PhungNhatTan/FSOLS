import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import progressController from '../../controllers/progress/index.js';

const router = Router();

router.get('/courses/:courseId', authenticate, progressController.getCourseProgress);

router.post('/lessons/:lessonId/complete', authenticate, progressController.markLessonComplete);

router.get('/courses/:courseId/completed', authenticate, progressController.checkCourseCompletion);

// Finalize course completion (updates enrollment + issues certificate when eligible)
router.post('/courses/:courseId/complete', authenticate, progressController.completeCourse);

router.get('/exams/:examId/completed', authenticate, progressController.checkExamCompletion);

export default router;
