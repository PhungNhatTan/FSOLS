// filepath: g:\FSOLS\server\src\config\fileUpload.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Define allowed file types
const ALLOWED_FILE_TYPES = {
  documents: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"],
  videos: ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/webm"],
};

const allAllowedMimes = [...ALLOWED_FILE_TYPES.documents, ...ALLOWED_FILE_TYPES.videos];

// Storage configuration
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${random}${ext}`);
  },
});

// File validation
const validateFile = (req, file, cb) => {
  if (!allAllowedMimes.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type"));
  }
  cb(null, true);
};

// Create upload middleware
export const createUploadMiddleware = (fieldName = "file", maxSizeMB = 100) => {
  return multer({
    storage: diskStorage,
    fileFilter: validateFile,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  }).single(fieldName);
};

export { uploadsDir, ALLOWED_FILE_TYPES };
