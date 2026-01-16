// src/api/exam.ts
import client, { isAxiosError} from "../service/client"
import type { ExamData, ExamDetailWithResult, StudentAnswer } from "../types"
import { getAccountId } from "../utils/auth"

export const get = async (examId: number): Promise<ExamData> => {
  const res = await client.get<ExamData>(`/exam/takingExam/${examId}`)
  return res.data
}

export const getWithResult = async (examId: number): Promise<ExamDetailWithResult> => {
  const res = await client.get<{
    exam: ExamData
    result: { Id?: number; Score?: number; SubmittedAt?: string } | null
  }>(`/exam/${examId}`)

  return res.data as ExamDetailWithResult
}

export const submit = async (data: { examId: number; answers: StudentAnswer[] }) => {
  const accountId = getAccountId()
  if (!accountId) throw new Error("User not authenticated")

  try {
    const submitData = {
      examId: data.examId,
      answers: data.answers,
    }

    const res = await client.post("/examSubmission/submit", submitData)

    return res.data
  } catch (error: unknown) {
    let errorMsg = "Submission failed";

    // Preserve server error code/metadata so callers can handle course time-limit locks.
    let errorCode: string | undefined
    let secondsUntilCanEnroll: number | undefined
    let canEnrollAt: string | undefined

    if (isAxiosError(error)) {
      console.error("[v0] Exam submission error:", error.response?.data || error.message);
      errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || errorMsg;

      errorCode = error.response?.data?.code
      secondsUntilCanEnroll = error.response?.data?.secondsUntilCanEnroll
      canEnrollAt = error.response?.data?.canEnrollAt
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }

    const e: any = new Error(errorMsg)
    if (errorCode) e.code = errorCode
    if (typeof secondsUntilCanEnroll === "number") e.secondsUntilCanEnroll = secondsUntilCanEnroll
    if (canEnrollAt) e.canEnrollAt = canEnrollAt
    throw e
  }
}
