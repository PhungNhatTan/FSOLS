import { Router } from 'express';
import lesson from '../controllers/lesson/index.js';
import { uploadLessonFile } from '../controllers/lesson/create.js';
import authenticate from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = Router();

// lesson
router.post(
  '/',
  authenticate,
  authorize(["Mentor", "Admin"]),
  uploadLessonFile,
  lesson.create
);
router.get('/:id', lesson.get);

export default router;