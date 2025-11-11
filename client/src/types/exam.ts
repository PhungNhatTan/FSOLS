export interface ExamAnswer {
  Id: string;
  AnswerText: string;
}

export interface ExamQuestion {
  ExamQuestionId: string;
  QuestionBankId: string;
  QuestionText: string;
  Type: "MCQ" | "TF" | "Fill" | "Essay";
  Answers: ExamAnswer[];
}

export interface Exam {
  Id: number;
  Title: string;
}

export interface ExamData extends Exam {
  Duration: number;
  Questions: ExamQuestion[];
}

export interface ExamResult {
  score: number;
  total: number;
}

export interface ExamDetailWithResult {
  exam: ExamData;
  result: ExamResult | null;
}

export interface StudentAnswer {
  questionId: string;
  answerId?: string;
  answerIds?: string[];
  answer?: string;
}

export interface StudentAnswer {
  questionId: string;
  answerId?: string;
  answerIds?: string[];
  answer?: string;
}

export interface QuestionValue {
  answerId?: string;
  answer?: string;
}

export interface QuestionTypeProps {
  question: ExamQuestion;
  value: QuestionValue | null;
  onChange: (questionId: string, data: Partial<QuestionValue>) => void;
}

export type QuestionProps = QuestionTypeProps;

export interface ExamFormProps {
  exam: ExamData;
  answers: Record<string, StudentAnswer>;
  setAnswers: React.Dispatch<
    React.SetStateAction<Record<string, StudentAnswer>>
  >;
  onSubmit: (e: React.FormEvent) => void;
  submitted: boolean;
}

export interface TimerProps {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  onExpire: () => void;
  submitted: boolean;
}
