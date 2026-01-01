import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { courseManagementApi } from "../../api/courseManagement";
import courseApi from "../../api/course";
import type {
  UiModuleLocal as Module,
  UiLessonLocal as Lesson,
  ExamLocal as Exam,
} from "../../types/manage";
import type { Course, DraftJson } from "../../types/course";
import {
  mapDraftToLocal,
  getDraftStats,
  mapLocalToDraft,
  mapStructureToDraft,
} from "../../service/CourseManagementService";
import { Card } from "../../components/manage/ui/Card";
import { Btn } from "../../components/manage/ui/Btn";
import { Modal } from "../../components/manage/ui/Modal";

// Read-only components
function ReadOnlyModuleCard({
  module,
  selectedItem,
  onSelectItem,
}: {
  module: Module;
  selectedItem: { moduleId: number; type: "lesson" | "exam"; id: number } | null;
  onSelectItem: (item: { moduleId: number; type: "lesson" | "exam"; id: number }) => void;
}) {
  const lessons = module.lessons ?? [];
  const exams = module.exams ?? [];

  const mergedItems = [
    ...lessons.map((l) => ({ type: "lesson" as const, item: l, order: l.order })),
    ...exams.map((e) => ({ type: "exam" as const, item: e, order: e.order })),
  ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="font-medium text-slate-900">Module {module.order}: {module.title}</div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          {mergedItems.length === 0 && <div className="text-sm text-slate-500">No items yet.</div>}
          {mergedItems.map((entry) => {
            const isSelected =
              selectedItem?.moduleId === module.id &&
              selectedItem?.type === entry.type &&
              selectedItem?.id === entry.item.id;

            return (
              <div
                key={`${entry.type}-${entry.item.id}`}
                onClick={() =>
                  onSelectItem({
                    moduleId: module.id,
                    type: entry.type,
                    id: entry.item.id,
                  })
                }
                className={`rounded-2xl border p-3 cursor-pointer transition ${isSelected
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div>
                      <div className="font-medium">
                        {entry.type === "lesson" ? "📖" : "📝"} {entry.item.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {entry.type === "lesson" ? "Lesson" : "Exam"} • Order: {entry.order}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


const getFileType = (url?: string) => {
  if (!url) return 'other';
  const extension = url.split('.').pop()?.toLowerCase();
  if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) return 'video';
  if (['pdf'].includes(extension || '')) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension || '')) return 'office';
  return 'other';
};

const isLocalUrl = (url?: string) => {
  if (!url) return true;
  try {
    const urlObj = new URL(url, window.location.origin);
    return (
      urlObj.hostname === 'localhost' ||
      urlObj.hostname === '127.0.0.1' ||
      urlObj.hostname.startsWith('192.168.') ||
      urlObj.hostname.startsWith('10.') ||
      urlObj.hostname.endsWith('.local')
    );
  } catch {
    return true;
  }
};

function ResourcePreview({ resource }: { resource: { name: string; url?: string; size?: number } }) {
  const [downloading, setDownloading] = useState(false);
  const [videoError, setVideoError] = useState(false);

  if (!resource.url) return null;
  const type = getFileType(resource.url);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!resource.url) return;

    setDownloading(true);
    try {
      const response = await fetch(resource.url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = resource.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(resource.url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  // Get MIME type based on file extension
  const getMimeType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'ogv': 'video/ogg',
      'mov': 'video/quicktime',
    };
    return mimeTypes[extension || ''] || '';
  };

  if (type === 'video') {
    const mimeType = getMimeType(resource.url);

    return (
      <div className="mt-2">
        {videoError ? (
          <div className="w-full rounded-lg border bg-slate-50 p-8 text-center">
            <p className="text-slate-600 mb-3">Unable to preview this video format</p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="text-indigo-600 hover:underline text-sm font-medium disabled:opacity-50"
            >
              {downloading ? "Downloading..." : "Download video"}
            </button>
          </div>
        ) : (
          <video
            controls
            className="w-full rounded-lg border bg-black"
            onError={() => setVideoError(true)}
            preload="metadata"
          >
            <source src={resource.url} type={mimeType} />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    );
  }

  if (type === 'pdf') {
    return (
      <div className="mt-2 h-96 w-full border rounded-lg overflow-hidden">
        <iframe src={resource.url} className="w-full h-full" title={resource.name} />
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="mt-2">
        <img src={resource.url} alt={resource.name} className="max-w-full rounded-lg border" />
      </div>
    );
  }

  if (type === 'office') {
    if (isLocalUrl(resource.url)) {
      return (
        <div className="mt-2 p-8 border rounded-lg bg-slate-50 text-center">
          <p className="text-slate-500 text-sm mb-2">Preview is not available for local files.</p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="text-indigo-600 hover:underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? "Downloading..." : "Download to view"}
          </button>
        </div>
      );
    }

    return (
      <div className="mt-2 h-96 w-full border rounded-lg overflow-hidden">
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(resource.url)}&embedded=true`}
          className="w-full h-full"
          title={resource.name}
        />
      </div>
    );
  }

  return null;
}

function ReadOnlyLessonDetail({ lesson }: { lesson: Lesson }) {
  return (
    <Card title={`📖 ${lesson.title}`}>
      <div className="space-y-3">
        {lesson.description && (
          <div>
            <div className="text-sm font-semibold text-slate-700">Description</div>
            <div className="text-sm text-slate-600 mt-1">{lesson.description}</div>
          </div>
        )}

        <div>
          <div className="text-sm font-semibold text-slate-700 mb-2">
            Resources ({lesson.resources?.length || 0})
          </div>

          {lesson.resources && lesson.resources.length > 0 ? (
            <ul className="space-y-4">
              {lesson.resources.map((r) => (
                <li key={r.id} className="rounded-xl border p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <a
                        className="text-indigo-600 hover:underline text-sm font-medium block truncate"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {r.name}
                      </a>
                      {r.size && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {(r.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview Content */}
                  <ResourcePreview resource={r} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-slate-500 italic">
              No resources.
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500">Order: {lesson.order}</div>
      </div>
    </Card>
  );
}

function ReadOnlyExamDetail({ exam }: { exam: Exam }) {
  return (
    <Card title={`📝 ${exam.title}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Questions: {exam.questions.length}
          </div>
          <div className="text-sm text-slate-600">
            Duration: {exam.durationPreset === "custom" ? `${exam.durationCustom} mins` : exam.durationPreset || "No limit"}
          </div>
        </div>

        {exam.questions.length === 0 ? (
          <div className="text-sm text-slate-500 py-4">
            No questions.
          </div>
        ) : (
          <ul className="space-y-2">
            {exam.questions.map((q, i) => (
              <li key={i} className="p-3 border rounded-lg bg-slate-50">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-sm">Question {i + 1}</span>
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {q.points} pts
                  </span>
                </div>
                <div className="text-sm text-slate-800 mb-2">
                  {q.question?.text || "Question text missing"}
                </div>
                {q.question?.type === "mcq" && q.question.options && (
                  <ul className="space-y-1 ml-2">
                    {q.question.options.map((opt, idx) => (
                      <li key={idx} className={`text-sm ${idx === q.question?.correctIndex ? "text-green-600 font-medium" : "text-slate-600"}`}>
                        {idx === q.question?.correctIndex ? "✓ " : "○ "} {opt}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="text-xs text-slate-500">Order: {exam.order}</div>
      </div>
    </Card>
  );
}

export default function CourseDraftPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate();
  // const [error] = useState("")
  // const [loading] = useState(true)
  const courseId = Number(id ?? 0);

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [skills, setSkills] = useState<{ id: number; skillName: string }[]>([]);
  const [lastSaved, setLastSaved] = useState<string>("Never");
  const [selectedItem, setSelectedItem] = useState<{ moduleId: number; type: "lesson" | "exam"; id: number } | null>(null);

  // Verification & Rejection State
  const [verificationStatus, setVerificationStatus] = useState<{
    Id: string;
    ApprovalStatus: string;
    RequestType: string;
    CreatedAt: string;
    ReviewedAt?: string
  } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fix loading state
  // I'll use a real loading state
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      await Promise.all([
        loadCourse(),
        loadVerificationStatus()
      ]);
      if (!cancelled) setIsLoading(false);
    };

    if (courseId > 0) load();

    return () => { cancelled = true; };
  }, [courseId]);

  const loadVerificationStatus = async () => {
    if (courseId <= 0) return;
    try {
      const status = await courseManagementApi.getVerificationStatus(courseId);
      setVerificationStatus(status);
    } catch (err) {
      console.error("Error loading verification status:", err);
    }
  };

  const loadCourse = async () => {
    if (courseId <= 0) return;

    try {
      // Always load base course metadata
      const structure = await courseManagementApi.getStructure(courseId);
      setCourse(structure.course);

      let draftLoaded = false;

      try {
        // Try to load from verification draft first (if any)
        let draftResponse;
        try {
          draftResponse = await courseManagementApi.getVerificationDraft(courseId);
        } catch (e) {
          console.log("No verification draft found, trying normal draft..." + e);
          // If verification draft not found, try the old draft
          draftResponse = await courseManagementApi.getDraft(courseId);
        }

        if (draftResponse?.draft) {
          const draft: DraftJson =
            typeof draftResponse.draft === "string"
              ? JSON.parse(draftResponse.draft)
              : draftResponse.draft;

          if (Array.isArray(draft.modules)) {
            const { modules, skills } = mapDraftToLocal(draft);
            setModules(modules);
            setSkills(skills);
            setLastSaved(
              `Draft loaded (${new Date(draft.lastModified).toLocaleString()})`
            );
            draftLoaded = true;
          }
        }
      } catch {
        // no draft, fall back
      }

      if (!draftLoaded) {
        const draft = mapStructureToDraft(structure);
        const { modules, skills } = mapDraftToLocal(draft);

        setModules(modules);
        setSkills(skills);
        setLastSaved("Initialized from structure");
      }
    } catch (err) {
      console.error("Error loading course:", err);
    }
  }

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this course?")) return;

    setVerifying(true);
    try {
      await courseApi.verify(courseId);
      alert("Course approved successfully!");
      navigate("/moderator/courses");
    } catch (err) {
      console.error("Error approving course:", err);
      alert("Failed to approve course. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!verificationStatus) return;

    try {
      await courseApi.reject(courseId, rejectionReason);

      setRejectModalOpen(false)
      setRejectionReason("")

      alert("Course rejected.");
      navigate("/moderator/courses");
    } catch (err) {
      console.error("Error rejecting course:", err);
      alert("Failed to reject course. Please try again.");
    }
  }

  const module = selectedItem
    ? modules.find(m => m.id === selectedItem.moduleId)
    : undefined;
  const lesson =
    selectedItem?.type === "lesson"
      ? module?.lessons.find(l => l.id === selectedItem.id)
      : undefined;
  const exam =
    selectedItem?.type === "exam"
      ? module?.exams?.find(e => e.id === selectedItem.id)
      : undefined;

  const stats = course ? getDraftStats(mapLocalToDraft(course, modules, skills, null)) : null;

  const isRejectedLocally = verificationStatus?.ApprovalStatus === "Rejected";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading course draft...</p>
        </div>
      </div>
    )
  }

  if (!course && !isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Course draft not found or failed to load.
        </div>
        <div className="mt-4">
          <Link to="/moderator/courses" className="text-blue-600 hover:underline">
            ← Back to requests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top brand bar */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-95" />
        <header className="relative z-10 max-w-7xl mx-auto px-4 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold tracking-wide">FSOLS • Course Review</div>
              <div className="text-xs text-white/70 mt-1">Last saved: {lastSaved}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-yellow-400/20 text-yellow-100 text-xs font-medium rounded-full border border-yellow-400/30">
                Read Only Mode
              </span>
              {verificationStatus?.ApprovalStatus === "Pending" && !isRejectedLocally && (
                <>
                  <Btn
                    variant="primary"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 border-none text-white"
                    onClick={handleApprove}
                    disabled={verifying}
                  >
                    {verifying ? "Approving..." : "Approve"}
                  </Btn>
                  <Btn
                    variant="primary"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 border-none text-white"
                    onClick={() => setRejectModalOpen(true)}
                  >
                    Reject
                  </Btn>
                </>
              )}
              {isRejectedLocally && (
                <span className="px-3 py-1 bg-red-400/20 text-red-100 text-xs font-medium rounded-full border border-red-400/30">
                  Rejected
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 text-white/90 text-sm">
            Reviewing course content, modules, lessons, and exams.
          </p>
        </header>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {course?.Name || `Review Course #${courseId}`}
            </h1>
            <p className="text-slate-600 mt-1">
              {course?.Description || "No description provided."}
            </p>
          </div>
          <Link to="/moderator/courses" className="text-indigo-600 hover:underline">
            ← Back to Requests
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalModules}</div>
              <div className="text-sm text-gray-600">Modules</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.totalLessons}</div>
              <div className="text-sm text-gray-600">Lessons</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.totalExams}</div>
              <div className="text-sm text-gray-600">Exams</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{stats.totalQuestions}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">{stats.totalResources}</div>
              <div className="text-sm text-gray-600">Resources</div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modules & Lessons */}
          <Card title="Modules & Items">
            {modules.length === 0 && (
              <div className="text-sm text-slate-500">
                No modules found.
              </div>
            )}
            {modules
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((m) => (
                <ReadOnlyModuleCard
                  key={`module-${m.id}`}
                  module={m}
                  selectedItem={selectedItem}
                  onSelectItem={setSelectedItem}
                />
              ))}
          </Card>

          {/* Detail View */}
          <div className="space-y-6">
            {selectedItem ? (
              <>
                {selectedItem.type === "lesson" && lesson && (
                  <ReadOnlyLessonDetail lesson={lesson} />
                )}
                {selectedItem.type === "exam" && exam && (
                  <ReadOnlyExamDetail exam={exam} />
                )}
              </>
            ) : (
              <div className="bg-slate-100 rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
                <div className="text-4xl mb-4">👈</div>
                <p>Select a lesson or exam from the left to view details.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {rejectModalOpen && (
        <Modal title="Reject Course" onClose={() => setRejectModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-slate-600">
              Please provide a reason for rejecting this course. This will be sent to the mentor.
            </p>
            <textarea
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              rows={4}
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setRejectModalOpen(false)}>Cancel</Btn>
              <Btn
                variant="primary"
                className="bg-red-600 hover:bg-red-700 border-none text-white"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Course
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}