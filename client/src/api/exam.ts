import http from "../service/http"; // axios instance
import { getAccountId } from "./auth";

// ==== Types ====
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
  answerId?: string;
  answerIds?: string[];
  answer?: string;
}

export async function get(examId: number): Promise<ExamData> {
  const res = await http.get<ExamData>(`/exam/${examId}`);
  return res.data;
}

export async function submit(data: {
  examId: number;
  answers: StudentAnswer[];
}) {
  const accountId = getAccountId();
  if (!accountId) throw new Error("User not authenticated");

  const res = await http.post("/examSubmission/submit", {
    ...data,
    accountId,
  });
  return res.data;
}
