import type { QuestionType, AnswerInput } from "../../types/questionBank";

interface QuestionBankFieldsProps {
  form: {
    questionText: string;
    type: QuestionType;
    answer: string;
    courseId: string;
    lessonId: string;
    answers: AnswerInput[];
  };
  onChange: <K extends keyof QuestionBankFieldsProps["form"]>(
    field: K,
    value: QuestionBankFieldsProps["form"][K]
  ) => void;
}

export default function QuestionBankFields({ form, onChange }: QuestionBankFieldsProps) {
  return (
    <>
      <div>
        <label className="block font-medium mb-1">Question Text</label>
        <textarea
          value={form.questionText}
          onChange={(e) => onChange("questionText", e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Enter the question text"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Question Type</label>
        <select
          value={form.type}
          onChange={(e) => onChange("type", e.target.value as QuestionType)}
          className="w-full border rounded p-2"
        >
          <option value="MCQ">Multiple Choice</option>
          <option value="Fill">Fill in the Blank</option>
          <option value="Essay">Essay</option>
          <option value="TF">True/False</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Course ID</label>
          <input
            type="number"
            value={form.courseId}
            onChange={(e) => onChange("courseId", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Lesson ID</label>
          <input
            type="text"
            value={form.lessonId}
            onChange={(e) => onChange("lessonId", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Optional"
          />
        </div>
      </div>
    </>
  );
}
