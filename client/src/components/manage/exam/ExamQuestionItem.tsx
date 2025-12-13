import { useState } from "react";
import type { ExamLocal as Exam } from "../../../types/manage";
import { EditQuestion } from "./EditQuestion";
import { Btn } from "../ui/Btn";
import { Modal } from "../ui/Modal";

export function ExamQuestionItem({
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