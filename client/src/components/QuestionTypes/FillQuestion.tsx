import type { ChangeEvent } from "react";
import type { QuestionData, QuestionValue } from "./types";

interface FillQuestionProps {
  question: QuestionData;
  value: QuestionValue | null;
  onChange: (questionId: string, data: Partial<QuestionValue>) => void;
}

export default function FillQuestion({ question, value, onChange }: FillQuestionProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(question.QuestionBankId, { answer: e.target.value });
  };

  return (
    <div className="p-4 border rounded-lg">
      <p className="font-semibold mb-2">{question.QuestionText}</p>
      <input
        type="text"
        className="border p-2 w-full"
        value={value?.answer || ""}
        onChange={handleChange}
      />
    </div>
  );
}
