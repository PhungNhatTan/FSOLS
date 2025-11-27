// filepath: g:\FSOLS\server\src\routers\uploadRoute.js
import { Router } from "express";
import { createUploadMiddleware } from "../config/fileUpload.js";
import authenticate from "../middleware/auth.js";

const router = Router();

// Create middleware for single file upload
const uploadMiddleware = createUploadMiddleware("file", 100);

router.post("/", authenticate, uploadMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided" });
  }

  res.json({
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

export default router;