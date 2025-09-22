import { Router } from 'express';
import course from '../controllers/course/index.js';
import lesson from '../controllers/lesson/index.js';

const router = Router();

// course
router.get('/:id(\\d+)', course.get);
router.get('/', course.getAll);
router.post('/', course.create);
router.put('/:id(\\d+)', course.update);
router.delete('/:id(\\d+)', course.remove);

// lesson
router.get('/:id', lesson.get);

export default router;
