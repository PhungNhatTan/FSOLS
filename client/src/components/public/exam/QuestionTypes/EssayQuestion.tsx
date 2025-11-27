import type { ChangeEvent } from "react";
import type { QuestionTypeProps } from "../../../../types";

export default function EssayQuestion({ question, value, onChange }: QuestionTypeProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(question.QuestionBankId, { answer: e.target.value });
  };

  return (
    <div className="p-4 border rounded-lg">
      <p className="font-semibold mb-2">{question.QuestionText}</p>
      <textarea
        className="border p-2 w-full rounded"
        rows={4}
        value={value?.answer || ""}
        onChange={handleChange}
      />
    </div>
  );
}
