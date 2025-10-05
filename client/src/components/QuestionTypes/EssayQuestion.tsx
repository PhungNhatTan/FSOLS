import type { ChangeEvent } from "react";
import type { QuestionData, QuestionValue } from "./types";

interface EssayQuestionProps {
  question: QuestionData;
  value: QuestionValue | null;
  onChange: (questionId: string, data: Partial<QuestionValue>) => void;
}

export default function EssayQuestion({ question, value, onChange }: EssayQuestionProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(question.QuestionBankId, { answer: e.target.value });
  };

  return (
    <div className="p-4 border rounded-lg">
      <p className="font-semibold mb-2">{question.QuestionText}</p>
      <textarea
        className="border p-2 w-full"
        rows={4}
        value={value?.answer || ""}
        onChange={handleChange}
      />
    </div>
  );
}
