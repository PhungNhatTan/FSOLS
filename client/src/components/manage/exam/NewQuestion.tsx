import { useState } from "react";
import type { ExamLocal as Exam } from "../../../types/manage";
import { Btn } from "../ui/Btn";

export function NewQuestion({ exam, onExamChange, onClose }: { courseId: number; exam: Exam; onExamChange: (ex: Exam) => void; onClose: () => void }) {
  const [type, setType] = useState<"mcq" | "text">("mcq");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState("");

  const onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value === "text" ? "text" : "mcq";
    setType(v);
  };

  const create = () => {
    setError("");
    if (!text.trim()) {
      setError("Question text is required");
      return;
    }
    if (type === "mcq" && options.filter((o) => o.trim()).length < 2) {
      setError("MCQ needs at least 2 options");
      return;
    }

    const filteredOptions = type === "mcq" ? options.filter((o) => o.trim()) : [];
    const newQuestion: Exam["questions"][number] = {
      examQuestionId: `local_${Date.now()}`,
      questionId: Date.now(),
      points: 1,
      question: {
        id: Date.now(),
        type: type as "mcq" | "text",
        text: text.trim(),
        options: type === "mcq" ? filteredOptions : undefined,
        correctIndex: type === "mcq" ? correct : undefined,
      },
    };

    onExamChange({ ...exam, questions: [...exam.questions, newQuestion] });
    setText("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    onClose();
  };

  return (
    <div className="space-y-3">
      <select className="w-full px-3 py-2 rounded-xl border" value={type} onChange={onTypeChange}>
        <option value="mcq">Multiple Choice</option>
        <option value="text">Text</option>
      </select>
      <textarea className="w-full px-3 py-2 rounded-xl border min-h-[90px]" placeholder="Question text" value={text} onChange={(e) => setText(e.target.value)} />
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
      {error && <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <Btn variant="primary" onClick={create}>Create & Attach</Btn>
    </div>
  );
}