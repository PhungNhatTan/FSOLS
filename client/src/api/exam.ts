// src/api/exam.ts
import client, { isAxiosError} from "../service/client"
import type { ExamData, ExamDetailWithResult, StudentAnswer } from "../types"
import { getAccountId } from "../utils/auth"

export interface ExamEligibility {
  allowed: boolean
  isFinalExam?: boolean
  finalExamId?: number | null
  code?: string
  message?: string
  missingExams?: Array<{ Id: number; Title?: string; passingScore?: number; questionCount?: number }>
}

export const get = async (examId: number): Promise<ExamData> => {
  try {
    const res = await client.get<ExamData>(`/exam/takingExam/${examId}`)
    return res.data
  } catch (error: unknown) {
    let errorMsg = "Failed to load exam"
    let errorCode: string | undefined
    let missingExams: any[] | undefined
    let finalExamId: number | undefined

    if (isAxiosError(error)) {
      errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || errorMsg
      errorCode = error.response?.data?.code
      missingExams = error.response?.data?.missingExams
      finalExamId = error.response?.data?.finalExamId
    } else if (error instanceof Error) {
      errorMsg = error.message
    }

    const e: any = new Error(errorMsg)
    if (errorCode) e.code = errorCode
    if (missingExams) e.missingExams = missingExams
    if (typeof finalExamId === "number") e.finalExamId = finalExamId
    throw e
  }
}

export const getWithResult = async (examId: number): Promise<ExamDetailWithResult> => {
  const res = await client.get<{
    exam: ExamData
    result: { Id?: number; Score?: number; SubmittedAt?: string } | null
  }>(`/exam/${examId}`)

  return res.data as ExamDetailWithResult
}

// Used by the exam detail screen to disable "Take Exam" before entering the exam viewer.
export const checkEligibility = async (examId: number): Promise<ExamEligibility> => {
  try {
    const res = await client.get<ExamEligibility>(`/exam/eligibility/${examId}`)
    return res.data
  } catch (error: unknown) {
    let errorMsg = "Failed to check eligibility"
    let errorCode: string | undefined

    if (isAxiosError(error)) {
      errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || errorMsg
      errorCode = error.response?.data?.code
    } else if (error instanceof Error) {
      errorMsg = error.message
    }

    const e: any = new Error(errorMsg)
    if (errorCode) e.code = errorCode
    throw e
  }
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
    let missingExams: any[] | undefined
    let finalExamId: number | undefined

    if (isAxiosError(error)) {
      console.error("[v0] Exam submission error:", error.response?.data || error.message);
      errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || errorMsg;

      errorCode = error.response?.data?.code
      secondsUntilCanEnroll = error.response?.data?.secondsUntilCanEnroll
      canEnrollAt = error.response?.data?.canEnrollAt
      missingExams = error.response?.data?.missingExams
      finalExamId = error.response?.data?.finalExamId
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }

    const e: any = new Error(errorMsg)
    if (errorCode) e.code = errorCode
    if (typeof secondsUntilCanEnroll === "number") e.secondsUntilCanEnroll = secondsUntilCanEnroll
    if (canEnrollAt) e.canEnrollAt = canEnrollAt
    if (missingExams) e.missingExams = missingExams
    if (typeof finalExamId === "number") e.finalExamId = finalExamId
    throw e
  }
}
