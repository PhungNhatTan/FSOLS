import express from "express";
import routes from "./routers/index.js";
import cors from "cors";
import { baseUploadsDir } from "./config/uploadPath.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Serve uploaded files with correct MIME types
app.use("/uploads", express.static(uploadsDir, {
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
  }
}));

app.use(
  "/uploads",
  express.static(baseUploadsDir, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000");
    },
  })
);

console.log("📁 Upload root:", baseUploadsDir);

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