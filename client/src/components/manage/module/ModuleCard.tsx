import { useState } from "react";
import LessonUploadForm from "../lesson/LessonUploadForm";
import { Btn } from "../ui/Btn";
import { Modal } from "../ui/Modal";
import type { UiLesson as Lesson, UiModuleLocal as Module, ExamLocal as Exam } from "../../../types/manage";
import type { Lesson as ApiLesson } from "../../../types/lesson";

import { CreateExamForm } from "../exam/CreateExamForm"

let rid = 1000;
let lid = 2000;


export function ModuleCard({
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
        const maxExam = (module.exams ?? []).reduce((mx, e) => Math.max(mx, e.order), 0);

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
        onChange({ ...module, exams: [...(module.exams ?? []), newExam] });
        setOpenCreateExam(false);
    };

    const lessons = module.lessons ?? [];
    const exams = module.exams ?? [];

    const mergedItems = [
        ...lessons.map((l) => ({ type: "lesson" as const, item: l, order: l.order })),
        ...exams.map((e) => ({ type: "exam" as const, item: e, order: e.order })),
    ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));


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
                                className={`rounded-2xl border p-3 cursor-pointer transition ${isSelected
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
