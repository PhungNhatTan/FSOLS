import { useState } from "react";
import { Btn } from "../ui/Btn";
import { Modal } from "../ui/Modal";
import type { UiLesson as Lesson, UiModuleLocal as Module, ExamLocal as Exam } from "../../../types/manage";

import { CreateExamForm } from "../exam/CreateExamForm"

// let rid = 1000;
// let lid = 2000;

// Simple form for creating lessons in draft mode (metadata only)
function SimpleLessonForm({
    onSubmit,
    onCancel,
}: {
    onSubmit: (title: string, description: string) => void;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Please enter a lesson title");
            return;
        }
        onSubmit(title.trim(), description.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lesson Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Introduction to React"
                    autoFocus
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief description of the lesson content"
                />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> After creating the lesson, click on it to add resources
                    (videos, PDFs, documents, etc.) using the "+ Add Resource" button.
                </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Create Lesson
                </button>
            </div>
        </form>
    );
}

export function ModuleCard({
    module,
    onChange,
    onDelete,
    selectedItem,
    onSelectItem,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}: {
    module: Module;
    onChange: (m: Module) => void;
    onDelete: (moduleId: number) => void;
    selectedItem: { moduleId: number; type: "lesson" | "exam"; id: number } | null;
    onSelectItem: (item: { moduleId: number; type: "lesson" | "exam"; id: number }) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}) {
    const [openAddLesson, setOpenAddLesson] = useState(false);
    const [openCreateExam, setOpenCreateExam] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    const nextItemOrder = () => {
        const maxLesson = module.lessons.reduce((mx, l) => Math.max(mx, l.order), 0);
        const maxExam = (module.exams ?? []).reduce((mx, e) => Math.max(mx, e.order), 0);

        return Math.max(maxLesson, maxExam) + 1;
    };

    // Create lesson in draft mode (metadata only, no file upload)
    const handleCreateLesson = (title: string, description: string) => {
        const newLesson: Lesson = {
            id: -Date.now(), // Negative ID for draft items (not in database yet)
            title,
            description,
            order: nextItemOrder(),
            resources: [], // Empty - will be added via LessonDetail later
        };

        onChange({ ...module, lessons: [...module.lessons, newLesson] });
        setOpenAddLesson(false);
    };

    const createExam = (title: string, durationPreset?: string, durationCustom?: number) => {
        const newExam: Exam = {
            id: -Date.now(), // Negative ID for draft items
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

    // Drag and drop handlers for items
    const handleItemDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleItemDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleItemDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
            setDraggedItemIndex(null);
            return;
        }

        const reorderedItems = [...mergedItems];
        const [draggedItem] = reorderedItems.splice(draggedItemIndex, 1);
        reorderedItems.splice(dropIndex, 0, draggedItem);

        // Reassign order values
        const updatedLessons: Lesson[] = [];
        const updatedExams: Exam[] = [];

        reorderedItems.forEach((item, idx) => {
            const newOrder = (idx + 1);
            if (item.type === "lesson") {
                updatedLessons.push({ ...item.item, order: newOrder } as Lesson);
            } else {
                updatedExams.push({ ...item.item, order: newOrder } as Exam);
            }
        });

        onChange({
            ...module,
            lessons: updatedLessons,
            exams: updatedExams,
        });

        setDraggedItemIndex(null);
    };

    return (
        <div className="rounded-2xl border border-slate-200 overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                        {onMoveUp && (
                            <button
                                onClick={onMoveUp}
                                disabled={isFirst}
                                className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move module up"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                        )}
                        {onMoveDown && (
                            <button
                                onClick={onMoveDown}
                                disabled={isLast}
                                className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move module down"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="font-medium text-slate-900">Module {module.order}: {module.title}</div>
                </div>
                <div className="flex items-center gap-2">
                    <Btn size="sm" onClick={() => setOpenAddLesson(true)}>+ Lesson</Btn>
                    <Btn size="sm" onClick={() => setOpenCreateExam(true)}>+ Exam</Btn>
                    <Btn size="sm" variant="outline" onClick={() => onDelete(module.id)} className="text-red-600 border-red-200">Delete</Btn>
                </div>
            </div>

            <div className="p-4">
                <div className="text-slate-600 text-sm mb-2">
                    Items
                    <span className="text-xs text-slate-400 ml-2">(Drag to reorder)</span>
                </div>
                <div className="space-y-2">
                    {mergedItems.length === 0 && <div className="text-sm text-slate-500">No items yet.</div>}
                    {mergedItems.map((entry, index) => {
                        const isSelected =
                            selectedItem?.moduleId === module.id &&
                            selectedItem?.type === entry.type &&
                            selectedItem?.id === entry.item.id;

                        const isDragging = draggedItemIndex === index;

                        return (
                            <div
                                key={`${entry.type}-${module.id}-${entry.item.id}`}
                                draggable
                                onDragStart={(e) => handleItemDragStart(e, index)}
                                onDragOver={handleItemDragOver}
                                onDrop={(e) => handleItemDrop(e, index)}
                                onClick={() =>
                                    onSelectItem({
                                        moduleId: module.id,
                                        type: entry.type,
                                        id: entry.item.id,
                                    })
                                }
                                className={`rounded-2xl border p-3 cursor-move transition ${isDragging
                                        ? "opacity-50 border-indigo-300"
                                        : isSelected
                                            ? "border-indigo-400 bg-indigo-50"
                                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="text-slate-400 cursor-grab active:cursor-grabbing">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                            </svg>
                                        </div>
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

            {/* Simple lesson creation form - no file upload */}
            {openAddLesson && (
                <Modal title="Create Lesson" onClose={() => setOpenAddLesson(false)}>
                    <SimpleLessonForm
                        onSubmit={handleCreateLesson}
                        onCancel={() => setOpenAddLesson(false)}
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