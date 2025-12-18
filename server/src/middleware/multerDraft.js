import multer from "multer";
import path from "path";
import fs from "fs";
import { draftUploadsDir } from "../config/uploadPath.js";

export const draftStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const courseId = req.params.courseId;
    const dir = path.join(draftUploadsDir, `course-${courseId}`);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "_");

    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${suffix}${ext}`);
  },
});

export const draftUpload = multer({
  storage: draftStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "video/mp4", "video/webm", "video/ogg", "video/quicktime",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg", "image/png", "image/gif",
      "application/zip", "application/x-zip-compressed",
      "text/plain",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});
