// src/components/public/exam/Question.tsx
import { MCQuestion, FillQuestion, EssayQuestion } from "./QuestionTypes/index";
import type { QuestionProps } from "../../../types";

export default function Question({ question, value, onChange }: QuestionProps) {
  switch (question.Type) {
    case "MCQ":
    case "TF":
      return <MCQuestion question={question} value={value} onChange={onChange} />;
    case "Fill":
      return <FillQuestion question={question} value={value} onChange={onChange} />;
    case "Essay":
      return <EssayQuestion question={question} value={value} onChange={onChange} />;
    default:
      return null;
  }
}
