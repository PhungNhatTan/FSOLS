import lessonController from '../../controllers/lesson/index.js';
import express from 'express';
import authenticate from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

const router = express.Router();

router.post('/', authenticate, authorize["mentor"], lessonController.create);
router.delete('/:id', authenticate, authorize["mentor"], lessonController.remove);

export default router;