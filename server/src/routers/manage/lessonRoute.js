import lessonController from '../../controllers/lesson/index.js';
import express from 'express';
import authenticate from '../../middleware/auth.js';
import { authorize } from '../../middleware/role.js';

const router = express.Router();

router.post('/', authenticate, authorize(["Mentor"]), lessonController.create);
router.delete('/:id', authenticate, authorize(["Mentor"]), lessonController.remove);

export default router;