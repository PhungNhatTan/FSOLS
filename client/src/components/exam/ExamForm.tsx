import Question from "./Question";
import type { ExamFormProps } from "../../types";

export default function ExamForm({
  exam,
  answers,
  setAnswers,
  onSubmit,
  submitted,
}: ExamFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {exam.Questions.map((q) => (
        <Question
          key={q.ExamQuestionId}
          question={q}
          value={answers[q.QuestionBankId]}
          onChange={(questionId, data) =>
            setAnswers((prev) => ({
              ...prev,
              [questionId]: { questionId, ...data },
            }))
          }
        />
      ))}

      {!submitted && (
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Submit Exam
        </button>
      )}
    </form>
  );
}
