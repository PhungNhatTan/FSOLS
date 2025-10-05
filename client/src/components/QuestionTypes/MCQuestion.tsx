import type { QuestionData, QuestionValue, Answer } from "./types";

interface MCQuestionProps {
  question: QuestionData & { Answers: Answer[] };
  value: QuestionValue | null;
  onChange: (questionId: string, data: Partial<QuestionValue>) => void;
}

export default function MCQuestion({ question, value, onChange }: MCQuestionProps) {
  return (
    <div className="p-4 border rounded-lg">
      <p className="font-semibold mb-2">{question.QuestionText}</p>
      {question.Answers.map((a) => (
        <label key={a.Id} className="block">
          <input
            type="radio"
            name={question.ExamQuestionId}
            value={a.Id}
            checked={value?.answerId === a.Id}
            onChange={() => onChange(question.QuestionBankId, { answerId: a.Id })}
          />{" "}
          {a.AnswerText}
        </label>
      ))}
    </div>
  );
}