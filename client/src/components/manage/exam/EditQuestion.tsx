import { useState } from "react";
import type { ExamLocal as Exam } from "../../../types/manage";
import { Btn } from "../ui/Btn";

export function EditQuestion({
    question,
    index,
    exam,
    onExamChange,
    onClose,
}: {
    courseId: number;
    question: Exam["questions"][number];
    index: number;
    exam: Exam;
    onExamChange: (ex: Exam) => void;
    onClose: () => void;
}) {
    const [type, setType] = useState<"mcq" | "text">(question.question?.type === "mcq" ? "mcq" : "text");
    const [text, setText] = useState(question.question?.text || "");
    const [options, setOptions] = useState<string[]>(
        question.question?.options && question.question.options.length > 0
            ? question.question.options
            : ["", "", "", ""]
    );
    const [correct, setCorrect] = useState(0);
    const [error, setError] = useState("");

    const onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value === "text" ? "text" : "mcq";
        setType(v);
    };

    const handleSave = () => {
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
        const updatedQuestion: Exam["questions"][number] = {
            ...question,
            question: {
                ...(question.question || {}),
                id: question.question?.id ?? Date.now(),
                type: type as "mcq" | "text",
                text: text.trim(),
                options: type === "mcq" ? filteredOptions : undefined,
                correctIndex: type === "mcq" ? correct : undefined,
            },
        };

        const updatedQuestions = exam.questions.map((q, i) => i === index ? updatedQuestion : q);
        onExamChange({ ...exam, questions: updatedQuestions });
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
            <div className="flex gap-2">
                <Btn variant="primary" onClick={handleSave} className="flex-1">
                    Save Changes
                </Btn>
                <Btn onClick={onClose}>
                    Cancel
                </Btn>
            </div>
        </div>
    );
}