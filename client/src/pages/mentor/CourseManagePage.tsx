import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import LessonUploadForm from "../../components/manage/lesson/LessonUploadForm";
import { Lesson as ApiLesson } from "../../types/lesson";
import { courseManagementApi } from "../../api/courseManagement";
import type {
  UiLessonLocal as Lesson,
  UiModuleLocal as Module,
  ExamLocal as Exam,
  UiQuestionSearchItem,
  UiLesson as LessonDto,
  UiModule as ModuleDto,
  UiExam as ExamDto,
  UiResource as ResourceDto,
} from "../../types/manage";
import type { ExamQuestion as ExamQuestionDto } from "../../types/exam";

let rid = 1000;
let lid = 2000;
let qid = 5000;

const mapResourceDtoToLocal = (resource: ResourceDto): Lesson["resources"][number] => ({
  id: resource.id,
  name: resource.name,
  url: resource.url,
});

const mapLessonDtoToLocal = (lesson: LessonDto): Lesson => ({
  id: lesson.id,
  title: lesson.title,
  description: lesson.description,
  order: lesson.order ?? 0,
  resources: (lesson.resources ?? []).map(mapResourceDtoToLocal),
});

const mapExamQuestionDtoToLocal = (question: ExamQuestionDto): Exam["questions"][number] => {
  const qbId = Number(question.QuestionBankId);
  const mappedId = Number.isNaN(qbId) ? ++qid : qbId;
  return {
    examQuestionId: question.ExamQuestionId,
    questionId: mappedId,
    points: 1,
    question: {
      id: mappedId,
      type: question.Type?.toLowerCase() === "mcq" ? "mcq" : "text",
      text: question.QuestionText,
      options: question.Answers?.map((answer) => answer.AnswerText),
    },
  };
};

const mapExamDtoToLocal = (exam: ExamDto): Exam => ({
  id: exam.id,
  title: exam.title,
  order: exam.order ?? 0,
  durationPreset: exam.durationPreset,
  durationCustom: exam.durationCustom,
  questions: (exam.questions ?? []).map(mapExamQuestionDtoToLocal),
});

const mapModuleDtoToLocal = (module: ModuleDto): Module => ({
  id: module.id,
  title: module.title,
  order: module.order,
  lessons: (module.lessons ?? []).map(mapLessonDtoToLocal),
  exams: (module.exams ?? []).map(mapExamDtoToLocal),
});

