export type QuestionType = "MCQ" | "Fill" | "Essay" | "TF";

export interface AnswerInput {
  text: string;
  isCorrect: boolean;
}

export interface CreateQuestionBankPayload {
  questionText: string;
  type: QuestionType;
  answer?: string;
  courseId?: number;
  lessonId?: string;
  answers?: AnswerInput[];
}

export interface QuestionBank {
  Id: string;
  QuestionText: string;
  Type: QuestionType;
  Answer?: string;
  courseId?: number;
  lessonId?: string;
  CreatedAt: string;
  ExamAnswer?: {
    Id: string;
    AnswerText: string;
    IsCorrect: boolean;
  }[];
}