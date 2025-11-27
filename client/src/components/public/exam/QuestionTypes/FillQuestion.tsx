import type { ChangeEvent } from "react";
import type { QuestionTypeProps } from "../../../../types";

export default function FillQuestion({ question, value, onChange }: QuestionTypeProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(question.QuestionBankId, { answer: e.target.value });
  };

  return (
    <div className="p-4 border rounded-lg">
      <p className="font-semibold mb-2">{question.QuestionText}</p>
      <input
        type="text"
        className="border p-2 w-full rounded"
        value={value?.answer || ""}
        onChange={handleChange}
      />
    </div>
  );
}
