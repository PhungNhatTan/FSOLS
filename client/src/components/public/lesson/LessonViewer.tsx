import { useState, useEffect, useMemo } from "react";
import lesson from "../../../api/lesson";
import type { LessonDetail } from "../../../types";
import { resolveUploadUrl } from "../../../utils/url";

// Constants
const OFFICE_VIEWER_EXTENSIONS = new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx"]);

// Types
interface MediaResource {
  type: "video" | "document" | "html" | "none";
  url: string | null;
  embedUrl?: string | null;
  nameHint?: string | null;
}

interface LessonViewerProps {
  lessonId: string;
  onComplete?: () => void; // Callback when lesson is completed
}

// Utilities
const getFileExtension = (value: string): string => {
  const clean = value.split(/[?#]/)[0];
  const idx = clean.lastIndexOf(".");
  if (idx === -1) return "";
  return clean.slice(idx + 1).toLowerCase();
};

const isLocalHost = () => {
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
};

// Video extensions
const VIDEO_EXTENSIONS = new Set([
  "mp4", "webm", "ogg", "mov", "avi", "mkv", "m4v", "3gp",
]);

// Document extensions
const DOCUMENT_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
]);

const getExtension = (url: string, nameHint?: string | null): string =>
  getFileExtension(url) || (nameHint ? getFileExtension(nameHint) : "");

const detectMediaType = (
  url: string,
  nameHint?: string | null,
  lessonTypeHint?: string | null
): "video" | "document" | "unknown" => {
  const ext = getExtension(url, nameHint);
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (DOCUMENT_EXTENSIONS.has(ext)) return "document";

  // Critical fallback: Drive URLs often have no extension.
  // Use LessonType when available.
  const lt = (lessonTypeHint ?? "").toLowerCase();
  if (lt.includes("video")) return "video";
  if (lt.includes("document") || lt.includes("doc")) return "document";

  return "unknown";
};

const getDocumentEmbedUrl = (url: string, nameHint?: string | null): string => {
  const ext = getExtension(url, nameHint);

  // PDFs can be embedded directly
  if (ext === "pdf") return url;

  // Office files: use Office Online viewer when not local
  if (OFFICE_VIEWER_EXTENSIONS.has(ext)) {
    if (isLocalHost()) return url;
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }

  return url;
};

const getLessonMedia = (lessonData: LessonDetail): MediaResource => {
  const resolveUrl = (url: string) => resolveUploadUrl(url) ?? url;

  // Priority 1: LessonResources array (when the API returns multiple resources)
  if (lessonData.LessonResources && lessonData.LessonResources.length > 0) {
    const sortedResources = [...lessonData.LessonResources].sort((a, b) => {
      const orderA = a.OrderNo ?? 0;
      const orderB = b.OrderNo ?? 0;
      return orderA - orderB;
    });

    const primaryResource = sortedResources[0];
    const nameHint = primaryResource?.Name ?? null;

    if (primaryResource?.Url) {
      const url = resolveUrl(primaryResource.Url);
      const mediaType = detectMediaType(url, nameHint, lessonData.LessonType);

      if (mediaType === "video") {
        return { type: "video", url, nameHint };
      }

      if (mediaType === "document") {
        return {
          type: "document",
          url,
          nameHint,
          embedUrl: getDocumentEmbedUrl(url, nameHint),
        };
      }
    }
  }

  // Priority 2: single Resource object (this is what your public /lesson/:id returns today)
  if (lessonData.Resource?.Url) {
    const nameHint = lessonData.Resource?.Name ?? null;
    const url = resolveUrl(lessonData.Resource.Url);
    const mediaType = detectMediaType(url, nameHint, lessonData.LessonType);

    if (mediaType === "video") {
      return { type: "video", url, nameHint };
    }

    if (mediaType === "document") {
      return {
        type: "document",
        url,
        nameHint,
        embedUrl: getDocumentEmbedUrl(url, nameHint),
      };
    }
  }

  // Priority 3: ContentUrl (legacy/compat)
  if (lessonData.ContentUrl) {
    const nameHint = lessonData.Resource?.Name ?? null;
    const url = resolveUrl(lessonData.ContentUrl);
    const mediaType = detectMediaType(url, nameHint, lessonData.LessonType);

    if (mediaType === "video") {
      return { type: "video", url, nameHint };
    }

    if (mediaType === "document") {
      return {
        type: "document",
        url,
        nameHint,
        embedUrl: getDocumentEmbedUrl(url, nameHint),
      };
    }
  }

  // Priority 4: deprecated fields
  if (lessonData.VideoUrl) {
    const url = resolveUrl(lessonData.VideoUrl);
    return { type: "video", url };
  }

  if (lessonData.DocUrl) {
    const url = resolveUrl(lessonData.DocUrl);
    // Default to document for DocUrl
    return {
      type: "document",
      url,
      embedUrl: getDocumentEmbedUrl(url),
    };
  }

  // Priority 5: HTML content
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
    const ext = getExtension(media.url!, media.nameHint);
    const isOffice = OFFICE_VIEWER_EXTENSIONS.has(ext);
    const canEmbed = !isOffice || !isLocalHost();

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

  return <p className="text-gray-500">Lesson content is not available.</p>;
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
