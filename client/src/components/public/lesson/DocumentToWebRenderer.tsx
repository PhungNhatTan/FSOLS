import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";

import { convertToHtml, images, type MammothImage } from "mammoth/mammoth.browser";
import * as XLSX from "xlsx";

import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
} from "pdfjs-dist";

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type SupportedKind = "docx" | "pdf" | "xlsx" | "xls";

export interface DocumentToWebRendererProps {
  url: string;
  nameHint?: string | null;
}

const stripQueryHash = (value: string) => value.split(/[?#]/)[0];

const getFileExtension = (value: string): string => {
  const clean = stripQueryHash(value);
  const idx = clean.lastIndexOf(".");
  if (idx === -1) return "";
  return clean.slice(idx + 1).toLowerCase();
};

const getExtension = (url: string, nameHint?: string | null): string =>
  (nameHint ? getFileExtension(nameHint) : "") || getFileExtension(url);

const asErrorMessage = (e: unknown, fallback: string) => {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return fallback;
};

function Unsupported({ url, reason }: { url: string; reason: string }) {
  return (
    <div className="border rounded-lg p-6 bg-gray-50 space-y-3">
      <p className="text-gray-700">{reason}</p>
      <div className="flex gap-3 flex-wrap">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Open file
        </a>
        <a
          href={url}
          download
          className="inline-block px-4 py-2 bg-gray-900 text-white rounded hover:bg-black"
        >
          Download
        </a>
      </div>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <p className="text-gray-500 italic">{label}</p>
    </div>
  );
}

function ErrorBlock({ message, url }: { message: string; url: string }) {
  return (
    <div className="border rounded-lg p-6 bg-red-50 space-y-3">
      <p className="text-red-700">{message}</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-blue-700 hover:underline"
      >
        Open file in new tab
      </a>
    </div>
  );
}

function DocxAsHtml({ url }: { url: string }) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to fetch document (${resp.status})`);

        const arrayBuffer = await resp.arrayBuffer();

        const result = await convertToHtml(
          { arrayBuffer },
          {
            convertImage: images.inline(async (element: MammothImage) => {
              const base64 = await element.read("base64");
              return { src: `data:${element.contentType};base64,${base64}` };
            }),
          }
        );

        const safe = DOMPurify.sanitize(result.value, { USE_PROFILES: { html: true } });
        if (!cancelled) setHtml(safe);
      } catch (e: unknown) {
        if (!cancelled) setError(asErrorMessage(e, "Failed to render DOCX"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) return <LoadingBlock label="Converting DOCX to web content..." />;
  if (error) return <ErrorBlock message={error} url={url} />;

  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}

function SpreadsheetAsHtml({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState<string>("");
  const [sheetHtml, setSheetHtml] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to fetch spreadsheet (${resp.status})`);
        const arrayBuffer = await resp.arrayBuffer();

        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const names = wb.SheetNames || [];
        const htmlBySheet: Record<string, string> = {};

        for (const name of names) {
          const ws = wb.Sheets[name];
          if (!ws) continue;
          const raw = XLSX.utils.sheet_to_html(ws, { id: `sheet-${name}` });
          htmlBySheet[name] = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
        }

        if (cancelled) return;

        setTabs(names);
        setSheetHtml(htmlBySheet);
        setActive(names[0] || "");
      } catch (e: unknown) {
        if (!cancelled) setError(asErrorMessage(e, "Failed to render spreadsheet"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) return <LoadingBlock label="Converting spreadsheet to web content..." />;
  if (error) return <ErrorBlock message={error} url={url} />;

  if (!tabs.length) {
    return <Unsupported url={url} reason="This spreadsheet has no visible sheets." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={
              "px-3 py-1.5 rounded border text-sm " +
              (t === active
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
            }
          >
            {t}
          </button>
        ))}
      </div>
      <div className="border rounded-lg p-3 overflow-auto bg-white">
        <div dangerouslySetInnerHTML={{ __html: sheetHtml[active] || "" }} />
      </div>
    </div>
  );
}

function PdfPageCanvas({ pdf, pageNumber }: { pdf: PDFDocumentProxy; pageNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderError, setRenderError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        setRenderError("");
        const page = await pdf.getPage(pageNumber);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale: 1.3 });
        const ratio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = "100%";
        canvas.style.height = "auto";

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        // Fix typing: RenderParameters requires `canvas` in your installed pdfjs-dist types
        const task = page.render({ canvas, canvasContext: ctx, viewport });
        await task.promise;
      } catch (e: unknown) {
        if (!cancelled) setRenderError(asErrorMessage(e, "Failed to render page"));
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">Page {pageNumber}</div>
      {renderError ? (
        <div className="border rounded-lg p-3 bg-red-50 text-red-700 text-sm">{renderError}</div>
      ) : (
        <canvas ref={canvasRef} className="border rounded-lg bg-white" />
      )}
    </div>
  );
}

function PdfAsCanvas({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [renderCount, setRenderCount] = useState(5);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError("");
        setPdf(null);

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to fetch PDF (${resp.status})`);
        const buf = await resp.arrayBuffer();

        const task = getDocument({ data: new Uint8Array(buf) });
        const doc = await task.promise;

        if (!cancelled) {
          setPdf(doc);
          setRenderCount(Math.min(5, doc.numPages));
        }
      } catch (e: unknown) {
        if (!cancelled) setError(asErrorMessage(e, "Failed to render PDF"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) return <LoadingBlock label="Loading PDF..." />;
  if (error) return <ErrorBlock message={error} url={url} />;
  if (!pdf) return null;

  const pages = Array.from({ length: Math.min(renderCount, pdf.numPages) }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {pages.map((p) => (
        <PdfPageCanvas key={p} pdf={pdf} pageNumber={p} />
      ))}

      {renderCount < pdf.numPages && (
        <div className="pt-2">
          <button
            onClick={() => setRenderCount((c) => Math.min(pdf.numPages, c + 5))}
            className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
          >
            Load more pages
          </button>
        </div>
      )}
    </div>
  );
}

export default function DocumentToWebRenderer({ url, nameHint }: DocumentToWebRendererProps) {
  const ext = useMemo(() => getExtension(url, nameHint), [url, nameHint]);

  const kind: SupportedKind | "unsupported" = useMemo(() => {
    if (ext === "docx") return "docx";
    if (ext === "pdf") return "pdf";
    if (ext === "xlsx") return "xlsx";
    if (ext === "xls") return "xls";
    return "unsupported";
  }, [ext]);

  if (kind === "docx") return <DocxAsHtml url={url} />;
  if (kind === "pdf") return <PdfAsCanvas url={url} />;
  if (kind === "xlsx" || kind === "xls") return <SpreadsheetAsHtml url={url} />;

  return (
    <Unsupported
      url={url}
      reason={
        ext
          ? `This file type (.${ext}) is not supported for web conversion yet.`
          : "This file type is not supported for web conversion yet."
      }
    />
  );
}
