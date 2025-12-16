import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// ============================================================================
// Configuration - Adjust paths to match your project structure
// ============================================================================

// Base upload directory - adjust if your uploads folder is elsewhere
const baseUploadsDir = path.join(__dirname, "../../../uploads");
const draftUploadsDir = path.join(baseUploadsDir, "draft");
const productionUploadsDir = path.join(baseUploadsDir, "production");

// Create directories if they don't exist
[draftUploadsDir, productionUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// ============================================================================
// Multer Configuration for Draft Uploads
// ============================================================================

const draftStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const courseId = req.params.courseId;
    const courseDraftDir = path.join(draftUploadsDir, `course-${courseId}`);
    
    // Create course-specific draft directory
    if (!fs.existsSync(courseDraftDir)) {
      fs.mkdirSync(courseDraftDir, { recursive: true });
      console.log(`📁 Created draft folder for course ${courseId}`);
    }
    
    cb(null, courseDraftDir);
  },
  
  filename: (req, file, cb) => {
    // Generate unique filename: original-name-timestamp-random.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
    
    const filename = `${sanitizedName}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter - allow videos, documents, images, archives
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Videos
    "video/mp4", "video/webm", "video/ogg", "video/quicktime",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Images
    "image/jpeg", "image/png", "image/gif",
    // Archives
    "application/zip",
    "application/x-zip-compressed",
    // Text
    "text/plain"
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: videos, PDFs, documents, images, ZIP files.`), false);
  }
};

// Configure multer
const draftUpload = multer({
  storage: draftStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

// ============================================================================
// ROUTE 1: Upload Resource to Draft Storage
// POST /api/manage/course/:courseId/draft/resource
// ============================================================================

router.post("/:courseId/draft/resource", draftUpload.single("file"), (req, res) => {
  try {
    console.log(`Upload request for course ${req.params.courseId}`);
    
    if (!req.file) {
      console.log("No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const courseId = req.params.courseId;
    
    // Build the URL path (relative to your server's public serving)
    const fileUrl = `/uploads/draft/course-${courseId}/${req.file.filename}`;
    
    // Generate unique draft resource ID
    const draftResourceId = `draft_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const draftResource = {
      id: draftResourceId,
      name: req.file.originalname,
      url: fileUrl,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
    };

    console.log(`File uploaded successfully:`, {
      name: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      path: req.file.path
    });

    res.json(draftResource);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload resource", details: error.message });
  }
});

// ============================================================================
// ROUTE 2: List All Draft Resources for a Course
// GET /api/manage/course/:courseId/draft/resources
// ============================================================================

router.get("/:courseId/draft/resources", (req, res) => {
  try {
    const courseId = req.params.courseId;
    const courseDraftDir = path.join(draftUploadsDir, `course-${courseId}`);

    console.log(`Listing resources for course ${courseId}`);

    if (!fs.existsSync(courseDraftDir)) {
      console.log("No draft folder found, returning empty array");
      return res.json([]);
    }

    const files = fs.readdirSync(courseDraftDir);
    
    const resources = files.map((filename) => {
      const filePath = path.join(courseDraftDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        id: `draft_${filename}`,
        name: filename,
        url: `/uploads/draft/course-${courseId}/${filename}`,
        size: stats.size,
        type: getMimeType(filename),
        uploadedAt: stats.birthtime.toISOString(),
      };
    });

    console.log(`Found ${resources.length} draft resources`);
    res.json(resources);
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({ error: "Failed to list resources", details: error.message });
  }
});

// ============================================================================
// ROUTE 3: Delete a Draft Resource
// DELETE /api/manage/course/:courseId/draft/resource/:resourceId
// ============================================================================

router.delete("/:courseId/draft/resource/:resourceId", (req, res) => {
  try {
    const { courseId, resourceId } = req.params;
    const courseDraftDir = path.join(draftUploadsDir, `course-${courseId}`);

    console.log(`🗑️  Delete request: course ${courseId}, resource ${resourceId}`);

    // Extract filename from resourceId (format: "draft_filename" or just "filename")
    const filename = resourceId.replace("draft_", "");
    const filePath = path.join(courseDraftDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${filename}`);
      res.json({ success: true, message: "Resource deleted" });
    } else {
      console.log(`File not found: ${filename}`);
      res.status(404).json({ error: "Resource not found" });
    }
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete resource", details: error.message });
  }
});

// ============================================================================
// ROUTE 4: Approve Verification - Move Draft Resources to Production
// POST /api/manage/course/:courseId/verification-approve
// ============================================================================

router.post("/:courseId/verification-approve", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const courseDraftDir = path.join(draftUploadsDir, `course-${courseId}`);
    const courseProductionDir = path.join(productionUploadsDir, `course-${courseId}`);

    console.log(`✅ Approval: Moving resources for course ${courseId}`);

    // Create production directory if it doesn't exist
    if (!fs.existsSync(courseProductionDir)) {
      fs.mkdirSync(courseProductionDir, { recursive: true });
    }

    const movedFiles = [];

    // Move all draft files to production
    if (fs.existsSync(courseDraftDir)) {
      const files = fs.readdirSync(courseDraftDir);
      
      for (const filename of files) {
        const sourcePath = path.join(courseDraftDir, filename);
        const destPath = path.join(courseProductionDir, filename);
        
        // Copy file to production
        fs.copyFileSync(sourcePath, destPath);
        
        movedFiles.push({
          name: filename,
          draftUrl: `/uploads/draft/course-${courseId}/${filename}`,
          productionUrl: `/uploads/production/course-${courseId}/${filename}`,
        });
        
        console.log(`Moved: ${filename}`);
      }

      // Clean up draft directory after successful move
      fs.rmSync(courseDraftDir, { recursive: true, force: true });
      console.log(`Cleaned up draft folder`);
    }

    console.log(`Successfully moved ${movedFiles.length} files to production`);
    
    res.json({ 
      success: true, 
      message: "Draft resources moved to production",
      movedFiles 
    });
  } catch (error) {
    console.error("Approval error:", error);
    res.status(500).json({ error: "Failed to approve verification", details: error.message });
  }
});

// ============================================================================
// ROUTE 5: Reject Verification - Clean Up Draft Resources
// POST /api/manage/course/:courseId/verification-reject
// ============================================================================

router.post("/:courseId/verification-reject", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const courseDraftDir = path.join(draftUploadsDir, `course-${courseId}`);

    console.log(`Rejection: Cleaning up resources for course ${courseId}`);

    // Delete all draft resources
    if (fs.existsSync(courseDraftDir)) {
      const files = fs.readdirSync(courseDraftDir);
      fs.rmSync(courseDraftDir, { recursive: true, force: true });
      console.log(`Deleted ${files.length} draft resources`);
    }

    res.json({ 
      success: true, 
      message: "Draft resources cleaned up" 
    });
  } catch (error) {
    console.error("Rejection error:", error);
    res.status(500).json({ error: "Failed to reject verification", details: error.message });
  }
});

// ============================================================================
// Helper Function: Get MIME Type from Filename
// ============================================================================

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    // Videos
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    // Documents
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Images
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    // Archives
    ".zip": "application/zip",
    // Text
    ".txt": "text/plain",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// ============================================================================
// Error Handling Middleware for Multer Errors
// ============================================================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ 
        error: "File too large. Maximum size is 500MB." 
      });
    }
    return res.status(400).json({ 
      error: "File upload error", 
      details: error.message 
    });
  }
  
  if (error) {
    return res.status(400).json({ 
      error: error.message 
    });
  }
  
  next();
});

export default router;