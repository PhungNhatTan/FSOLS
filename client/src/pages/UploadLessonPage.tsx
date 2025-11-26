import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lessonApi, type CreateLessonData } from "../api/lesson";
import { useAuth } from "../hooks/useAuth";

export default function UploadLessonPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    Title: "",
    LessonType: "Video" as "Video" | "Document",
    CourseModuleId: "",
    OrderNo: "10",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if user is mentor or admin
  const isAuthorized = user && (user.role === "Mentor" || user.role === "Admin");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type based on lesson type
      if (formData.LessonType === "Video") {
        const videoTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
        if (!videoTypes.includes(selectedFile.type)) {
          setError("Invalid video file. Please select MP4, WebM, OGG, or QuickTime file.");
          return;
        }
        if (selectedFile.size > 500 * 1024 * 1024) {
          setError("Video file is too large. Maximum size is 500MB.");
          return;
        }
      } else {
        const docTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!docTypes.includes(selectedFile.type)) {
          setError("Invalid document file. Please select PDF, DOC, or DOCX file.");
          return;
        }
        if (selectedFile.size > 50 * 1024 * 1024) {
          setError("Document file is too large. Maximum size is 50MB.");
          return;
        }
      }
      
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    if (!formData.Title.trim()) {
      setError("Please enter a lesson title");
      return;
    }

    setIsUploading(true);

    try {
      const uploadData: CreateLessonData = {
        Title: formData.Title.trim(),
        LessonType: formData.LessonType,
        file: file,
      };

      if (formData.CourseModuleId) {
        uploadData.CourseModuleId = parseInt(formData.CourseModuleId);
      }

      if (formData.OrderNo) {
        uploadData.OrderNo = parseInt(formData.OrderNo);
      }

      const lesson = await lessonApi.create(uploadData);
      setSuccess(`Lesson "${lesson.Title}" uploaded successfully!`);
      
      // Reset form
      setFormData({
        Title: "",
        LessonType: "Video",
        CourseModuleId: "",
        OrderNo: "10",
      });
      setFile(null);
      
      // Clear file input
      const fileInput = document.getElementById("file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Optionally navigate after a delay
      setTimeout(() => {
        navigate("/courses");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload lesson. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Access Denied</p>
          <p>You must be a Mentor or Admin to upload lessons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload New Lesson</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lesson Title */}
        <div>
          <label htmlFor="Title" className="block text-sm font-medium text-gray-700 mb-1">
            Lesson Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="Title"
            name="Title"
            value={formData.Title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter lesson title"
          />
        </div>

        {/* Lesson Type */}
        <div>
          <label htmlFor="LessonType" className="block text-sm font-medium text-gray-700 mb-1">
            Lesson Type <span className="text-red-500">*</span>
          </label>
          <select
            id="LessonType"
            name="LessonType"
            value={formData.LessonType}
            onChange={(e) => {
              handleInputChange(e);
              setFile(null); // Clear file when type changes
              const fileInput = document.getElementById("file") as HTMLInputElement;
              if (fileInput) fileInput.value = "";
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Video">Video</option>
            <option value="Document">Document (PDF/DOC/DOCX)</option>
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Upload File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleFileChange}
            required
            accept={
              formData.LessonType === "Video"
                ? "video/mp4,video/webm,video/ogg,video/quicktime"
                : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.LessonType === "Video"
              ? "Max size: 500MB. Supported: MP4, WebM, OGG, QuickTime"
              : "Max size: 50MB. Supported: PDF, DOC, DOCX"}
          </p>
        </div>

        {/* Course Module ID (Optional) */}
        <div>
          <label htmlFor="CourseModuleId" className="block text-sm font-medium text-gray-700 mb-1">
            Course Module ID (Optional)
          </label>
          <input
            type="number"
            id="CourseModuleId"
            name="CourseModuleId"
            value={formData.CourseModuleId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leave empty if not assigning to a module"
          />
        </div>

        {/* Order Number (Optional) */}
        <div>
          <label htmlFor="OrderNo" className="block text-sm font-medium text-gray-700 mb-1">
            Order Number (Optional)
          </label>
          <input
            type="number"
            id="OrderNo"
            name="OrderNo"
            value={formData.OrderNo}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Default: 10"
          />
          <p className="mt-1 text-xs text-gray-500">
            Use increments of 10 (10, 20, 30...) for easier reordering
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Upload Lesson"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

