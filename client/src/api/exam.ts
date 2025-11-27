// src/api/exam.ts
import client from "../service/client";
import type { ExamData, ExamDetailWithResult, StudentAnswer } from "../types";
import { getAccountId } from "../utils/auth";

export const get = async (examId: number): Promise<ExamData> => {
  const res = await client.get<ExamData>(`/exam/${examId}`);
  return res.data;
};

export const getWithResult = async (
  examId: number
): Promise<ExamDetailWithResult> => {
  const accountId = getAccountId();
  if (!accountId) throw new Error("User not authenticated");

  const res = await client.get<{ exam: ExamData; result: { score: number } | null }>(
    `/exam/${examId}?accountId=${accountId}`
  );

  return res.data as ExamDetailWithResult;
};

export const submit = async (data: { examId: number; answers: StudentAnswer[] }) => {
  const accountId = getAccountId();
  if (!accountId) throw new Error("User not authenticated");

  const res = await client.post("/examSubmission/submit", {
    ...data,
    accountId,
  });

  return res.data;
};