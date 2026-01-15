import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { courseManagementApi } from "../../api/courseManagement";
import categoryApi, { Category as CategoryType } from "../../api/category";
import { AuthContext } from "../../context/authContext";
import type {
  UiLessonLocal as Lesson,
  UiModuleLocal as Module,
  ExamLocal as Exam,
} from "../../types/manage";
import type { Course, DraftJson } from "../../types/course";
import { Btn } from "../../components/manage/ui/Btn";
import { Card } from "../../components/manage/ui/Card";
import { ModuleCard } from "../../components/manage/module/ModuleCard";
import { LessonDetail } from "../../components/manage/lesson/LessonDetail";
import { ExamDetail } from "../../components/manage/exam/ExamDetail";
import {
  mapLocalToDraft,
  mapDraftToLocal,
  validateDraft,
  getDraftStats,
  generateNegativeId,
  mapStructureToDraft,
} from "../../service/CourseManagementService";

export default function CourseManagePage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id ?? 0);
  const { user } = useContext(AuthContext);

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [skills, setSkills] = useState<{ id: number; skillName: string }[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ moduleId: number; type: "lesson" | "exam"; id: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("Never");
  const [verificationStatus, setVerificationStatus] = useState<{
    ApprovalStatus: string;
    RequestType: string;
    CreatedAt: string;
    ReviewedAt?: string
  } | null>(null);

  const moveModuleUp = (moduleId: number) => {
    const index = modules.findIndex(m => m.id === moduleId);
    if (index <= 0) return; // Already first

    const reordered = [...modules];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];

    // Reassign order values
    reordered.forEach((m, idx) => {
      m.order = (idx + 1);
    });

    setModules(reordered);
  };

  // Move module down in order
  const moveModuleDown = (moduleId: number) => {
    const index = modules.findIndex(m => m.id === moduleId);
    if (index < 0 || index >= modules.length - 1) return; // Already last

    const reordered = [...modules];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];

    // Reassign order values
    reordered.forEach((m, idx) => {
      m.order = (idx + 1);
    });

    setModules(reordered);
  };

  const onDeselect = () => setSelectedItem(null);

  // Load initial data
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    loadCourseData();
    loadVerificationStatus();
  }, [courseId]);

  const loadCourseData = async () => {
    if (courseId <= 0) return;
    if (modules.length > 0) return;

    try {
      // Load categories
      const cats = await categoryApi.getAll();
      setCategories(cats);

      // Always load base course metadata
      const structure = await courseManagementApi.getStructure(courseId);
      setCourse(structure.course);

      let draftLoaded = false;

      try {
        const draftResponse = await courseManagementApi.getDraft(courseId);

        if (draftResponse?.draft) {
          const draft: DraftJson =
            typeof draftResponse.draft === "string"
              ? JSON.parse(draftResponse.draft)
              : draftResponse.draft;

          if (draft && Array.isArray(draft.modules) && draft.modules.length > 0) {
            const { modules, skills, categoryId } = mapDraftToLocal(draft);
            setModules(modules);
            setSkills(skills);
            setSelectedCategoryId(categoryId);
            setLastSaved(
              `Draft loaded (${new Date(draft.lastModified).toLocaleString()})`
            );
            draftLoaded = true;
          } else {
            throw new Error("Draft exists but is invalid");
          }
        }

      } catch (err) {
        console.warn("Draft ignored, falling back to structure:", err);
      }


      if (!draftLoaded) {
        setSelectedItem(null);

        const draft = mapStructureToDraft(structure);
        const { modules, skills, categoryId } = mapDraftToLocal(draft);

        setModules(modules);
        setSkills(skills);
        setSelectedCategoryId(categoryId);
      }
    } catch (err) {
      console.error("Error loading course:", err);
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
    if (!course) return;

    setSaving(true);
    try {
      const draft = mapLocalToDraft(course, modules, skills, user?.accountId ?? null, selectedCategoryId);
      const validation = validateDraft(draft);

      if (!validation.valid) {
        console.warn("Draft has validation errors:", validation.errors);
      }

      await courseManagementApi.saveDraft(courseId, draft);
      setLastSaved(new Date().toLocaleTimeString());
      setTimeout(() => setSaving(false), 500);
    } catch (err) {
      console.error("Error saving draft:", err);
      setSaving(false);
      alert("Failed to save draft. Please try again.");
    }
  };

  const publish = async () => {
    if (!course) return;

    const draft = mapLocalToDraft(course, modules, skills, user?.accountId ?? null, selectedCategoryId);
    const validation = validateDraft(draft);

    if (!validation.valid) {
      alert(`Cannot publish. Please fix these issues:\n\n${validation.errors.join("\n")}`);
      return;
    }

    if (validation.warnings.length > 0) {
      const proceed = confirm(
        `There are some warnings:\n\n${validation.warnings.join("\n")}\n\nDo you want to proceed?`
      );
      if (!proceed) return;
    }

    setPublishing(true);
    try {
      // Save draft first
      await courseManagementApi.saveDraft(courseId, draft);

      // Request verification
      await courseManagementApi.requestVerification(courseId);

      setLastSaved("Verification requested");
      await loadVerificationStatus();

      alert("Your course has been submitted for verification!");
    } catch (err) {
      console.error("Error requesting verification:", err);
      alert("Failed to submit for verification. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const addModule = () => {
    const title = prompt("Module title:");
    if (!title) return;

    const newModule: Module = {
      id: generateNegativeId(),
      title: title.trim(),
      order: Math.max(1, ...modules.map(m => m.order), 1),
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

  const updateCourse = (updates: Partial<Course>) => {
    if (!course) return;
    setCourse({ ...course, ...updates });
  };

  // Update lesson with new data
  const updateLesson = (moduleId: number, lessonId: number, updates: Partial<Lesson>) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    const updatedLessons = module.lessons.map(l =>
      l.id === lessonId ? { ...l, ...updates } : l
    );

    updateModule({ ...module, lessons: updatedLessons });
  };

  // Update exam with new data
  const updateExam = (moduleId: number, examId: number, updates: Partial<Exam>) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    const updatedExams = module.exams.map(e =>
      e.id === examId ? { ...e, ...updates } : e
    );

    updateModule({ ...module, exams: updatedExams });
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

  const stats = course ? getDraftStats(mapLocalToDraft(course, modules, skills, null, selectedCategoryId)) : null;

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
              <Btn
                variant="ghost"
                size="sm"
                className="text-white/90"
                onClick={saveDraft}
                disabled={saving || !course}
              >
                {saving ? "Saving..." : "Save Draft"}
              </Btn>
              <Btn
                variant="primary"
                size="sm"
                onClick={publish}
                disabled={publishing || verificationStatus?.ApprovalStatus === "Pending" || !course}
              >
                {publishing ? "Requesting..." : verificationStatus?.ApprovalStatus === "Pending" ? "Pending Review" : "Send for Verification"}
              </Btn>
            </div>
          </div>
          <p className="mt-1 text-white/90 text-sm">
            Manage modules, lessons, resources, exams & questions.
          </p>
        </header>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {course?.Name || `Manage Course Content #${courseId}`}
            </h1>
            <p className="text-slate-600 mt-1">
              {course?.Description || "Create modules/lessons, upload resources; add exams & questions."}
            </p>
          </div>
          <Link to="/manage/courses" className="text-indigo-600 hover:underline">
            ← Back to Courses
          </Link>
        </div>

        {/* Course Info Section */}
        {course && (
          <Card title="Course Information" className="mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={course.Name}
                    onChange={(e) => updateCourse({ Name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategoryId ?? ""}
                    onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={course.Description}
                  onChange={(e) => updateCourse({ Description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </Card>
        )}

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
          <Card
            title="Modules & Items"
            action={
              <Btn variant="primary" size="sm" onClick={addModule}>
                + Module
              </Btn>
            }
          >
            {modules.length === 0 && (
              <div className="text-sm text-slate-500">
                No modules yet. Click <b>+ Module</b> to create.
              </div>
            )}
            {modules
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((m, index) => (
                <ModuleCard
                  key={`module-${m.id}`}
                  module={m}
                  onChange={updateModule}
                  onDelete={deleteModule}
                  selectedItem={selectedItem}
                  onSelectItem={setSelectedItem}
                  onMoveUp={() => moveModuleUp(m.id)}
                  onMoveDown={() => moveModuleDown(m.id)}
                  isFirst={index === 0}
                  isLast={index === modules.length - 1}
                />
              ))}
          </Card>

          {/* RIGHT COLUMN */}
          <div className="grid gap-6">
            {verificationStatus && (
              <Card title="Verification Status">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status:</span>
                    <span
                      className={`text-sm font-medium px-2.5 py-1 rounded-full ${verificationStatus.ApprovalStatus === "Pending"
                        ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        : verificationStatus.ApprovalStatus === "Approved"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                    >
                      {verificationStatus.ApprovalStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Type:</span>
                    <div className="text-sm font-medium mt-1">
                      {verificationStatus.RequestType}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Requested:</span>
                    <div className="text-sm mt-1">
                      {new Date(verificationStatus.CreatedAt).toLocaleDateString()}
                    </div>
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
              onLessonUpdate={(updates) => {
                if (selectedItem && selectedItem.type === "lesson") {
                  updateLesson(selectedItem.moduleId, selectedItem.id, updates);
                }
              }}
              onExamUpdate={(updates) => {
                if (selectedItem && selectedItem.type === "exam") {
                  updateExam(selectedItem.moduleId, selectedItem.id, updates);
                }
              }}
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
  onLessonUpdate,
  onExamUpdate,
  onClear,
}: {
  selectedItem: { moduleId: number; type: "lesson" | "exam"; id: number } | null;
  courseId: number;
  lesson?: Lesson;
  exam?: Exam;
  module?: Module;
  onModuleChange: (m: Module) => void;
  onLessonUpdate: (updates: Partial<Lesson>) => void;
  onExamUpdate: (updates: Partial<Exam>) => void;
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
          courseId={courseId}
          onUpdate={onLessonUpdate}
          onClear={onClear}
        />
      )}
      {exam && module && (
        <ExamDetail
          courseId={courseId}
          exam={exam}
          module={module}
          onModuleChange={onModuleChange}
          onExamUpdate={onExamUpdate}
          onClear={onClear}
        />
      )}
    </>
  );
}