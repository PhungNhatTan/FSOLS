import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

/** ================================
 *  Types (demo, độc lập FE)
 *  ================================ */
type Resource = { id: number; name: string; size?: number; url?: string };
type Lesson = { id: number; title: string; description?: string; order: number; resources: Resource[] };
type ExamQuestion = { questionId: number; points: number; question?: Question };
type Exam = { id: number; title: string; order: number; questions: ExamQuestion[] };
type Module = { id: number; title: string; order: number; lessons: Lesson[]; exam?: Exam };
type Question = {
  id: number;
  type: "mcq" | "text";
  text: string;
  options?: string[];
  correctIndex?: number | null;
};

/** ================================
 *  Demo stores (không cần BE)
 *  ================================ */
let rid = 1000, lid = 2000, mid = 3000, exid = 4000, qid = 5000;

const QUESTION_BANK: Question[] = [
  { id: ++qid, type: "mcq", text: "HTTP 200 nghĩa là gì?", options: ["OK", "Not Found", "Server Error"], correctIndex: 0 },
  { id: ++qid, type: "text", text: "Giải thích kiến trúc RESTful.", correctIndex: null },
];

/** ================================
 *  Small UI primitives
 *  ================================ */
const Btn: React.FC<React.PropsWithChildren<{ variant?: "primary" | "ghost" | "outline"; size?: "sm" | "md"; className?: string; onClick?: () => void; type?: "button" | "submit" }>>
= ({ variant = "outline", size = "md", className = "", children, onClick, type = "button" }) => {
  const base = "inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none";
  const sz = size === "sm" ? "px-3 py-1.5 text-sm" : "px-3.5 py-2";
  const map: Record<string, string> = {
    primary: "bg-indigo-600 text-white hover:opacity-90",
    outline: "border border-slate-300 bg-white hover:bg-slate-50",
    ghost: "hover:bg-white/10",
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${sz} ${map[variant]} ${className}`}>
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
        <Btn size="sm" onClick={onClose}>Đóng</Btn>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

/** ================================
 *  PAGE
 *  ================================ */
export default function CourseManagePage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id ?? 0);

  // Demo data (ban đầu trống để bạn tự thêm)
  const [modules, setModules] = useState<Module[]>([]);

  const addModule = () => {
    const title = prompt("Tên module:");
    if (!title) return;
    const m: Module = { id: ++mid, title: title.trim(), order: modules.length * 10 + 10, lessons: [] };
    setModules((s) => [...s, m]);
    // [BE] POST /manage/course/:courseId/modules {title}
  };
  const updateModule = (m: Module) => setModules((s) => s.map((x) => (x.id === m.id ? m : x)));

  /** ================================
   *  One-level course outline (toàn khoá)
   *  Sắp theo module.order → item.order
   *  ================================ */
  const courseFlatOutline = useMemo(() => {
    type FlatItem = {
      key: string;
      moduleOrder: number;
      moduleTitle: string;
      order: number;
      kind: "Lesson" | "Exam";
      title: string;
    };
    const rows: FlatItem[] = [];
    modules.forEach((m) => {
      m.lessons.forEach((l) => {
        rows.push({
          key: `M${m.id}-L${l.id}`,
          moduleOrder: m.order,
          moduleTitle: m.title,
          order: l.order,
          kind: "Lesson",
          title: l.title,
        });
      });
      if (m.exam) {
        rows.push({
          key: `M${m.id}-E${m.exam.id}`,
          moduleOrder: m.order,
          moduleTitle: m.title,
          order: m.exam.order,
          kind: "Exam",
          title: m.exam.title,
        });
      }
    });
    return rows.sort((a, b) => a.moduleOrder - b.moduleOrder || a.order - b.order);
  }, [modules]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top brand bar */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-95" />
        <header className="relative z-10 max-w-7xl mx-auto px-4 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="font-bold tracking-wide">FSOLS • Course Management</div>
            <div className="flex items-center gap-2">
              <Btn variant="ghost" size="sm" className="text-white/90">Lưu nháp</Btn>
              <Btn variant="primary" size="sm">Xuất bản</Btn>
            </div>
          </div>
          <p className="mt-1 text-white/90 text-sm">Quản lý module, bài học, tài nguyên, kỳ thi & câu hỏi.</p>
        </header>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Quản lý nội dung khoá học #{isNaN(courseId) || courseId === 0 ? 1001 : courseId}</h1>
            <p className="text-slate-600 mt-1">Tạo module/bài học, tải tài nguyên; thêm đề thi & câu hỏi.</p>
          </div>
          <Link to="/courses" className="text-indigo-600 hover:underline">← Quay lại Courses</Link>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modules & Lessons */}
          <Card title="Modules & Lessons" action={<Btn variant="primary" size="sm" onClick={addModule}>+ Module</Btn>}>
            {modules.length === 0 && <div className="text-sm text-slate-500">Chưa có module. Nhấn <b>+ Module</b> để tạo.</div>}
            {modules.slice().sort((a,b)=>a.order-b.order).map((m) => (
              <ModuleCard key={m.id} module={m} onChange={updateModule} />
            ))}
          </Card>

          {/* RIGHT COLUMN */}
          <div className="grid gap-6">
            {/* Course Outline (flat, toàn khoá) */}
            <Card title="Course Outline (flat)">
              {courseFlatOutline.length === 0 ? (
                <div className="text-sm text-slate-500">Chưa có mục nào.</div>
              ) : (
                <ol className="space-y-2">
                  {courseFlatOutline.map((it, i) => (
                    <li key={it.key} className="flex items-center gap-3 rounded-2xl border px-3 py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          it.kind === "Lesson"
                            ? "bg-indigo-50 border-indigo-200"
                            : "bg-amber-50 border-amber-200"
                        }`}
                      >
                        {it.kind}
                      </span>
                      <span className="font-medium">{i + 1}.</span>
                      <span className="font-medium">{it.title}</span>
                      <span className="ml-auto text-xs text-slate-500">
                        Module: {it.moduleTitle} • order: {it.order}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            {/* Exams (tổng hợp) */}
            <Card title="Exams (tổng hợp)">
              {modules.filter(x => x.exam).length === 0 ? (
                <div className="text-sm text-slate-500">Chưa có exam nào.</div>
              ) : (
                <div className="space-y-3">
                  {modules.filter(x=>x.exam).sort((a,b)=> (a.exam!.order - b.exam!.order)).map((m) => (
                    <div key={m.id} className="rounded-2xl border p-3">
                      <div className="font-medium text-slate-900">
                        {m.exam!.title} <span className="text-slate-500">• Module: {m.title}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Số câu hỏi: {m.exam!.questions.length} • Order: {m.exam!.order}
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

/** ================================
 *  Module card (lessons + exam)
 *  ================================ */
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
  const addLesson = (p: { title: string; description?: string; files?: FileList | null }) => {
    const resources: Resource[] = Array.from(p.files ?? []).map((f: File) => ({
      id: ++rid,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
    }));
    const newLesson: Lesson = {
      id: ++lid,
      title: p.title.trim(),
      description: p.description?.trim(),
      order: nextItemOrder(),
      resources,
    };
    onChange({ ...module, lessons: [...module.lessons, newLesson] });
    setOpenAddLesson(false);
    // [BE] POST /manage/module/:moduleId/lessons {title, description, order}
    //      + POST /manage/lesson/:lessonId/resources (multipart)
  };

  // exam
  const createExam = (title: string) => {
    if (module.exam) return; // 1 exam/module (demo)
    const ex: Exam = { id: ++exid, title: title.trim(), order: nextItemOrder(), questions: [] };
    onChange({ ...module, exam: ex });
    setOpenCreateExam(false);
    // [BE] POST /manage/module/:moduleId/exam {title, order}
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
          {module.lessons.length === 0 && <div className="text-sm text-slate-500">Chưa có lesson.</div>}
          {module.lessons.slice().sort((a,b)=>a.order-b.order).map((l) => (
            <div key={l.id} className="rounded-2xl border p-3">
              <div className="font-medium">{l.title} <span className="text-xs text-slate-500">(order: {l.order})</span></div>
              {l.description && <div className="text-sm text-slate-600">{l.description}</div>}
              {l.resources.length > 0 && (
                <div className="mt-2 text-sm">
                  <b>Tài nguyên:</b>
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
            <div className="text-sm text-slate-500 mt-1">Chưa có Exam.</div>
          ) : (
            <ExamBox exam={module.exam} />
          )}
        </div>
      </div>

      {openAddLesson && (
        <Modal title="Add Lesson" onClose={() => setOpenAddLesson(false)}>
          <LessonForm onSubmit={addLesson} />
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

/** ================================
 *  Sub-components (forms / exam)
 *  ================================ */
function LessonForm({ onSubmit }: { onSubmit: (p: { title: string; description?: string; files?: FileList | null }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({ title, description, files });
      }}
    >
      <div className="space-y-3">
        <input className="w-full px-3 py-2 rounded-xl border" placeholder="Lesson title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full px-3 py-2 rounded-xl border min-h-[90px]" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
        <div className="pt-2">
          <Btn variant="primary" type="submit">Save</Btn>
        </div>
      </div>
    </form>
  );
}

function CreateExamForm({ onSubmit }: { onSubmit: (title: string) => void }) {
  const [title, setTitle] = useState("Midterm");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; onSubmit(title); }}>
      <div className="space-y-3">
        <input className="w-full px-3 py-2 rounded-xl border" placeholder="Exam title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <Btn variant="primary" type="submit">Create</Btn>
      </div>
    </form>
  );
}

function ExamBox({ exam }: { exam: Exam }) {
  return (
    <div className="mt-2">
      <div><b>{exam.title}</b> <span className="text-xs text-slate-500">(order: {exam.order})</span></div>
      {exam.questions.length === 0 ? (
        <div className="text-sm text-slate-500 mt-1">Chưa có câu hỏi.</div>
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
  const rows = useMemo(
    () => QUESTION_BANK.filter((it) => (q ? it.text.toLowerCase().includes(q.toLowerCase()) : true)),
    [q]
  );

  const add = (id: number) => {
    const found = QUESTION_BANK.find((x) => x.id === id)!;
    const ex: Exam = { ...exam, questions: [...exam.questions, { questionId: id, points: 1, question: found }] };
    onExamChange(ex);
    // [BE] POST /manage/exam/:examId/questions { questionId, points }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-xl border" placeholder="Tìm câu hỏi…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <Btn>Search</Btn>
      </div>
      <div className="space-y-2 max-h-[50vh] overflow-auto">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border p-3">
            <div>{r.text}</div>
            <Btn variant="primary" className="mt-2" onClick={() => add(r.id)}>Add to Exam</Btn>
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-slate-500">Không có câu hỏi.</div>}
      </div>
    </div>
  );
}

function NewQuestion({ exam, onExamChange }: { exam: Exam; onExamChange: (ex: Exam) => void }) {
  const [type, setType] = useState<"mcq" | "text">("mcq");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);

  // ✅ handler có kiểu rõ ràng, không dùng any
  const onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value === "text" ? "text" : "mcq";
    setType(v);
  };

  const create = () => {
    if (!text.trim()) return;
    const q: Question = {
      id: ++qid,
      type,
      text: text.trim(),
      options: type === "mcq" ? options : undefined,
      correctIndex: type === "mcq" ? correct : null,
    };
    QUESTION_BANK.push(q);
    const ex: Exam = { ...exam, questions: [...exam.questions, { questionId: q.id, points: 1, question: q }] };
    onExamChange(ex);
  };

  return (
    <div className="space-y-3">
      {/* ⬇️ dùng handler đã typed thay cho `as any` */}
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