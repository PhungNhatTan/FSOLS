import express from "express";
import routes from "./routers/index.js";
import cors from "cors";
import { baseUploadsDir } from "./config/uploadPath.js";
import uploadsProxyRoute from "./routers/uploadsProxyRoute.js";
import { isDriveEnabled } from "./services/googleDriveService.js";

const app = express();

// CORS
// - In production, set CLIENT_URL to your deployed client origin (e.g. https://your-app.vercel.app)
//   or a comma-separated allowlist.
// - For media streaming (Range/206), we expose Content-Range/Accept-Ranges headers.
const clientAllowList = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser requests (no Origin) and, if no allowlist is configured, allow all.
      if (!origin) return cb(null, true);
      if (clientAllowList.length === 0) return cb(null, true);
      return cb(null, clientAllowList.includes(origin));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Range"],
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Type"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86400,
  })
);

app.use(express.json());

// Serve uploaded files (legacy local) and, when enabled, fall back to Google Drive streaming.
app.use(
  "/uploads",
  express.static(baseUploadsDir, {
    setHeaders: (res, path) => {
    // Set correct MIME types for video files
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (path.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    } else if (path.endsWith('.ogg') || path.endsWith('.ogv')) {
      res.setHeader('Content-Type', 'video/ogg');
    } else if (path.endsWith('.mov')) {
      res.setHeader('Content-Type', 'video/quicktime');
    }
    // Set correct MIME types for documents
    else if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (path.endsWith('.doc')) {
      res.setHeader('Content-Type', 'application/msword');
    } else if (path.endsWith('.docx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else if (path.endsWith('.ppt')) {
      res.setHeader('Content-Type', 'application/vnd.ms-powerpoint');
    } else if (path.endsWith('.pptx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    } else if (path.endsWith('.xls')) {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
    } else if (path.endsWith('.xlsx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
    // Set correct MIME types for images
    else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    
    // Set cache control for better performance
    res.setHeader('Cache-Control', 'public, max-age=31536000');

      // Additional header for ranges (videos) for some proxies.
      res.setHeader("Accept-Ranges", "bytes");
    },
  })
);

// When Drive is enabled, any /uploads/... misses from the filesystem are streamed from Drive.
if (isDriveEnabled()) {
  app.use("/uploads", uploadsProxyRoute);
}

app.use(routes);

// Error handler for upload errors
app.use((err, req, res, next) => {
  if (err.message === "Unsupported file type") {
    return res.status(400).json({ message: "File type not allowed" });
  }
  if (err.message.includes("File too large")) {
    return res.status(413).json({ message: "File size exceeds limit" });
  }
  next(err);
});

export default app;