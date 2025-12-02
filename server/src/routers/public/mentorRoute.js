import { Router } from 'express';
import mentor from '../../controllers/mentor/index.js';

const router = Router();

router.get('/', mentor.getAll);

export default router;
