import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { courseManagementApi } from "../../api/courseManagement";
import type {
  UiLessonLocal as Lesson,
  UiModuleLocal as Module,
  ExamLocal as Exam,
  UiLesson as LessonDto,
  UiModule as ModuleDto,
  UiExam as ExamDto,
  UiResource as ResourceDto,
} from "../../types/manage";
import type { ExamQuestion as ExamQuestionDto } from "../../types/exam";

import { Btn } from "../../components/manage/ui/Btn";
import { Card } from "../../components/manage/ui/Card";
import { ModuleCard } from "../../components/manage/module/ModuleCard";
import { LessonDetail } from "../../components/manage/lesson/LessonDetail";
import { ExamDetail } from "../../components/manage/exam/ExamDetail";

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

export default function CourseManagePage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id ?? 0);

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ moduleId: number; type: "lesson" | "exam"; id: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("Never");
  const [verificationStatus, setVerificationStatus] = useState<{ ApprovalStatus: string; RequestType: string; CreatedAt: string; ReviewedAt?: string } | null>(null);

  const onDeselect = () => setSelectedItem(null);


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
            {modules.slice().sort((a, b) => a.order - b.order).map((m) => (
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
                    <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${verificationStatus.ApprovalStatus === "Pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
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
            <DetailCard
              selectedItem={selectedItem}
              lesson={lesson}
              exam={exam}
              module={module}
              courseId={courseId}
              onModuleChange={updateModule}
              onClear={onDeselect}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailCard({
  selectedItem,
  courseId,
  lesson,
  exam,
  module,
  onModuleChange,
  onClear,
}: {
  selectedItem: { moduleId: number; type: "lesson" | "exam"; id: number } | null;
  courseId: number;
  lesson?: Lesson;
  exam?: Exam;
  module?: Module;
  onModuleChange: (m: Module) => void;
  onClear: () => void;
}) {
  if (!selectedItem) {
    return (
      <Card title="Details">
        <div className="text-sm text-slate-500">
          Select a lesson or exam to view details.
        </div>
      </Card>
    );
  }

  return (
    <>
      {lesson && (
        <LessonDetail
          lesson={lesson}
          onClear={onClear}
        />
      )}

      {exam && module && (
        <ExamDetail
          courseId={courseId}
          exam={exam}
          module={module}
          onModuleChange={onModuleChange}
          onClear={onClear}
        />
      )}
    </>
  );
}
