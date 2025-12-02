import { Router } from 'express';
import category from '../../controllers/category/index.js';

const router = Router();

router.get('/', category.getAll);

export default router;
