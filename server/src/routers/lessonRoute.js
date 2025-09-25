import { Router } from 'express';
import lesson from '../controllers/lesson/index.js';

const router = Router();

// lesson
router.post('/', lesson.create);
router.get('/:id', lesson.get);

export default router;