import multer from "multer";
import path from "path";
import fs from "fs";
import { productionUploadsDir } from "../config/uploadPath.js";
import { getTempUploadDir, isDriveEnabled } from "../services/googleDriveService.js";

export const avatarDir = path.join(productionUploadsDir, "avatars");

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    if (isDriveEnabled()) {
      cb(null, getTempUploadDir("avatars"));
    } else {
      cb(null, avatarDir);
    }
  },
  filename: (req, file, cb) => {
    const accountId = req.user?.accountId || req.user?.userId || "unknown";
    const ext = MIME_TO_EXT[file.mimetype] || path.extname(file.originalname) || ".bin";
    const safeExt = ext.toLowerCase();
    const ts = Date.now();
    const rnd = Math.round(Math.random() * 1e9);
    cb(null, `${accountId}-${ts}-${rnd}${safeExt}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
}).single("avatar");

export function buildAvatarUrl(filename) {
  // Served from Express static: /uploads -> baseUploadsDir
  return `/uploads/production/avatars/${filename}`;
}
