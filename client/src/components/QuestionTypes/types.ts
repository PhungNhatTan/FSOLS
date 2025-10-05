// src/components/QuestionTypes/types.ts
export interface Answer {
  Id: string;
  AnswerText: string;
}

export interface QuestionData {
  ExamQuestionId: string;
  QuestionBankId: string;
  QuestionText: string;
  Type: "MCQ" | "TF" | "Fill" | "Essay";
  Answers?: Answer[];
}

export interface QuestionValue {
  answerId?: string;
  answer?: string;
}

export interface QuestionTypeProps {
  question: QuestionData;
  value: QuestionValue | null;
  onChange: (questionId: string, data: Partial<QuestionValue>) => void;
}
