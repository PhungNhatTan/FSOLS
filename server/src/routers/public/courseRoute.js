import { Router } from 'express';
import course from '../../controllers/course/index.js';

const router = Router();

// course
router.get('/featured', course.getFeatured);
router.get('/:id(\\d+)', course.get);
router.get('/', course.getAll);

export default router;
