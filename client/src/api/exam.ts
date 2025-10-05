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

export interface ExamData {
  Id: number;
  Title: string;
  Duration: number;
  Questions: ExamQuestion[];
}

export interface StudentAnswer {
  questionId: string;
  answerId?: string; // for single choice
  answerIds?: string[]; // for multi choice
  answer?: string; // for essay
}

export async function getExam(examId: number): Promise<ExamData> {
  const res = await fetch(`/api/exam/${examId}`);
  if (!res.ok) throw new Error("Failed to fetch exam");
  return res.json();
}

export async function submitExam(data: {
  examId: number;
  accountId: string;
  answers: StudentAnswer[];
}) {
  const res = await fetch("/api/exam-submission/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit exam");
  return res.json();
}
