import { useEffect, useMemo, useState } from "react";
import lesson from "../../../api/lesson";
import type { LessonDetail } from "../../../types";
import { resolveUploadUrl } from "../../../utils/url";

// NOTE:
// - This viewer must NOT use legacy CourseLesson fields (LessonType/VideoUrl/DocUrl/ContentUrl).
// - All rendering decisions must come from LessonResource (name/url) and, when needed, Content-Type sniffing.

const OFFICE_VIEWER_EXTENSIONS = new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx"]);

type MediaKind = "video" | "document" | "html" | "none";

interface MediaResource {
  kind: MediaKind;
  url: string | null;
  nameHint?: string | null;
  embedUrl?: string | null;
}

interface LessonViewerProps {
  lessonId: string;
  onComplete?: () => void;
}
type LooseLessonResource = {
  Url?: string | null;
  Name?: string | null;
  OrderNo?: number | null;
  // tolerate camel/lower variants defensively
  url?: string | null;
  name?: string | null;
  orderNo?: number | null;
};

type LessonDataForViewer = LessonDetail &
  Partial<{
    LessonResources: LooseLessonResource[] | null;
    lessonResources: LooseLessonResource[] | null;
    Resource: LooseLessonResource | null;
    resource: LooseLessonResource | null;
    Content: string | null;
    content: string | null;
    Title: string;
    title: string;
  }>;

const asStringOrNull = (v: unknown): string | null => (typeof v === "string" ? v : null);
const asNumberOrNull = (v: unknown): number | null => (typeof v === "number" ? v : null);

const normalizeResource = (r: LooseLessonResource): { name: string | null; url: string | null; orderNo: number | null } => {
  const name = asStringOrNull(r.Name ?? r.name);
  const url = asStringOrNull(r.Url ?? r.url);
  const orderNo = asNumberOrNull(r.OrderNo ?? r.orderNo);
  return { name, url, orderNo };
};

// Content-Disposition filename parser
const parseFilenameFromContentDisposition = (cd: string | null): string => {
  if (!cd) return "";

  // RFC 5987: filename*=UTF-8''...
  const mStar = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(cd);
  if (mStar?.[1]) {
    const raw = mStar[1].trim().replace(/^"|"$/g, "");
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  // filename="..."
  const m = /filename\s*=\s*"?([^";]+)"?/i.exec(cd);
  return m?.[1]?.trim() ?? "";
};

const inferKindFromHeaders = (
  contentType: string | null,
  contentDisposition: string | null
): "video" | "document" | "unknown" => {
  const filename = parseFilenameFromContentDisposition(contentDisposition);
  if (filename) {
    const byName = inferKindFromExtension(filename);
    if (byName !== "unknown") return byName;
  }
  return inferKindFromContentType(contentType);
};

const isLocalHost = () => {
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
};

const stripQueryHash = (value: string) => value.split(/[?#]/)[0];

const getFileExtension = (value: string): string => {
  const clean = stripQueryHash(value);
  const idx = clean.lastIndexOf(".");
  if (idx === -1) return "";
  return clean.slice(idx + 1).toLowerCase();
};

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "ogg",
  "mov",
  "avi",
  "mkv",
  "m4v",
  "3gp",
]);

const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
]);

const getExtension = (url: string, nameHint?: string | null): string =>
  (nameHint ? getFileExtension(nameHint) : "") || getFileExtension(url);

const inferKindFromExtension = (
  url: string,
  nameHint?: string | null
): Exclude<MediaKind, "html" | "none"> | "unknown" => {
  const ext = getExtension(url, nameHint);
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (DOCUMENT_EXTENSIONS.has(ext)) return "document";
  return "unknown";
};

const inferKindFromContentType = (contentType: string | null): "video" | "document" | "unknown" => {
  if (!contentType) return "unknown";
  const ct = contentType.toLowerCase();
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("application/pdf")) return "document";
  if (ct.includes("msword")) return "document";
  if (ct.includes("officedocument")) return "document";
  if (ct.includes("presentation")) return "document";
  if (ct.includes("spreadsheet")) return "document";
  return "unknown";
};

const getDocumentEmbedUrl = (url: string, nameHint?: string | null): string => {
  const ext = getExtension(url, nameHint);

  // PDFs can be embedded directly.
  if (ext === "pdf") return url;

  // Office files: use Office Online viewer when not local.
  // This also works for Drive-proxy URLs that don't have an extension,
  // as long as the server sets a correct Content-Type / Content-Disposition.
  if (OFFICE_VIEWER_EXTENSIONS.has(ext)) {
    if (isLocalHost()) return url;
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }

  return url;
};

function pickPrimaryResource(lessonData: LessonDataForViewer): { name?: string | null; url?: string | null } | null {
  const list =
    (lessonData.LessonResources) ?? [];

  if (Array.isArray(list) && list.length > 0) {
    const normalized = list.map(normalizeResource).filter((r) => !!r.url);

    if (normalized.length > 0) {
      const sorted = [...normalized].sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));
      return { name: sorted[0].name, url: sorted[0].url };
    }
  }

  const res = lessonData.Resource ?? lessonData.resource;
  if (res) {
    const n = normalizeResource(res);
    if (n.url) return { name: n.name, url: n.url };
  }

  return null;
}


