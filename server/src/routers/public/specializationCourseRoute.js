import { Router } from "express";
import specializationCourseController from "../../controllers/specializationCourse/index.js";

const router = Router();

router.get("/nav/:id", specializationCourseController.getNav);

export default router;
