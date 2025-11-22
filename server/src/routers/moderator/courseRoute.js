import { Router } from 'express';
import course from '../../controllers/course/index.js';
import authenticate from '../../middleware/auth.js';
import { authorize } from '../../middleware/role.js';

const router = Router();

router.put('/:id(\\d+)/verify', authenticate, authorize(["Moderator", "Admin"]), course.verifyCourse);

export default router;
