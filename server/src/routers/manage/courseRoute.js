import { Router } from 'express';
import course from '../../controllers/course/index.js';
import authenticate from '../../middleware/auth.js';
import { authorize } from '../../middleware/role.js';

const router = Router();

router.post('/', authenticate, authorize(["admin", "mentor"]), course.create);
router.put('/:id(\\d+)', authenticate, authorize(["admin", "mentor"]), course.update);
router.delete('/:id(\\d+)', authenticate, authorize(["admin", "mentor"]), course.remove);

export default router;

