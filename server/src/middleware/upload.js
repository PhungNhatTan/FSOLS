import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, "../../uploads");
const videosDir = path.join(uploadsDir, "videos");
const docsDir = path.join(uploadsDir, "documents");

[uploadsDir, videosDir, docsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for documents
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, docsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

// File filter for videos
const videoFilter = (req, file, cb) => {
  const allowedMimes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid video file type. Only MP4, WebM, OGG, and QuickTime are allowed."), false);
  }
};

// File filter for documents
const docFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid document file type. Only PDF, DOC, and DOCX are allowed."), false);
  }
};

// Create upload middleware
export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
});

export const uploadDocument = multer({
  storage: docStorage,
  fileFilter: docFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for documents
  },
});

// Helper to get file URL
export const getFileUrl = (filename, type) => {
  const folder = type === "Video" ? "videos" : "documents";
  return `/uploads/${folder}/${filename}`;
};

export { uploadsDir };
