import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import progressController from '../../controllers/progress/index.js';

const router = Router();

router.get('/courses/:courseId', authenticate, progressController.getCourseProgress);

router.post('/lessons/:lessonId/complete', authenticate, progressController.markLessonComplete);

router.get('/courses/:courseId/completed', authenticate, progressController.checkCourseCompletion);

router.get('/exams/:examId/completed', authenticate, progressController.checkExamCompletion);

export default router;
