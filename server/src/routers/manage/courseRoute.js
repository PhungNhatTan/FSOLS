import { Router } from 'express';
import course from '../../controllers/course/index.js';
import authenticate from '../../middleware/auth.js';
import { authorize } from '../../middleware/role.js';

const router = Router();

router.post('/', authenticate, authorize(["Admin", "Mentor"]), course.create);
router.put('/:id(\\d+)', authenticate, authorize(["Admin", "Mentor"]), course.update);
router.delete('/:id(\\d+)', authenticate, authorize(["Admin", "Mentor"]), course.remove);

export default router;

