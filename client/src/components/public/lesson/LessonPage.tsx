import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import lesson from "../../../api/lesson";
import type { LessonDetail } from "../../../types";

const OFFICE_VIEWER_EXTENSIONS = new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx"]);

const getFileExtension = (url: string): string => {
  const clean = url.split(/[?#]/)[0];
  const idx = clean.lastIndexOf(".");
  if (idx === -1) return "";
  return clean.slice(idx + 1).toLowerCase();
};

const getDocumentEmbedUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const ext = getFileExtension(url);
  if (ext === "pdf") return url;
  if (OFFICE_VIEWER_EXTENSIONS.has(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lessonData, setLessonData] = useState<LessonDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const normalizedId = id?.trim();
    if (!normalizedId) {
      setError("Lesson not found");
      setLoading(false);
      return;
    }

    lesson
      .getById(normalizedId)
      .then((data) => {
        setLessonData(data);
        setError("");
      })
      .catch(() => setError("Failed to load lesson"))
      .finally(() => setLoading(false));
  }, [id]);

  const normalizedType = (lessonData?.LessonType ?? "").toLowerCase();
  const isVideoLesson = normalizedType.includes("video");
  const resourceUrl = lessonData?.ContentUrl ?? (lessonData ? (isVideoLesson ? lessonData.VideoUrl : lessonData.DocUrl) : null);
  const documentFrameUrl = useMemo(() => {
    if (!resourceUrl) return "";
    return getDocumentEmbedUrl(resourceUrl) ?? resourceUrl;
  }, [resourceUrl]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (loading) return <p className="text-gray-500 italic">Loading...</p>;
  if (!lessonData) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/courses" className="text-blue-600 hover:underline mb-4 block">
        ← Back to Courses
      </Link>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{lessonData.Title}</h1>
          <p className="italic text-sm text-gray-500">Type: {lessonData.LessonType}</p>
        </div>

        {resourceUrl ? (
          isVideoLesson ? (
            <div className="space-y-3">
              <video
                src={resourceUrl}
                controls
                controlsList="nodownload"
                className="w-full max-h-[70vh] rounded-lg bg-black"
                preload="metadata"
              />
              <a href={resourceUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                Open video in new tab
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <iframe
                src={documentFrameUrl}
                title="Lesson document"
                className="w-full h-[80vh] rounded-lg border"
                allow="clipboard-read; clipboard-write"
              />
              <a href={resourceUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                Open document in new tab
              </a>
            </div>
          )
        ) : lessonData.Content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lessonData.Content }} />
        ) : (
          <p className="text-gray-500">Lesson content is not available.</p>
        )}
      </div>
    </div>
  );
}
