import { useEffect, useState } from "react";
import type { ExamLocal as Exam } from "../../../types/manage";
import type { UiQuestionSearchItem } from "../../../types/manage";
import { courseManagementApi } from "../../../api/courseManagement";
import { Btn } from "../ui/Btn";

export function BankPicker({ courseId, exam, onExamChange, onClose }: { courseId: number; exam: Exam; onExamChange: (ex: Exam) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [allQuestions, setAllQuestions] = useState<UiQuestionSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseQuestions = async () => {
      setLoading(true);
      try {
        const result = await courseManagementApi.getQuestionsByCourse(courseId);
        setAllQuestions(result.items);
      } catch (err) {
        console.error("Error loading course questions:", err);
        setAllQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourseQuestions();
  }, [courseId]);

  const addedQuestionIds = new Set(exam.questions.map(eq => String(eq.questionId)));
  const filteredQuestions = allQuestions.filter(question => !addedQuestionIds.has(String(question.id)));
  const displayedQuestions = q.trim()
    ? filteredQuestions.filter(question => question.text.toLowerCase().includes(q.trim().toLowerCase()))
    : filteredQuestions;

  const add = (id: string) => {
    const question = allQuestions.find(q => q.id === id);
    if (!question) return;
    const newQuestion: Exam["questions"][number] = {
      examQuestionId: `local_${Date.now()}`,
      questionId: Number(id),
      points: 1,
      question: {
        id: Number(id),
        type: question.type === "MCQ" ? "mcq" : "text",
        text: question.text,
        options: [],
      },
    };
    onExamChange({ ...exam, questions: [...exam.questions, newQuestion] });
    onClose();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl border"
          placeholder="Search questions…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-2 max-h-[50vh] overflow-auto">
        {loading && <div className="text-sm text-slate-500">Loading questions…</div>}
        {!loading && displayedQuestions.length === 0 && (
          <div className="text-sm text-slate-500">
            {q.trim() ? "No matching questions found." : "All available questions have been added."}
          </div>
        )}
        {!loading && displayedQuestions.map((r) => (
          <div key={r.id} className="rounded-2xl border p-3">
            <div className="text-sm">{r.text}</div>
            <div className="text-xs text-slate-500 mt-1">Type: {r.type}</div>
            <Btn variant="primary" size="sm" className="mt-2" onClick={() => add(r.id)}>Add to Exam</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}