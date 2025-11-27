import client from "../service/client";
import type { CreateQuestionBankPayload, QuestionBank } from "../types/questionBank";

export const create = async (data: CreateQuestionBankPayload): Promise<QuestionBank> => {
  const res = await client.post("/manage/questionBank", data);
  return res.data;
};