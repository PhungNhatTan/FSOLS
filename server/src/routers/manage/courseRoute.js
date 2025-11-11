import { Router } from 'express';
import course from '../../controllers/course';
import authenticate from '../../middleware/auth';
import { authorize } from '../../middleware/role';

const router = Router();

router.post('/', authenticate, authorize["admin", "mentor"], course.create);
router.put('/:id(\\d+)', authenticate, authorize["admin", "mentor"], course.update);
router.delete('/:id(\\d+)', authenticate, authorize["admin", "mentor"], course.remove);

