// filepath: g:\FSOLS\server\src\routers\uploadRoute.js
import { Router } from "express";
import { uploadVideo, uploadDocument, getFileUrl } from "../middleware/upload.js";
import authenticate from "../middleware/auth.js";

const router = Router();

// Dynamic upload middleware based on file type in request body
const uploadMiddleware = (req, res, next) => {
  const fileType = req.body?.fileType || "document"; // default to document
  
  if (fileType === "video") {
    return uploadVideo.single("file")(req, res, next);
  } else {
    return uploadDocument.single("file")(req, res, next);
  }
};

router.post("/", authenticate, uploadMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided" });
  }

  const fileType = req.body?.fileType || "document";
  const fileUrl = getFileUrl(req.file.filename, fileType === "video" ? "Video" : "Document");

  res.json({
    filename: req.file.filename,
    path: fileUrl,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

export default router;
