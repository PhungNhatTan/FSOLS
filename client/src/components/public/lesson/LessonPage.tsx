import { JSX, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import lesson from "../../../api/lesson";
import type { LessonDetail } from "../../../types";

// Constants
const OFFICE_VIEWER_EXTENSIONS = new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx"]);

// Types
interface MediaResource {
  type: "video" | "document" | "html" | "none";
  url: string | null;
  embedUrl?: string | null;
}

// Utilities
const getFileExtension = (url: string): string => {
  const clean = url.split(/[?#]/)[0];
  const idx = clean.lastIndexOf(".");
  if (idx === -1) return "";
  return clean.slice(idx + 1).toLowerCase();
};

const getDocumentEmbedUrl = (url: string): string => {
  const ext = getFileExtension(url);
  
  // PDFs can be embedded directly
  if (ext === "pdf") return url;
  
  // For Office files, check if we're in production or local
  if (OFFICE_VIEWER_EXTENSIONS.has(ext)) {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
      // In local environment, Office viewer won't work
      // Return original URL - will trigger download/native handling
      return url;
    }
    
    // In production with public URLs, use Office viewer
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  
  return url;
};

// Determine media type and URLs from lesson data
const getLessonMedia = (lessonData: LessonDetail): MediaResource => {
  const normalizedType = (lessonData.LessonType ?? "").toLowerCase();
  const isVideoLesson = normalizedType.includes("video");
  
  // Priority: ContentUrl > type-specific URL
  const resourceUrl = lessonData.ContentUrl ?? 
    (isVideoLesson ? lessonData.VideoUrl : lessonData.DocUrl);
  
  if (resourceUrl) {
    if (isVideoLesson) {
      return { type: "video", url: resourceUrl };
    } else {
      return {
        type: "document",
        url: resourceUrl,
        embedUrl: getDocumentEmbedUrl(resourceUrl)
      };
    }
  }
  
  if (lessonData.Content) {
    return { type: "html", url: null };
  }
  
  return { type: "none", url: null };
};

// ==============================================================
// LESSON MEDIA VIEWER COMPONENT
// Handles rendering of both video and document content
// ==============================================================

interface LessonMediaViewerProps {
  lessonData: LessonDetail;
}

function LessonMediaViewer({ lessonData }: LessonMediaViewerProps): JSX.Element {
  const media = useMemo(() => getLessonMedia(lessonData), [lessonData]);
  
  if (media.type === "video") {
    return (
      <div className="space-y-3">
        <video
          src={media.url!}
          controls
          controlsList="nodownload"
          className="w-full max-h-[70vh] rounded-lg bg-black"
          preload="metadata"
        />
        <a 
          href={media.url!} 
          target="_blank" 
          rel="noreferrer" 
          className="text-sm text-blue-600 hover:underline"
        >
          Open video in new tab
        </a>
      </div>
    );
  }
  
  if (media.type === "document") {
    const ext = getFileExtension(media.url!);
    const isPDF = ext === "pdf";
    const canEmbed = isPDF || !OFFICE_VIEWER_EXTENSIONS.has(ext);
    
    return (
      <div className="space-y-3">
        {canEmbed ? (
          <iframe
            src={media.embedUrl!}
            title="Lesson document"
            className="w-full h-[80vh] rounded-lg border"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="border rounded-lg p-8 text-center bg-gray-50">
            <p className="text-gray-600 mb-4">
              This document format requires downloading to view locally.
            </p>
            <a 
              href={media.url!}
              download
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download Document
            </a>
          </div>
        )}
        <a 
          href={media.url!} 
          target="_blank" 
          rel="noreferrer" 
          className="text-sm text-blue-600 hover:underline"
        >
          Open document in new tab
        </a>
      </div>
    );
  }
  
  if (media.type === "html") {
    return (
      <div 
        className="prose max-w-none" 
        dangerouslySetInnerHTML={{ __html: lessonData.Content! }} 
      />
    );
  }
  
  // media.type === "none" or any other case
  return (
    <p className="text-gray-500">Lesson content is not available.</p>
  );
}

// ==============================================================
// MAIN LESSON PAGE COMPONENT
// Handles data fetching and page layout
// ==============================================================

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

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (loading) {
    return <p className="text-gray-500 italic">Loading...</p>;
  }

  if (!lessonData) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/courses" className="text-blue-600 hover:underline mb-4 block">
        ← Back to Courses
      </Link>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{lessonData.Title}</h1>
          <p className="italic text-sm text-gray-500">
            Type: {lessonData.LessonType}
          </p>
        </div>
        
        <LessonMediaViewer lessonData={lessonData} />
      </div>
    </div>
  );
}