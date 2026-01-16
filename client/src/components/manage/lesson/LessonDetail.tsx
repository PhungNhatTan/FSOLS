import { useState } from "react";
import { Btn } from "../ui/Btn";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import type { UiLessonLocal as Lesson, Resource } from "../../../types/manage";
import { courseManagementApi, type DraftResource } from "../../../api/courseManagement";
import { resolveUploadUrl } from "../../../utils/url";

interface ResourceUploadDialogProps {
  courseId: number;
  onResourceUploaded: (resource: DraftResource) => void;
  onClose: () => void;
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".avi", ".mkv"];

const inferResourceType = (resource: Resource): "image" | "video" | "pdf" | null => {
  const source = (resource.url || resource.name || "").toLowerCase().split("?")[0];
  if (IMAGE_EXTENSIONS.some((ext) => source.endsWith(ext))) return "image";
  if (VIDEO_EXTENSIONS.some((ext) => source.endsWith(ext))) return "video";
  if (source.endsWith(".pdf")) return "pdf";
  return null;
};

function ResourceUploadDialog({ 
  courseId, 
  onResourceUploaded, 
  onClose 
}: ResourceUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError("File is too large. Maximum size is 500MB.");
        return;
      }
      
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const resource = await courseManagementApi.uploadDraftResource(courseId, file);
      onResourceUploaded(resource);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload resource. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upload Resource</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={uploading}
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Max 500MB. Supported: Videos, PDFs, Documents, Images, ZIP
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LessonDetail({
    lesson,
    courseId,
    onUpdate,
    onClear,
}: {
    lesson: Lesson;
    courseId: number;
    onUpdate: (updates: Partial<Lesson>) => void;
    onClear: () => void;
}) {
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [title, setTitle] = useState(lesson.title);
    const [description, setDescription] = useState(lesson.description || "");
    // const [estimatedTime, setEstimatedTime] = useState(lesson.estimatedTimeMinutes?.toString() || "");
    const [previewResource, setPreviewResource] = useState<Resource | null>(null);
    const [previewType, setPreviewType] = useState<"image" | "video" | "pdf" | null>(null);
    const [previewError, setPreviewError] = useState(false);

    const handleSave = () => {
        // const trimmedEstimate = estimatedTime.trim();
        // const parsedEstimate = trimmedEstimate ? Number(trimmedEstimate) : null;
        // const sanitizedEstimate = parsedEstimate !== null && !Number.isNaN(parsedEstimate)
            // ? Math.max(0, Math.floor(parsedEstimate))
            // : null;

        onUpdate({
            title: title.trim() || lesson.title,
            description: description.trim(),
            // estimatedTimeMinutes: sanitizedEstimate,
        });
        // setEstimatedTime(sanitizedEstimate !== null ? sanitizedEstimate.toString() : "");
        setEditMode(false);
    };

    const handleResourceUploaded = (resource: DraftResource) => {
        const newResource = {
            id: Date.now(),
            name: resource.name,
            size: resource.size,
            url: resource.url,
        };
        
        onUpdate({
            resources: [...(lesson.resources || []), newResource],
        });
    };

    const handleRemoveResource = (resourceId: number) => {
        if (!confirm("Remove this resource from the lesson?")) return;
        
        onUpdate({
            resources: lesson.resources.filter((r) => r.id !== resourceId),
        });
    };

    const handleViewResource = (resource: Resource) => {
        if (!resource.url) return;
        const resolvedUrl = resolveUploadUrl(resource.url) ?? resource.url;
        const type = inferResourceType(resource);
        if (!type) {
            window.open(resolvedUrl, "_blank", "noopener,noreferrer");
            return;
        }
        setPreviewResource({ ...resource, url: resolvedUrl });
        setPreviewType(type);
        setPreviewError(false);
    };

    const closePreview = () => {
        setPreviewResource(null);
        setPreviewType(null);
        setPreviewError(false);
    };

    const renderPreviewContent = () => {
        if (!previewResource || !previewType || !previewResource.url || previewError) {
            return (
                <div className="space-y-3 text-sm text-slate-600">
                    <div>Preview unavailable. You can download the file instead.</div>
                    {previewResource?.url && (
                        <a
                            href={previewResource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 underline"
                        >
                            Download
                        </a>
                    )}
                </div>
            );
        }

        if (previewType === "image") {
            return (
                <img
                    src={previewResource.url}
                    alt={previewResource.name}
                    className="max-h-[70vh] w-full object-contain rounded-2xl border"
                    onError={() => setPreviewError(true)}
                />
            );
        }

        if (previewType === "video") {
            return (
                <video
                    src={previewResource.url}
                    controls
                    className="w-full max-h-[70vh] rounded-2xl bg-black"
                    onError={() => setPreviewError(true)}
                />
            );
        }

        return (
            <object
                data={previewResource.url}
                type="application/pdf"
                className="w-full h-[70vh]"
                onError={() => setPreviewError(true)}
            >
                <a
                    href={previewResource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline"
                >
                    Download PDF
                </a>
            </object>
        );
    };

    return (
        <>
            <Card
                title={`📖 ${lesson.title}`}
                action={
                    <div className="flex gap-2">
                        {!editMode && (
                            <Btn size="sm" variant="ghost" onClick={() => setEditMode(true)}>
                                Edit
                            </Btn>
                        )}
                        <Btn size="sm" onClick={onClear}>Clear</Btn>
                    </div>
                }
            >
                <div className="space-y-3">
                    {editMode ? (
                        <>
                            {/* Edit Mode */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    placeholder="Lesson title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    placeholder="Lesson description (optional)"
                                />
                            </div>
                            {/* <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Estimated Time (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    placeholder="e.g. 30"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Leave empty if not applicable.
                                </p>
                            </div> */}
                            <div className="flex gap-2 pt-2">
                                <Btn variant="primary" size="sm" onClick={handleSave}>
                                    Save Changes
                                </Btn>
                                <Btn variant="ghost" size="sm" onClick={() => {
                                    setEditMode(false);
                                    setTitle(lesson.title);
                                    setDescription(lesson.description || "");
                                    // setEstimatedTime(lesson.estimatedTimeMinutes?.toString() || "");
                                }}>
                                    Cancel
                                </Btn>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* View Mode */}
                            {lesson.description && (
                                <div>
                                    <div className="text-sm font-semibold text-slate-700">Description</div>
                                    <div className="text-sm text-slate-600 mt-1">{lesson.description}</div>
                                </div>
                            )}
                            {/* {lesson.estimatedTimeMinutes !== undefined && lesson.estimatedTimeMinutes !== null && (
                                <div>
                                    <div className="text-sm font-semibold text-slate-700">Estimated Time</div>
                                    <div className="text-sm text-slate-600 mt-1">{lesson.estimatedTimeMinutes} minutes</div>
                                </div>
                            )} */}
                        </>
                    )}

                    {/* Resources Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-slate-700">
                                Resources ({lesson.resources?.length || 0})
                            </div>
                            <Btn 
                                size="sm" 
                                variant="primary"
                                onClick={() => setShowUploadDialog(true)}
                            >
                                + Add
                            </Btn>
                        </div>
                        
                        {lesson.resources && lesson.resources.length > 0 ? (
                            <ul className="mt-2 space-y-2">
                                {lesson.resources.map((r) => {
                                    const previewable = Boolean(r.url && inferResourceType(r));
                                    return (
                                        <li key={r.id} className="rounded-xl border p-2 flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-800 truncate" title={r.name}>
                                                    {r.name}
                                                </div>
                                                {r.url && (
                                                    <a
                                                        className="text-xs text-indigo-600 hover:underline"
                                                        href={resolveUploadUrl(r.url) ?? r.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Open in new tab
                                                    </a>
                                                )}
                                                {r.size && (
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {(r.size / 1024 / 1024).toFixed(2)} MB
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Btn
                                                    size="sm"
                                                    onClick={() => handleViewResource(r)}
                                                    disabled={!r.url}
                                                >
                                                    {previewable ? "View" : "Download"}
                                                </Btn>
                                                <button
                                                    onClick={() => handleRemoveResource(r.id)}
                                                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                                                    title="Remove resource"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-xs text-slate-500 italic">
                                No resources yet. Click "+ Add" to upload.
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-500">Order: {lesson.order}</div>
                </div>
            </Card>

            {/* Upload Dialog */}
            {showUploadDialog && (
                <ResourceUploadDialog
                    courseId={courseId}
                    onResourceUploaded={handleResourceUploaded}
                    onClose={() => setShowUploadDialog(false)}
                />
            )}

            {previewResource && (
                <Modal title={`Preview: ${previewResource.name}`} onClose={closePreview}>
                    <div className="space-y-4">
                        {renderPreviewContent()}
                        {previewResource.url && (
                            <a
                                href={previewResource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                Download file
                            </a>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
}