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
    onClear,
}: {
    courseId: number;
    exam: Exam;
    module: Module;
    onModuleChange: (m: Module) => void;
    onClear: () => void;
}) {
    const [openAddQ, setOpenAddQ] = useState(false);

    const exams = module.exams ?? [];

    const onExamChange = (updated: Exam) => {
        onModuleChange({
            ...module,
            exams: exams.map(e => (e.id === updated.id ? updated : e)),
        });
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
                <Btn size="sm" variant="ghost" onClick={onClear}>
                    Clear
                </Btn>
            }
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between">
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
