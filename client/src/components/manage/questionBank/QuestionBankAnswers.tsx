import type { AnswerInput } from "../../../types/questionBank";

interface QuestionBankAnswersProps {
  answers: AnswerInput[];
  onChange: <K extends keyof AnswerInput>(
    index: number,
    field: K,
    value: AnswerInput[K]
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function QuestionBankAnswers({
  answers,
  onChange,
  onAdd,
  onRemove,
}: QuestionBankAnswersProps) {
  return (
    <div>
      <label className="block font-medium mb-1">Answer Options</label>

      {answers.map((answer, index) => (
        <div
          key={index}
          className="flex items-center gap-2 mb-2 border rounded p-2"
        >
          <input
            type="text"
            value={answer.text}
            onChange={(e) => onChange(index, "text", e.target.value)}
            className="flex-1 border rounded p-2"
            placeholder={`Answer ${index + 1}`}
          />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={answer.isCorrect}
              onChange={(e) => onChange(index, "isCorrect", e.target.checked)}
            />
            Correct
          </label>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add Answer
      </button>
    </div>
  );
}
