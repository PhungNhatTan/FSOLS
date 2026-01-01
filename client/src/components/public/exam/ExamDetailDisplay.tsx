"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useFetch } from "../../../hooks/useFetch"
import * as examApi from "../../../api/exam"
import { useCallback, useEffect, useState } from "react"
import type { ExamData } from "../../../types/exam"

const PRESET_DURATION_MINUTES: Record<string, number> = {
  P_10: 10,
  P_15: 15,
  P_30: 30,
  P_60: 60,
}

const getDurationMinutes = (exam: ExamData): number => {
  // Calculate duration from DurationPreset or DurationCustom
  if (exam.DurationCustom) {
    return exam.DurationCustom
  }
  if (exam.DurationPreset) {
    return PRESET_DURATION_MINUTES[exam.DurationPreset] || 0
  }
  if (exam.Duration && exam.Duration > 0) {
    return exam.Duration
  }
  return 0
}

export default function ExamDetailDisplay() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [sessionScore, setSessionScore] = useState<{ score: number; total: number } | null>(null)

  const fetchExamData = useCallback(() => {
    if (!examId) return Promise.resolve(null)
    return examApi.getWithResult(Number(examId))
  }, [examId])

  const { data, loading, error } = useFetch(fetchExamData, [examId])

  useEffect(() => {
    if (examId) {
      const storedResult = sessionStorage.getItem(`exam_${examId}_result`)
      if (storedResult) {
        try {
          setSessionScore(JSON.parse(storedResult))
        } catch (e) {
          console.error("[v0] Failed to parse stored result:", e)
        }
      }
    }
  }, [examId])

  if (loading) return <p className="text-gray-500 italic">Loading exam...</p>
  if (error) return <p className="text-red-500 font-semibold">{error}</p>
  if (!data) return <p className="text-gray-500 italic">Exam not found.</p>

  const { exam, result } = data
  const hasAttempted = (result !== null && result !== undefined) || sessionScore !== null

  const totalQuestions = sessionScore?.total || exam.Questions?.length || 0
  const scoreData = sessionScore || result
  const score = scoreData?.score || 0
  const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(2) : "0"
  const percentageNum = Number(percentage)
  const isPassed = percentageNum >= 80

  const durationMinutes = getDurationMinutes(exam)
  const durationDisplay = durationMinutes > 0 ? `${durationMinutes} minutes` : "No limit"

  const handleTakeExam = () => {
    navigate(`/exam/${exam.Id}`)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">{exam.Title}</h1>

      {/* Display duration from calculated value instead of exam.Duration */}
      <p className="text-gray-700 mb-2">Duration: {durationDisplay}</p>

      {hasAttempted ? (
        <div
          className={`rounded-lg p-4 mb-4 border ${
            isPassed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          <p className={`font-semibold mb-1 ${isPassed ? "text-green-700" : "text-red-700"}`}>
            {isPassed ? "Exam Passed!" : "Not Passed"}
          </p>
          <p className={`text-lg ${isPassed ? "text-green-600" : "text-red-600"}`}>
            Your Score: {score}/{totalQuestions} ({percentage}%)
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-700 font-semibold">Not Started Yet</p>
          <p className="text-yellow-600">Start taking this exam to see your score.</p>
        </div>
      )}

      <button
        onClick={handleTakeExam}
        className="px-4 py-2 text-white rounded font-medium transition bg-blue-600 hover:bg-blue-700"
      >
        {!hasAttempted ? "Take Exam" : "Retake Exam"}
      </button>
    </div>
  )
}
