import lessonModel from "../../models/lesson/index.js";
import { uploadVideo, uploadDocument, getFileUrl } from "../../middleware/upload.js";

// Middleware to handle file upload based on lesson type
export const uploadLessonFile = async (req, res, next) => {
  const lessonType = req.body?.LessonType;
  
  if (!lessonType) {
    return res.status(400).json({ message: "LessonType is required in form data" });
  }

  if (lessonType === "Video") {
    return uploadVideo.single("file")(req, res, next);
  } else if (lessonType === "Document") {
    return uploadDocument.single("file")(req, res, next);
  } else {
    return res.status(400).json({ message: "Invalid LessonType. Must be 'Video' or 'Document'" });
  }
};

export default async function createLesson(req, res, next) {
  try {
    const { Title, LessonType, CourseModuleId, OrderNo } = req.body;
    
    // Validate required fields
    if (!Title || !LessonType) {
      return res.status(400).json({ 
        message: "Title and LessonType are required" 
      });
    }

    if (LessonType !== "Video" && LessonType !== "Document") {
      return res.status(400).json({ 
        message: "LessonType must be 'Video' or 'Document'" 
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        message: "File is required" 
      });
    }

    // Build lesson data
    const lessonData = {
      Title,
      LessonType,
      CourseModuleId: CourseModuleId ? parseInt(CourseModuleId) : undefined,
      OrderNo: OrderNo ? parseInt(OrderNo) : 10,
    };

    // Add file URL based on type
    if (LessonType === "Video") {
      lessonData.VideoUrl = getFileUrl(req.file.filename, "Video");
    } else if (LessonType === "Document") {
      lessonData.DocUrl = getFileUrl(req.file.filename, "Document");
    }

    const lesson = await lessonModel.create(lessonData);
    res.status(201).json(lesson);
  } catch (err) {
    console.error("Error creating lesson:", err);
    next(err);
  }
}
