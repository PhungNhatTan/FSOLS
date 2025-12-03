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
  exam: module.exam ? mapExamDtoToLocal(module.exam) : undefined,
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

  const updateModule = (m: Module) => setModules((s) => s.map((x) => (x.id === m.id ? m : x)));

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
          <Link to="/courses" className="text-indigo-600 hover:underline">← Back to Courses</Link>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modules & Lessons */}
          <Card title="Modules & Lessons" action={<Btn variant="primary" size="sm" onClick={addModule}>+ Module</Btn>}>
            {modules.length === 0 && <div className="text-sm text-slate-500">No modules yet. Click <b>+ Module</b> to create.</div>}
            {modules.slice().sort((a,b)=>a.order-b.order).map((m) => (
              <ModuleCard key={m.id} module={m} onChange={updateModule} />
            ))}
          </Card>

          {/* RIGHT COLUMN */}
          <div className="grid gap-6">
            {/* Exams panel */}
            <Card title="Exams">
              {modules.filter(x=>x.exam).length === 0 ? (
                <div className="text-sm text-slate-500">No exams yet.</div>
              ) : (
                <div className="space-y-3">
                  {modules.filter(x=>x.exam).sort((a,b)=> (a.exam!.order - b.exam!.order)).map((m) => (
                    <div key={m.id} className="rounded-2xl border p-3">
                      <div className="font-medium text-slate-900">
                        {m.exam!.title} <span className="text-slate-500">• Module: {m.title}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Number of questions: {m.exam!.questions.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ModuleCard({ module, onChange }: { module: Module; onChange: (m: Module) => void }) {
  const [openAddLesson, setOpenAddLesson] = useState(false);
  const [openCreateExam, setOpenCreateExam] = useState(false);
  const [openAddQ, setOpenAddQ] = useState(false);

  // Tính order kế tiếp trong module (gộp cả lesson + exam)
  const nextItemOrder = () => {
    const maxLesson = module.lessons.reduce((mx, l) => Math.max(mx, l.order), 0);
    const maxExam = module.exam ? module.exam.order : 0;
    return Math.max(maxLesson, maxExam) + 10; // bước 10 để chèn giữa sau này
  };

  // lessons
  const addLesson = (newLesson: Lesson) => {
    onChange({ ...module, lessons: [...module.lessons, newLesson] });
    setOpenAddLesson(false);
  };

  // exam
  const createExam = async (title: string) => {
    try {
      const created = await courseManagementApi.createExam(module.id, title.trim());
      const ex = mapExamDtoToLocal(created);
      onChange({ ...module, exam: ex });
      setOpenCreateExam(false);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const onExamChange = (exam: Exam) => onChange({ ...module, exam });

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
        <div className="font-medium text-slate-900">Module {module.order}: {module.title}</div>
        <div className="flex items-center gap-2">
          <Btn size="sm" onClick={() => setOpenAddLesson(true)}>+ Lesson</Btn>
          {!module.exam ? (
            <Btn size="sm" onClick={() => setOpenCreateExam(true)}>+ Exam</Btn>
          ) : (
            <Btn size="sm" onClick={() => setOpenAddQ(true)}>+ Exam question</Btn>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Lessons */}
        <div className="text-slate-600 text-sm">Lessons</div>
        <div className="space-y-3 mt-2">
          {module.lessons.length === 0 && <div className="text-sm text-slate-500">No lessons yet.</div>}
          {module.lessons.slice().sort((a,b)=>a.order-b.order).map((l) => (
            <div key={l.id} className="rounded-2xl border p-3">
              <div className="font-medium">{l.title} <span className="text-xs text-slate-500">(order: {l.order})</span></div>
              {l.description && <div className="text-sm text-slate-600">{l.description}</div>}
              {l.resources.length > 0 && (
                <div className="mt-2 text-sm">
                  <b>Resources:</b>
                  <ul className="list-disc ml-5">
                    {l.resources.map((r) => (
                      <li key={r.id}>
                        <a className="text-indigo-600 hover:underline" href={r.url} target="_blank" rel="noreferrer">
                          {r.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Exam */}
        <div className="mt-4">
          <div className="text-slate-600 text-sm">Exam</div>
          {!module.exam ? (
            <div className="text-sm text-slate-500 mt-1">No exams yet.</div>
          ) : (
            <ExamBox exam={module.exam} />
          )}
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

      {openAddQ && module.exam && (
        <Modal title="Add Exam Question" onClose={() => setOpenAddQ(false)}>
          <AddQuestion exam={module.exam} onExamChange={onExamChange} />
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

function ExamBox({ exam }: { exam: Exam }) {
  return (
    <div className="mt-2">
      <div><b>{exam.title}</b> <span className="text-xs text-slate-500">(order: {exam.order})</span></div>
      {exam.questions.length === 0 ? (
        <div className="text-sm text-slate-500 mt-1">No questions yet.</div>
      ) : (
        <ul className="mt-2 space-y-2">
          {exam.questions.map((q, i) => (
            <li key={i} className="rounded-2xl border p-3">
              <div><b>Q{i + 1}:</b> {q.question?.text ?? `Question #${q.questionId}`}</div>
              <div className="text-xs text-slate-500">Points: {q.points}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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

  const onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value === "text" ? "text" : "mcq";
    setType(v);
  };

  const create = async () => {
    if (!text.trim()) return;
    try {
      const response = await courseManagementApi.createQuestionAndAttach(exam.id, {
        type: type === "mcq" ? "MCQ" : "Essay",
        text: text.trim(),
        options: type === "mcq" ? options : undefined,
        correctIndex: type === "mcq" ? correct : undefined,
      });
      onExamChange(mapExamDtoToLocal(response.exam));
      setText("");
      setOptions(["", "", "", ""]);
      setCorrect(0);
    } catch (err) {
      console.error("Error:", err);
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
      <Btn variant="primary" onClick={create}>Create & Attach</Btn>
    </div>
  );
}