const getLessonMedia = (lessonData: LessonDetail): MediaResource => {
  // Priority 1: lesson resources
  const primary = pickPrimaryResource(lessonData);
  if (primary?.url) {
    const url = resolveUploadUrl(primary.url) ?? primary.url;
    const nameHint = primary.name ?? null;
    const kind = inferKindFromExtension(url, nameHint);

    if (kind === "video") return { kind: "video", url, nameHint };
    if (kind === "document") {
      return { kind: "document", url, nameHint, embedUrl: getDocumentEmbedUrl(url, nameHint) };
    }

    // Unknown by extension: we will sniff Content-Type in the viewer and decide.
    return { kind: "document", url, nameHint, embedUrl: getDocumentEmbedUrl(url, nameHint) };
  }

  // Priority 2: HTML content
  const html = (lessonData as LessonDataForViewer).Content ?? (lessonData as LessonDataForViewer).content;
  if (typeof html === "string" && html.trim().length > 0) {
    return { kind: "html", url: null };
  }


  return { kind: "none", url: null };
};

function LessonMediaViewer({ lessonData }: { lessonData: LessonDetail }) {
  const baseMedia = useMemo(() => getLessonMedia(lessonData), [lessonData]);
  const [sniffedKind, setSniffedKind] = useState<"video" | "document" | "unknown" | null>(null);

  // If extension-based inference was ambiguous (common when using Drive file IDs in URLs),
  // sniff Content-Type to avoid rendering a document in a <video> tag.
  useEffect(() => {
    let cancelled = false;

    async function sniff() {
      if (!baseMedia.url) return;

      // If we already know (video extension), no need to sniff.
      const kindByExt = inferKindFromExtension(baseMedia.url, baseMedia.nameHint);
      if (kindByExt !== "unknown") {
        setSniffedKind(null);
        return;
      }

      try {
        const resp = await fetch(baseMedia.url, { method: "HEAD" });
        const ct = resp.headers.get("content-type");
        const cd = resp.headers.get("content-disposition");
        const inferred = inferKindFromHeaders(ct, cd);
        if (!cancelled) setSniffedKind(inferred);
      } catch {
        if (!cancelled) setSniffedKind("unknown");
      }
    }

    void sniff();

    return () => {
      cancelled = true;
    };
  }, [baseMedia.url, baseMedia.nameHint]);

  const media: MediaResource = useMemo(() => {
    if (!baseMedia.url) return baseMedia;
    if (!sniffedKind || sniffedKind === "unknown") return baseMedia;

    if (sniffedKind === "video") return { kind: "video", url: baseMedia.url, nameHint: baseMedia.nameHint };
    return {
      kind: "document",
      url: baseMedia.url,
      nameHint: baseMedia.nameHint,
      embedUrl: getDocumentEmbedUrl(baseMedia.url, baseMedia.nameHint),
    };
  }, [baseMedia, sniffedKind]);

  if (media.kind === "video") {
    return (
      <div className="space-y-3">
        <video
          src={media.url!}
          controls
          controlsList="nodownload"
          className="w-full max-h-[70vh] rounded-lg bg-black"
          preload="metadata"
        />
        <a href={media.url!} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
          Open video in new tab
        </a>
      </div>
    );
  }

  if (media.kind === "document") {
    const ext = getExtension(media.url!, media.nameHint);
    const isOffice = OFFICE_VIEWER_EXTENSIONS.has(ext);
    const canEmbed = !isOffice || !isLocalHost();
    const embedUrl = media.embedUrl ?? getDocumentEmbedUrl(media.url!, media.nameHint);

    return (
      <div className="space-y-3">
        {canEmbed ? (
          <iframe
            src={embedUrl}
            title="Lesson document"
            className="w-full h-[80vh] rounded-lg border"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="border rounded-lg p-8 text-center bg-gray-50">
            <p className="text-gray-600 mb-4">This document format requires downloading to view locally.</p>
            <a
              href={media.url!}
              download
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download Document
            </a>
          </div>
        )}
        <a href={media.url!} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
          Open document in new tab
        </a>
      </div>
    );
  }

  if (media.kind === "html") {
    (() => {
      const html = (lessonData as LessonDataForViewer).Content ?? (lessonData as LessonDataForViewer).content ?? "";
      return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
    })()
  }


  return <p className="text-gray-500">Lesson content is not available.</p>;
}

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

  if (error) return <p className="text-red-500 p-6">{error}</p>;
  if (loading) return <p className="text-gray-500 italic p-6">Loading...</p>;
  if (!lessonData) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {(lessonData as LessonDataForViewer).Title ?? (lessonData as LessonDataForViewer).title ?? lessonData.Title}
          </h1>
        </div>

        <LessonMediaViewer lessonData={lessonData} />

        {onComplete && (
          <div className="pt-4 border-t">
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              ✓ Mark as Complete &amp; Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
