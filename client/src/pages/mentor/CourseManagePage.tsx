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

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    if (courseId <= 0) return;
    try {
      const structure = await courseManagementApi.getStructure(courseId);
      setModules(structure.modules ? structure.modules.map(mapModuleDtoToLocal) : []);
    } catch (err) {
      console.error("Error loading course:", err);
    }
  };

  const addModule = async () => {
    const title = prompt("Module title:");
    if (!title) return;
    try {
      const created = await courseManagementApi.createModule(courseId, title.trim());
      const module = mapModuleDtoToLocal(created);
      setModules((s) => [...s, module]);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const deleteModule = async (moduleId: number) => {
    if (!confirm("Delete this module and all its content?")) return;
    try {
      await courseManagementApi.removeModule(moduleId);
      setModules((s) => s.filter((m) => m.id !== moduleId));
      if (selectedItem?.moduleId === moduleId) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Error deleting module:", err);
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
            <div className="font-bold tracking-wide">FSOLS • Course Management</div>
              <div className="flex items-center gap-2">
              <Btn variant="ghost" size="sm" className="text-white/90">Save Draft</Btn>
              <Btn variant="primary" size="sm">Publish</Btn>
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
            {selectedItem ? (
              <DetailCard
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

  const createExam = async (title: string) => {
    try {
      const created = await courseManagementApi.createExam(module.id, title.trim());
      const ex = mapExamDtoToLocal(created);
      onChange({ ...module, exams: [...module.exams, ex] });
      setOpenCreateExam(false);
    } catch (err) {
      console.error("Error:", err);
    }
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

function CreateExamForm({ onSubmit }: { onSubmit: (title: string) => Promise<void> | void }) {
  const [title, setTitle] = useState("Midterm");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit(title);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <input className="w-full px-3 py-2 rounded-xl border" placeholder="Exam title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <Btn variant="primary" type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Btn>
      </div>
    </form>
  );
}

function DetailCard({
  lesson,
  exam,
  module,
  onModuleChange,
  onDeselect,
}: {
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

    const deleteExam = async () => {
      if (!confirm("Delete this exam?")) return;
      try {
        await courseManagementApi.deleteExam(exam.id);
        onModuleChange({ ...module, exams: module.exams.filter(e => e.id !== exam.id) });
        onDeselect();
      } catch (err) {
        console.error("Error deleting exam:", err);
      }
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
                <li key={i} className="rounded-2xl border p-3 bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Q{i + 1}: {q.question?.text ?? `Question #${q.questionId}`}</div>
                      <div className="text-xs text-slate-500 mt-1">Points: {q.points}</div>
                    </div>
                    <Btn
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={async () => {
                        try {
                          await courseManagementApi.removeExamQuestion(q.examQuestionId);
                          onExamChange({ ...exam, questions: exam.questions.filter((_, idx) => idx !== i) });
                        } catch (err) {
                          console.error("Error removing question:", err);
                        }
                      }}
                    >
                      Remove
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="text-xs text-slate-500">Order: {exam.order}</div>
        </div>

        {openAddQ && exam && (
          <Modal title="Add Exam Question" onClose={() => setOpenAddQ(false)}>
            <AddQuestion exam={exam} onExamChange={onExamChange} />
          </Modal>
        )}
      </Card>
    );
  }

  return null;
}

function AddQuestion({ exam, onExamChange }: { exam: Exam; onExamChange: (ex: Exam) => void }) {
  const [tab, setTab] = useState<"bank" | "new">("bank");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className={`px-3 py-1.5 rounded-full border ${tab==="bank" ? "bg-indigo-50 border-indigo-200" : ""}`} onClick={()=>setTab("bank")}>From QuestionBank</button>
        <button className={`px-3 py-1.5 rounded-full border ${tab==="new" ? "bg-indigo-50 border-indigo-200" : ""}`} onClick={()=>setTab("new")}>Create new</button>
      </div>
      {tab === "bank" ? <BankPicker exam={exam} onExamChange={onExamChange} /> : <NewQuestion exam={exam} onExamChange={onExamChange} />}
    </div>
  );
}

function BankPicker({ exam, onExamChange }: { exam: Exam; onExamChange: (ex: Exam) => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<UiQuestionSearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchQuestions = async () => {
      if (!q.trim()) {
        setRows([]);
        return;
      }
      setLoading(true);
      try {
        const result = await courseManagementApi.searchQuestions(q);
        setRows(result.items);
      } catch (err) {
        console.error("Error searching questions:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchQuestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [q]);

  const add = async (id: string) => {
    try {
      const updated = await courseManagementApi.addExistingQuestion(exam.id, id, 1);
      onExamChange(mapExamDtoToLocal(updated));
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-xl border" placeholder="Tìm câu hỏi…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <Btn disabled={loading}>{loading ? "Searching…" : "Search"}</Btn>
      </div>
      <div className="space-y-2 max-h-[50vh] overflow-auto">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border p-3">
            <div>{r.text}</div>
            <Btn variant="primary" className="mt-2" onClick={() => add(r.id)}>Add to Exam</Btn>
          </div>
        ))}
        {rows.length === 0 && !loading && <div className="text-sm text-slate-500">Không có câu hỏi.</div>}
        {loading && <div className="text-sm text-slate-500">Đang tìm kiếm…</div>}
      </div>
    </div>
  );
}

function NewQuestion({ exam, onExamChange }: { exam: Exam; onExamChange: (ex: Exam) => void }) {
  const [type, setType] = useState<"mcq" | "text">("mcq");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value === "text" ? "text" : "mcq";
    setType(v);
  };

  const create = async () => {
    console.log("Create button clicked");
    setError("");
    if (!text.trim()) {
      console.log("Validation failed: no text");
      setError("Question text is required");
      return;
    }
    if (type === "mcq" && options.filter((o) => o.trim()).length < 2) {
      console.log("Validation failed: MCQ needs 2+ options");
      setError("MCQ needs at least 2 options");
      return;
    }
    console.log("Validation passed, calling API...");
    setLoading(true);
    try {
      const payload = {
        type: (type === "mcq" ? "MCQ" : "Essay") as "MCQ" | "Essay",
        text: text.trim(),
        options: type === "mcq" ? options.filter((o) => o.trim()) : undefined,
        correctIndex: type === "mcq" ? correct : undefined,
      };
      console.log("API payload:", { examId: exam.id, ...payload });
      const response = await courseManagementApi.createQuestionAndAttach(exam.id, payload);
      console.log("API response:", response);
      onExamChange(mapExamDtoToLocal(response.exam));
      setText("");
      setOptions(["", "", "", ""]);
      setCorrect(0);
      console.log("Question created successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create question";
      setError(msg);
      console.error("Error creating question:", err);
    } finally {
      setLoading(false);
    }
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
      <Btn variant="primary" onClick={create} disabled={loading}>{loading ? "Creating..." : "Create & Attach"}</Btn>
    </div>
  );
}