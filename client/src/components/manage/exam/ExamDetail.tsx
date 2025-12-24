import { useState } from "react";
import { Btn } from "../ui/Btn";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { ExamQuestionItem } from "./ExamQuestionItem";
import { AddQuestion } from "./AddQuestion";
import type { ExamLocal as Exam, UiModuleLocal as Module } from "../../../types/manage";

export function ExamDetail({
    courseId,
    exam,
    module,
    onModuleChange,
    onExamUpdate,
    onClear,
}: {
    courseId: number;
    exam: Exam;
    module: Module;
    onModuleChange: (m: Module) => void;
    onExamUpdate: (updates: Partial<Exam>) => void;
    onClear: () => void;
}) {
    const [openAddQ, setOpenAddQ] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [title, setTitle] = useState(exam.title);
    const [description, setDescription] = useState(exam.description || "");
    const [durationPreset, setDurationPreset] = useState(exam.durationPreset || "");
    const [durationCustom, setDurationCustom] = useState(exam.durationCustom?.toString() || "");

    const exams = module.exams ?? [];

    const onExamChange = (updated: Exam) => {
        onModuleChange({
            ...module,
            exams: exams.map(e => (e.id === updated.id ? updated : e)),
        });
    };

    const handleSave = () => {
        const updates: Partial<Exam> = {
            title: title.trim() || exam.title,
            description: description.trim(),
            durationPreset: durationPreset || undefined,
            durationCustom: durationCustom ? parseInt(durationCustom) : undefined,
        };
        
        onExamUpdate(updates);
        setEditMode(false);
    };

    const deleteExam = () => {
        if (!confirm("Delete this exam?")) return;

        onModuleChange({
            ...module,
            exams: exams.filter(e => e.id !== exam.id),
        });

        onClear();
    };

    return (
        <Card
            title={`📝 ${exam.title}`}
            action={
                <div className="flex gap-2">
                    {!editMode && (
                        <Btn size="sm" variant="ghost" onClick={() => setEditMode(true)}>
                            Edit
                        </Btn>
                    )}
                    <Btn size="sm" variant="ghost" onClick={onClear}>
                        Clear
                    </Btn>
                </div>
            }
        >
            <div className="space-y-4">
                {editMode ? (
                    <>
                        {/* Edit Mode */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                placeholder="Exam title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                placeholder="Exam description (optional)"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Duration Preset
                                </label>
                                <select
                                    value={durationPreset}
                                    onChange={(e) => {
                                        setDurationPreset(e.target.value);
                                        if (e.target.value) setDurationCustom("");
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                    <option value="">None</option>
                                    <option value="P_15">15 Minutes</option>
                                    <option value="P_30">30 Minutes</option>
                                    <option value="P_60">60 Minutes</option>
                                    <option value="P_90">90 Minutes</option>
                                    <option value="P_120">120 Minutes</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Custom Duration (min)
                                </label>
                                <input
                                    type="number"
                                    value={durationCustom}
                                    onChange={(e) => {
                                        setDurationCustom(e.target.value);
                                        if (e.target.value) setDurationPreset("");
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    placeholder="e.g. 45"
                                    disabled={!!durationPreset}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Btn variant="primary" size="sm" onClick={handleSave}>
                                Save Changes
                            </Btn>
                            <Btn variant="ghost" size="sm" onClick={() => {
                                setEditMode(false);
                                setTitle(exam.title);
                                setDescription(exam.description || "");
                                setDurationPreset(exam.durationPreset || "");
                                setDurationCustom(exam.durationCustom?.toString() || "");
                            }}>
                                Cancel
                            </Btn>
                        </div>
                    </>
                ) : (
                    <>
                        {/* View Mode */}
                        {exam.description && (
                            <div>
                                <div className="text-sm font-semibold text-slate-700">Description</div>
                                <div className="text-sm text-slate-600 mt-1">{exam.description}</div>
                            </div>
                        )}
                        {(exam.durationPreset || exam.durationCustom) && (
                            <div>
                                <div className="text-sm font-semibold text-slate-700">Duration</div>
                                <div className="text-sm text-slate-600 mt-1">
                                    {exam.durationPreset ? exam.durationPreset.replace('P_', '') + ' Minutes' : exam.durationCustom + ' Minutes'}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-slate-600">
                        Questions: {exam.questions.length}
                    </div>
                    <div className="flex gap-2">
                        <Btn size="sm" variant="primary" onClick={() => setOpenAddQ(true)}>
                            + Question
                        </Btn>
                        <Btn
                            size="sm"
                            variant="outline"
                            onClick={deleteExam}
                            className="text-red-600 border-red-200"
                        >
                            Delete
                        </Btn>
                    </div>
                </div>

                {exam.questions.length === 0 ? (
                    <div className="text-sm text-slate-500 py-4">
                        No questions yet. Click + Question to add.
                    </div>
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

            {openAddQ && (
                <Modal title="Add Exam Question" onClose={() => setOpenAddQ(false)}>
                    <AddQuestion
                        courseId={courseId}
                        exam={exam}
                        onExamChange={onExamChange}
                        onClose={() => setOpenAddQ(false)}
                    />
                </Modal>
            )}
        </Card>
    );
}
