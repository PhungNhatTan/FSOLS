import { Router } from 'express';
import course from '../../controllers/course/index.js';
import authenticate from '../../middleware/auth.js';
import { authorize } from '../../middleware/role.js';

const router = Router();

router.get('/', authenticate, authorize(["Admin", "Mentor", "Moderator"]), course.getByCreator);
router.get('/:id(\\d+)/draft', authenticate, authorize(["Admin", "Mentor", "Moderator"]), course.getDraft);
router.post('/', authenticate, authorize(["Admin", "Mentor"]), course.create);
router.put('/:id(\\d+)', authenticate, authorize(["Admin", "Mentor"]), course.update);
router.put('/:id(\\d+)/draft', authenticate, authorize(["Admin", "Mentor"]), course.saveDraft);
router.post('/:id(\\d+)/verification-request', authenticate, authorize(["Admin", "Mentor"]), course.requestVerification);
router.get('/:id(\\d+)/verification-status', authenticate, authorize(["Admin", "Mentor"]), course.getVerificationStatus);
router.delete('/:id(\\d+)', authenticate, authorize(["Admin", "Mentor"]), course.remove);

export default router;
