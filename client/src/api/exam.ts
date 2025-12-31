// src/api/exam.ts
import client from "../service/client"
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
      accountId,
      answers: data.answers,
    }

    console.log("[v0] Submitting exam with data:", submitData)
    console.log("[v0] Full JSON:", JSON.stringify(submitData, null, 2))

    const res = await client.post("/examSubmission/submit", submitData)

    return res.data
  } catch (error: any) {
    console.error("[v0] Exam submission error:", error.response?.data || error.message)

    const errorMsg =
      error.response?.data?.error || error.response?.data?.message || error.message || "Submission failed"

    throw new Error(errorMsg)
  }
}