const Btn: React.FC<React.PropsWithChildren<{ variant?: "primary" | "ghost" | "outline"; size?: "sm" | "md"; className?: string; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }>>
= ({ variant = "outline", size = "md", className = "", children, onClick, type = "button", disabled = false }) => {
  const base = "inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none";
  const sz = size === "sm" ? "px-3 py-1.5 text-sm" : "px-3.5 py-2";
  const map: Record<string, string> = {
    primary: disabled ? "bg-indigo-400 text-white" : "bg-indigo-600 text-white hover:opacity-90",
    outline: disabled ? "border border-slate-300 bg-slate-100 text-slate-500" : "border border-slate-300 bg-white hover:bg-slate-50",
    ghost: disabled ? "opacity-50" : "hover:bg-white/10",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sz} ${map[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card: React.FC<React.PropsWithChildren<{ title?: string; action?: React.ReactNode; className?: string }>>
= ({ title, action, className = "", children }) => (
  <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const Modal: React.FC<React.PropsWithChildren<{ title: string; onClose: () => void }>>
= ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
    <div className="w-[780px] max-w-[95vw] rounded-3xl bg-white shadow-xl">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="font-semibold">{title}</div>
        <Btn size="sm" onClick={onClose}>Close</Btn>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);


export default function CourseManagePage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id ?? 0);

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ moduleId: number; type: "lesson" | "exam"; id: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("Never");
  const [verificationStatus, setVerificationStatus] = useState<{ ApprovalStatus: string; RequestType: string; CreatedAt: string; ReviewedAt?: string } | null>(null);

  useEffect(() => {
    loadCourseData();
    loadDraftIfExists();
    loadVerificationStatus();
  }, [courseId]);

  const DRAFT_KEY = `course_draft_${courseId}`;

  const loadCourseData = async () => {
    if (courseId <= 0) return;
    try {
      const structure = await courseManagementApi.getStructure(courseId);
      setModules(structure.modules ? structure.modules.map(mapModuleDtoToLocal) : []);
    } catch (err) {
      console.error("Error loading course:", err);
    }
  };

  const loadDraftIfExists = () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setModules(parsed);
      } catch (err) {
        console.error("Failed to load draft:", err);
      }
    }
  };

  const loadVerificationStatus = async () => {
    if (courseId <= 0) return;
    try {
      const status = await courseManagementApi.getVerificationStatus(courseId);
      setVerificationStatus(status);
    } catch (err) {
      console.error("Error loading verification status:", err);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await courseManagementApi.saveDraft(courseId, modules);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(modules));
      setLastSaved(new Date().toLocaleTimeString());
      setTimeout(() => setSaving(false), 500);
    } catch (err) {
      console.error("Error saving draft:", err);
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await courseManagementApi.saveDraft(courseId, modules);
      await courseManagementApi.requestVerification(courseId);
      localStorage.removeItem(DRAFT_KEY);
      setLastSaved("Verification requested");
      await loadVerificationStatus();
    } catch (err) {
      console.error("Error requesting verification:", err);
    } finally {
      setPublishing(false);
    }
  };

  const addModule = () => {
    const title = prompt("Module title:");
    if (!title) return;
    const newModule: Module = {
      id: Date.now(),
      title: title.trim(),
      order: Math.max(0, ...modules.map(m => m.order), 0) + 10,
      lessons: [],
      exams: [],
    };
    setModules((s) => [...s, newModule]);
  };

  const deleteModule = (moduleId: number) => {
    if (!confirm("Delete this module and all its content?")) return;
    setModules((s) => s.filter((m) => m.id !== moduleId));
    if (selectedItem?.moduleId === moduleId) {
      setSelectedItem(null);
    }
  };

  const updateModule = (m: Module) => {
    setModules((s) => s.map((x) => (x.id === m.id ? m : x)));
    if (selectedItem?.moduleId === m.id) {
      if (selectedItem.type === "exam" && !m.exams.find(e => e.id === selectedItem.id)) {
        setSelectedItem(null);
      }
    }
  };

  const getSelectedModule = () => modules.find(m => m.id === selectedItem?.moduleId);
  const getSelectedLesson = () => {
    const mod = getSelectedModule();
    if (selectedItem?.type === "lesson" && mod) {
      return mod.lessons.find(l => l.id === selectedItem.id);
    }
    return undefined;
  };
  const getSelectedExam = () => {
    const mod = getSelectedModule();
    if (selectedItem?.type === "exam" && mod) {
      return mod.exams.find(e => e.id === selectedItem.id);
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top brand bar */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-95" />
        <header className="relative z-10 max-w-7xl mx-auto px-4 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold tracking-wide">FSOLS • Course Management</div>
              <div className="text-xs text-white/70 mt-1">Last saved: {lastSaved}</div>
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="ghost" size="sm" className="text-white/90" onClick={saveDraft} disabled={saving}>
                {saving ? "Saving..." : "Save Draft"}
              </Btn>
              <Btn variant="primary" size="sm" onClick={publish} disabled={publishing || verificationStatus?.ApprovalStatus === "Pending"}>
                {publishing ? "Requesting..." : verificationStatus?.ApprovalStatus === "Pending" ? "Pending Review" : "Send for Verification"}
              </Btn>
            </div>
          </div>
          <p className="mt-1 text-white/90 text-sm">Manage modules, lessons, resources, exams & questions.</p>
        </header>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Manage Course Content #{courseId || 1001}</h1>
            <p className="text-slate-600 mt-1">Create modules/lessons, upload resources; add exams & questions.</p>
          </div>
          <Link to="/manage/courses" className="text-indigo-600 hover:underline">← Back to Courses</Link>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modules & Lessons */}
          <Card title="Modules & Items" action={<Btn variant="primary" size="sm" onClick={addModule}>+ Module</Btn>}>
            {modules.length === 0 && <div className="text-sm text-slate-500">No modules yet. Click <b>+ Module</b> to create.</div>}
            {modules.slice().sort((a,b)=>a.order-b.order).map((m) => (
              <ModuleCard key={m.id} module={m} onChange={updateModule} onDelete={deleteModule} selectedItem={selectedItem} onSelectItem={setSelectedItem} />
            ))}
          </Card>

          {/* RIGHT COLUMN */}
          <div className="grid gap-6">
            {verificationStatus && (
              <Card title="Verification Status">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status:</span>
                    <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                      verificationStatus.ApprovalStatus === "Pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                      verificationStatus.ApprovalStatus === "Approved" ? "bg-green-50 text-green-700 border border-green-200" :
                      "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {verificationStatus.ApprovalStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Type:</span>
                    <div className="text-sm font-medium mt-1">{verificationStatus.RequestType}</div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Requested:</span>
                    <div className="text-sm mt-1">{new Date(verificationStatus.CreatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </Card>
            )}
            {selectedItem ? (
              <DetailCard
                courseId={courseId}
                lesson={getSelectedLesson()}
                exam={getSelectedExam()}
                module={getSelectedModule()}
                onModuleChange={updateModule}
                onDeselect={() => setSelectedItem(null)}
              />
            ) : (
              <Card title="Details">
                <div className="text-sm text-slate-500">Select a lesson or exam to view details.</div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ModuleCard({
  module,
  onChange,
  onDelete,
  selectedItem,
  onSelectItem,
}: {
  module: Module;
  onChange: (m: Module) => void;
  onDelete: (moduleId: number) => void;
  selectedItem: { moduleId: number; type: "lesson" | "exam"; id: number } | null;
  onSelectItem: (item: { moduleId: number; type: "lesson" | "exam"; id: number }) => void;
}) {
  const [openAddLesson, setOpenAddLesson] = useState(false);
  const [openCreateExam, setOpenCreateExam] = useState(false);

  const nextItemOrder = () => {
    const maxLesson = module.lessons.reduce((mx, l) => Math.max(mx, l.order), 0);
    const maxExam = module.exams.reduce((mx, e) => Math.max(mx, e.order), 0);
    return Math.max(maxLesson, maxExam) + 10;
  };

  const addLesson = (newLesson: Lesson) => {
    onChange({ ...module, lessons: [...module.lessons, newLesson] });
    setOpenAddLesson(false);
  };

  const createExam = (title: string, durationPreset?: string, durationCustom?: number) => {
    const newExam: Exam = {
      id: Date.now(),
      title: title.trim(),
      order: nextItemOrder(),
      durationPreset,
      durationCustom,
      questions: [],
    };
    onChange({ ...module, exams: [...module.exams, newExam] });
    setOpenCreateExam(false);
  };

  const mergedItems = [
    ...module.lessons.map((l) => ({ type: "lesson" as const, item: l, order: l.order })),
    ...module.exams.map((e) => ({ type: "exam" as const, item: e, order: e.order })),
  ].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
        <div className="font-medium text-slate-900">Module {module.order}: {module.title}</div>
        <div className="flex items-center gap-2">
          <Btn size="sm" onClick={() => setOpenAddLesson(true)}>+ Lesson</Btn>
          <Btn size="sm" onClick={() => setOpenCreateExam(true)}>+ Exam</Btn>
          <Btn size="sm" variant="outline" onClick={() => onDelete(module.id)} className="text-red-600 border-red-200">Delete</Btn>
        </div>
      </div>

      <div className="p-4">
        <div className="text-slate-600 text-sm mb-2">Items</div>
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
                className={`rounded-2xl border p-3 cursor-pointer transition ${
                  isSelected
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between">
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
            );
          })}
        </div>
      </div>

      {openAddLesson && (
        <Modal title="Add Lesson" onClose={() => setOpenAddLesson(false)}>
          <LessonUploadForm
            moduleId={module.id}
            onSuccess={(lesson: ApiLesson) => {
              const newLesson: Lesson = {
                id: Number(lesson.Id) || ++lid,
                title: lesson.Title || "Untitled",
                description: lesson.Content,
                order: nextItemOrder(),
                resources: lesson.VideoUrl
                  ? [{ id: ++rid, name: "video", url: lesson.VideoUrl }]
                  : lesson.DocUrl
                    ? [{ id: ++rid, name: "document", url: lesson.DocUrl }]
                    : [],
              };
              addLesson(newLesson);
            }}
            onError={(err) => console.error(err)}
            showCourseModuleSelect={false}
          />
        </Modal>
      )}

      {openCreateExam && (
        <Modal title="Create Exam" onClose={() => setOpenCreateExam(false)}>
          <CreateExamForm onSubmit={createExam} />
        </Modal>
      )}
    </div>
  );
}

function CreateExamForm({ onSubmit }: { onSubmit: (title: string, durationPreset?: string, durationCustom?: number) => Promise<void> | void }) {
  const [title, setTitle] = useState("Midterm");
  const [durationType, setDurationType] = useState<"preset" | "custom" | "none">("none");
  const [durationPreset, setDurationPreset] = useState<string>("P_30");
  const [durationCustom, setDurationCustom] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  const presetOptions = [
    { value: "P_15", label: "15 minutes" },
    { value: "P_30", label: "30 minutes" },
    { value: "P_60", label: "60 minutes" },
    { value: "P_90", label: "90 minutes" },
    { value: "P_120", label: "120 minutes" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const preset = durationType === "preset" ? durationPreset : undefined;
      const custom = durationType === "custom" ? durationCustom : undefined;
      await onSubmit(title, preset, custom);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <input className="w-full px-3 py-2 rounded-xl border" placeholder="Exam title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        
        <div>
          <label className="block text-sm font-medium mb-2">Duration</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="durationType" value="none" checked={durationType === "none"} onChange={(e) => setDurationType(e.target.value as "preset" | "custom" | "none")} />
              <span className="text-sm">No limit</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="durationType" value="preset" checked={durationType === "preset"} onChange={(e) => setDurationType(e.target.value as "preset" | "custom" | "none")} />
              <span className="text-sm">Preset</span>
            </label>
            {durationType === "preset" && (
              <select className="w-full px-3 py-2 rounded-xl border ml-6" value={durationPreset} onChange={(e) => setDurationPreset(e.target.value)}>
                {presetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-2">
              <input type="radio" name="durationType" value="custom" checked={durationType === "custom"} onChange={(e) => setDurationType(e.target.value as "preset" | "custom" | "none")} />
              <span className="text-sm">Custom</span>
            </label>
            {durationType === "custom" && (
              <input type="number" className="w-full px-3 py-2 rounded-xl border ml-6" placeholder="Minutes" min="1" value={durationCustom} onChange={(e) => setDurationCustom(Number(e.target.value))} />
            )}
          </div>
        </div>

        <Btn variant="primary" type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Btn>
      </div>
    </form>
  );
}

function DetailCard({
  courseId,
  lesson,
  exam,
  module,
  onModuleChange,
  onDeselect,
}: {
  courseId: number;
  lesson?: Lesson;
  exam?: Exam;
  module?: Module;
  onModuleChange: (m: Module) => void;
  onDeselect: () => void;
}) {
  const [openAddQ, setOpenAddQ] = useState(false);

  if (!lesson && !exam) {
    return (
      <Card title="Details">
        <div className="text-sm text-slate-500">No item selected.</div>
      </Card>
    );
  }

  if (lesson) {
    return (
      <Card
        title={`📖 ${lesson.title}`}
        action={<Btn size="sm" onClick={onDeselect}>Clear</Btn>}
      >
        <div className="space-y-3">
          {lesson.description && (
            <div>
              <div className="text-sm font-semibold text-slate-700">Description</div>
              <div className="text-sm text-slate-600 mt-1">{lesson.description}</div>
            </div>
          )}
          {lesson.resources.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-slate-700">Resources</div>
              <ul className="mt-2 space-y-2">
                {lesson.resources.map((r) => (
                  <li key={r.id} className="rounded-xl border p-2">
                    <a className="text-indigo-600 hover:underline text-sm" href={r.url} target="_blank" rel="noreferrer">
                      {r.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-xs text-slate-500">Order: {lesson.order}</div>
        </div>
      </Card>
    );
  }

  if (exam && module) {
    const onExamChange = (updated: Exam) => {
      onModuleChange({ ...module, exams: module.exams.map(e => e.id === updated.id ? updated : e) });
    };

    const deleteExam = () => {
      if (!confirm("Delete this exam?")) return;
      onModuleChange({ ...module, exams: module.exams.filter(e => e.id !== exam.id) });
      onDeselect();
    };

    return (
      <Card
        title={`📝 ${exam.title}`}
        action={<Btn size="sm" variant="ghost" onClick={onDeselect}>Clear</Btn>}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">Questions: {exam.questions.length}</div>
            <div className="flex gap-2">
              <Btn size="sm" variant="primary" onClick={() => setOpenAddQ(true)}>+ Question</Btn>
              <Btn size="sm" variant="outline" onClick={deleteExam} className="text-red-600 border-red-200">Delete</Btn>
            </div>
          </div>

          {exam.questions.length === 0 ? (
            <div className="text-sm text-slate-500 py-4">No questions yet. Click + Question to add.</div>
          ) : (
            <ul className="space-y-2">
              {exam.questions.map((q, i) => (
                <ExamQuestionItem
                  key={i}
                  courseId={courseId}
                  question={q}
                  index={i}
                  exam={exam}
                  onExamChange={onExamChange}
                />
              ))}
            </ul>
          )}

          <div className="text-xs text-slate-500">Order: {exam.order}</div>
        </div>

        {openAddQ && exam && (
          <Modal title="Add Exam Question" onClose={() => setOpenAddQ(false)}>
            <AddQuestion courseId={courseId} exam={exam} onExamChange={onExamChange} onClose={() => setOpenAddQ(false)} />
          </Modal>
        )}
      </Card>
    );
  }

  return null;
}

function ExamQuestionItem({
  courseId,
  question,
  index,
  exam,
  onExamChange,
}: {
  courseId: number;
  question: Exam["questions"][number];
  index: number;
  exam: Exam;
  onExamChange: (ex: Exam) => void;
}) {
  const [openEdit, setOpenEdit] = useState(false);

  const handleRemove = () => {
    if (!confirm("Remove this question?")) return;
    onExamChange({ ...exam, questions: exam.questions.filter((_, idx) => idx !== index) });
  };

  return (
    <>
      <li className="rounded-2xl border p-3 bg-slate-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="font-medium text-sm">Q{index + 1}: {question.question?.text ?? `Question #${question.questionId}`}</div>
            <div className="text-xs text-slate-500 mt-1">Points: {question.points}</div>
          </div>
          <div className="flex gap-2">
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => setOpenEdit(true)}
            >
              Edit
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              className="text-red-600"
              onClick={handleRemove}
            >
              Remove
            </Btn>
          </div>
        </div>
      </li>
      {openEdit && (
        <Modal title="Edit Question" onClose={() => setOpenEdit(false)}>
          <EditQuestion
            courseId={courseId}
            question={question}
            index={index}
            exam={exam}
            onExamChange={onExamChange}
            onClose={() => setOpenEdit(false)}
          />
        </Modal>
      )}
    </>
  );
}

function AddQuestion({ courseId, exam, onExamChange, onClose }: { courseId: number; exam: Exam; onExamChange: (ex: Exam) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"bank" | "new">("bank");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className={`px-3 py-1.5 rounded-full border ${tab==="bank" ? "bg-indigo-50 border-indigo-200" : ""}`} onClick={()=>setTab("bank")}>From QuestionBank</button>
        <button className={`px-3 py-1.5 rounded-full border ${tab==="new" ? "bg-indigo-50 border-indigo-200" : ""}`} onClick={()=>setTab("new")}>Create new</button>
      </div>
      {tab === "bank" ? <BankPicker courseId={courseId} exam={exam} onExamChange={onExamChange} onClose={onClose} /> : <NewQuestion courseId={courseId} exam={exam} onExamChange={onExamChange} onClose={onClose} />}
    </div>
  );
}

function BankPicker({ courseId, exam, onExamChange, onClose }: { courseId: number; exam: Exam; onExamChange: (ex: Exam) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [allQuestions, setAllQuestions] = useState<UiQuestionSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseQuestions = async () => {
      setLoading(true);
      try {
        const result = await courseManagementApi.getQuestionsByCourse(courseId);
        setAllQuestions(result.items);
      } catch (err) {
        console.error("Error loading course questions:", err);
        setAllQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourseQuestions();
  }, [courseId]);

  const addedQuestionIds = new Set(exam.questions.map(eq => String(eq.questionId)));
  const filteredQuestions = allQuestions.filter(question => !addedQuestionIds.has(String(question.id)));
  const displayedQuestions = q.trim()
    ? filteredQuestions.filter(question => question.text.toLowerCase().includes(q.trim().toLowerCase()))
    : filteredQuestions;

  const add = (id: string) => {
    const question = allQuestions.find(q => q.id === id);
    if (!question) return;
    const newQuestion: Exam["questions"][number] = {
      examQuestionId: `local_${Date.now()}`,
      questionId: Number(id),
      points: 1,
      question: {
        id: Number(id),
        type: question.type === "MCQ" ? "mcq" : "text",
        text: question.text,
        options: [],
      },
    };
    onExamChange({ ...exam, questions: [...exam.questions, newQuestion] });
    onClose();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl border"
          placeholder="Search questions…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-2 max-h-[50vh] overflow-auto">
        {loading && <div className="text-sm text-slate-500">Loading questions…</div>}
        {!loading && displayedQuestions.length === 0 && (
          <div className="text-sm text-slate-500">
            {q.trim() ? "No matching questions found." : "All available questions have been added."}
          </div>
        )}
        {!loading && displayedQuestions.map((r) => (
          <div key={r.id} className="rounded-2xl border p-3">
            <div className="text-sm">{r.text}</div>
            <div className="text-xs text-slate-500 mt-1">Type: {r.type}</div>
            <Btn variant="primary" size="sm" className="mt-2" onClick={() => add(r.id)}>Add to Exam</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewQuestion({ exam, onExamChange, onClose }: { courseId: number; exam: Exam; onExamChange: (ex: Exam) => void; onClose: () => void }) {
  const [type, setType] = useState<"mcq" | "text">("mcq");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState("");

  const onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value === "text" ? "text" : "mcq";
    setType(v);
  };

  const create = () => {
    setError("");
    if (!text.trim()) {
      setError("Question text is required");
      return;
    }
    if (type === "mcq" && options.filter((o) => o.trim()).length < 2) {
      setError("MCQ needs at least 2 options");
      return;
    }

    const filteredOptions = type === "mcq" ? options.filter((o) => o.trim()) : [];
    const newQuestion: Exam["questions"][number] = {
      examQuestionId: `local_${Date.now()}`,
      questionId: Date.now(),
      points: 1,
      question: {
        id: Date.now(),
        type: type as "mcq" | "text",
        text: text.trim(),
        options: type === "mcq" ? filteredOptions : undefined,
        correctIndex: type === "mcq" ? correct : undefined,
      },
    };

    onExamChange({ ...exam, questions: [...exam.questions, newQuestion] });
    setText("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    onClose();
  };

  return (
    <div className="space-y-3">
      <select className="w-full px-3 py-2 rounded-xl border" value={type} onChange={onTypeChange}>
        <option value="mcq">Multiple Choice</option>
        <option value="text">Text</option>
      </select>
      <textarea className="w-full px-3 py-2 rounded-xl border min-h-[90px]" placeholder="Question text" value={text} onChange={(e)=>setText(e.target.value)} />
      {type === "mcq" && options.map((op, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            className="flex-1 px-3 py-2 rounded-xl border"
            placeholder={`Option ${i + 1}`}
            value={op}
            onChange={(e) => setOptions(options.map((x, idx) => (idx === i ? e.target.value : x)))}
          />
          <label className="text-sm text-slate-600">
            <input type="radio" name="correct" checked={i === correct} onChange={() => setCorrect(i)} /> Correct
          </label>
        </div>
      ))}
      {error && <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Btn variant="primary" onClick={create}>Create & Attach</Btn>
    </div>
  );
}

function EditQuestion({
  question,
  index,
  exam,
  onExamChange,
  onClose,
}: {
  courseId: number;
  question: Exam["questions"][number];
  index: number;
  exam: Exam;
  onExamChange: (ex: Exam) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<"mcq" | "text">(question.question?.type === "mcq" ? "mcq" : "text");
  const [text, setText] = useState(question.question?.text || "");
  const [options, setOptions] = useState<string[]>(
    question.question?.options && question.question.options.length > 0
      ? question.question.options
      : ["", "", "", ""]
  );
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState("");

  const onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value === "text" ? "text" : "mcq";
    setType(v);
  };

  const handleSave = () => {
    setError("");
    if (!text.trim()) {
      setError("Question text is required");
      return;
    }
    if (type === "mcq" && options.filter((o) => o.trim()).length < 2) {
      setError("MCQ needs at least 2 options");
      return;
    }

    const filteredOptions = type === "mcq" ? options.filter((o) => o.trim()) : [];
    const updatedQuestion: Exam["questions"][number] = {
      ...question,
      question: {
        ...(question.question || {}),
        id: question.question?.id ?? Date.now(),
        type: type as "mcq" | "text",
        text: text.trim(),
        options: type === "mcq" ? filteredOptions : undefined,
        correctIndex: type === "mcq" ? correct : undefined,
      },
    };

    const updatedQuestions = exam.questions.map((q, i) => i === index ? updatedQuestion : q);
    onExamChange({ ...exam, questions: updatedQuestions });
    onClose();
  };

  return (
    <div className="space-y-3">
      <select className="w-full px-3 py-2 rounded-xl border" value={type} onChange={onTypeChange}>
        <option value="mcq">Multiple Choice</option>
        <option value="text">Text</option>
      </select>
      <textarea className="w-full px-3 py-2 rounded-xl border min-h-[90px]" placeholder="Question text" value={text} onChange={(e) => setText(e.target.value)} />
      {type === "mcq" && options.map((op, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            className="flex-1 px-3 py-2 rounded-xl border"
            placeholder={`Option ${i + 1}`}
            value={op}
            onChange={(e) => setOptions(options.map((x, idx) => (idx === i ? e.target.value : x)))}
          />
          <label className="text-sm text-slate-600">
            <input type="radio" name="correct" checked={i === correct} onChange={() => setCorrect(i)} /> Correct
          </label>
        </div>
      ))}
      {error && <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <div className="flex gap-2">
        <Btn variant="primary" onClick={handleSave} className="flex-1">
          Save Changes
        </Btn>
        <Btn onClick={onClose}>
          Cancel
        </Btn>
      </div>
    </div>
  );
}