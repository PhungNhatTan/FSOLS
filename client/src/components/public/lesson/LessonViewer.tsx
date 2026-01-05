import { useState, useEffect, useMemo } from "react";
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

interface LessonViewerProps {
  lessonId: string;
  onComplete?: () => void; // NEW: Callback when lesson is completed
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
  
  if (ext === "pdf") return url;
  
  if (OFFICE_VIEWER_EXTENSIONS.has(ext)) {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
      return url;
    }
    
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  
  return url;
};

// Video extensions
const VIDEO_EXTENSIONS = new Set([
  "mp4", "webm", "ogg", "mov", "avi", "mkv", "m4v", "3gp"
]);

// Document extensions
const DOCUMENT_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"
]);

const detectMediaType = (url: string): "video" | "document" | "unknown" => {
  const ext = getFileExtension(url);
  
  if (VIDEO_EXTENSIONS.has(ext)) {
    return "video";
  }
  
  if (DOCUMENT_EXTENSIONS.has(ext)) {
    return "document";
  }
  
  return "unknown";
};

const getLessonMedia = (lessonData: LessonDetail): MediaResource => {
  // Priority 1: Check LessonResources array (new approach - multiple resources)
  if (lessonData.LessonResources && lessonData.LessonResources.length > 0) {
    // Sort by OrderNo if available, otherwise use first resource
    const sortedResources = [...lessonData.LessonResources].sort((a, b) => {
      const orderA = a.OrderNo ?? 0;
      const orderB = b.OrderNo ?? 0;
      return orderA - orderB;
    });
    
    // Get the primary resource (first one)
    const primaryResource = sortedResources[0];
    
    if (primaryResource.Url) {
      const mediaType = detectMediaType(primaryResource.Url);
      
      if (mediaType === "video") {
        return { type: "video", url: primaryResource.Url };
      }
      
      if (mediaType === "document") {
        return {
          type: "document",
          url: primaryResource.Url,
          embedUrl: getDocumentEmbedUrl(primaryResource.Url)
        };
      }
    }
  }
  
  // Priority 2: Check single Resource object (transitional approach)
  if (lessonData.Resource && lessonData.Resource.Url) {
    const mediaType = detectMediaType(lessonData.Resource.Url);
    
    if (mediaType === "video") {
      return { type: "video", url: lessonData.Resource.Url };
    }
    
    if (mediaType === "document") {
      return {
        type: "document",
        url: lessonData.Resource.Url,
        embedUrl: getDocumentEmbedUrl(lessonData.Resource.Url)
      };
    }
  }
  
  // Legacy Priority 3: ContentUrl (if exists)
  if (lessonData.ContentUrl) {
    const mediaType = detectMediaType(lessonData.ContentUrl);
    
    if (mediaType === "video") {
      return { type: "video", url: lessonData.ContentUrl };
    }
    
    if (mediaType === "document") {
      return {
        type: "document",
        url: lessonData.ContentUrl,
        embedUrl: getDocumentEmbedUrl(lessonData.ContentUrl)
      };
    }
  }
  
  // Legacy Priority 4: Check VideoUrl (auto-detect it's a video)
  if (lessonData.VideoUrl) {
    return { type: "video", url: lessonData.VideoUrl };
  }
  
  // Legacy Priority 5: Check DocUrl (auto-detect if it's video or document)
  if (lessonData.DocUrl) {
    const mediaType = detectMediaType(lessonData.DocUrl);
    
    if (mediaType === "video") {
      return { type: "video", url: lessonData.DocUrl };
    }
    
    // Default to document for DocUrl
    return {
      type: "document",
      url: lessonData.DocUrl,
      embedUrl: getDocumentEmbedUrl(lessonData.DocUrl)
    };
  }
  
  // Priority 6: HTML content
  if (lessonData.Content) {
    return { type: "html", url: null };
  }
  
  return { type: "none", url: null };
};

// ==============================================================
// LESSON MEDIA VIEWER COMPONENT
// ==============================================================

interface LessonMediaViewerProps {
  lessonData: LessonDetail;
}

function LessonMediaViewer({ lessonData }: LessonMediaViewerProps) {
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
  
  return (
    <p className="text-gray-500">Lesson content is not available.</p>
  );
}

// ==============================================================
// MAIN LESSON VIEWER COMPONENT
// ==============================================================

export default function LessonViewer({ lessonId, onComplete }: LessonViewerProps) {
  const [lessonData, setLessonData] = useState<LessonDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) {
      setError("Lesson not found");
      setLoading(false);
      return;
    }

    lesson
      .getById(lessonId)
      .then((data) => {
        setLessonData(data);
        setError("");
      })
      .catch(() => setError("Failed to load lesson"))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (error) {
    return <p className="text-red-500 p-6">{error}</p>;
  }

  if (loading) {
    return <p className="text-gray-500 italic p-6">Loading...</p>;
  }

  if (!lessonData) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{lessonData.Title}</h1>
          <p className="italic text-sm text-gray-500">
            Type: {lessonData.LessonType}
          </p>
        </div>
        
        <LessonMediaViewer lessonData={lessonData} />

        {/* NEW: Complete button - only shown if onComplete callback is provided */}
        {onComplete && (
          <div className="pt-4 border-t">
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              ✓ Mark as Complete & Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}